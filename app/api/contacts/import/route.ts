import type { Readable } from "node:stream";
import busboy from "busboy";
import { NextResponse } from "next/server";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

// Helper to parse multipart form data in Edge/Node environment
async function parseMultipart(req: Request) {
  return new Promise<{ fileBuffer: Buffer; filename: string }>(
    (resolve, reject) => {
      const headersObj = Object.fromEntries(req.headers.entries());
      // cast headers to simple Record<string,string> to avoid reliance on busboy namespace types
      // busboy retorna um objeto com eventos; usar unknown e em seguida castear
      const _bb = busboy({
        headers: headersObj as Record<string, string>,
      }) as unknown;
      const bb = _bb as {
        on: (...args: unknown[]) => void;
        end: (...args: unknown[]) => void;
      };
      const fileBuffer: Buffer[] = [];
      let filename = "";

      bb.on(
        "file",
        (_fieldname: string, file: Readable, info: { filename?: string }) => {
          filename = info.filename || "";
          file.on("data", (data: Buffer) => fileBuffer.push(Buffer.from(data)));
          file.on("end", () => {
            /* noop */
          });
        },
      );

      bb.on("error", (e: Error) => reject(e));
      bb.on("finish", () =>
        resolve({ fileBuffer: Buffer.concat(fileBuffer), filename }),
      );

      // em alguns ambientes o body já está disponível como arrayBuffer
      req
        .arrayBuffer()
        .then((buf) => {
          bb.end(Buffer.from(buf));
        })
        .catch((e) => reject(e));
    },
  );
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const { fileBuffer, filename } = await parseMultipart(req);
    const isCsv = filename.toLowerCase().endsWith(".csv");

    let contacts: { nome: string; telefone: string }[] = [];

    if (isCsv) {
      const text = fileBuffer.toString("utf8");
      const parsed = Papa.parse<Record<string, string>>(text, { header: true });
      const rows = parsed.data;
      contacts = rows
        .map((row) => {
          const keys = Object.keys(row).reduce(
            (acc: Record<string, string>, key) => {
              acc[key.toLowerCase()] = String(row[key] ?? "").trim();
              return acc;
            },
            {},
          );
          return {
            nome: keys.nome || "",
            telefone: keys.contato || keys.telefone || "",
          };
        })
        .filter((r) => r.nome && r.telefone);
    } else {
      const workbook = XLSX.read(fileBuffer, { type: "buffer" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet) as Array<
        Record<string, unknown>
      >;
      contacts = jsonData
        .map((row) => {
          const keys = Object.keys(row).reduce(
            (acc: Record<string, string>, key) => {
              acc[key.toLowerCase()] = String(row[key] ?? "").trim();
              return acc;
            },
            {},
          );
          return {
            nome: keys.nome || "",
            telefone: keys.contato || keys.telefone || "",
          };
        })
        .filter((r) => r.nome && r.telefone);
    }

    let inserted = 0;
    let updated = 0;
    const sample = contacts.slice(0, 5);

    for (const c of contacts) {
      // normalize telefone: remove non-digits
      const telefone = String(c.telefone || "").replace(/\D/g, "");
      if (!telefone) continue;

      const existing = await prisma.contact.findUnique({ where: { telefone } });
      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: { nome: c.nome, userId },
        });
        updated++;
      } else {
        await prisma.contact.create({
          data: { nome: c.nome, telefone, userId },
        });
        inserted++;
      }
    }

    return NextResponse.json({ inserted, updated, sample });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
