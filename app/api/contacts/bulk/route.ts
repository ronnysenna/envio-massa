import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contacts: { nome: string; telefone: string }[] = body.contacts || [];

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { inserted: 0, updated: 0, message: "Nenhum contato recebido" },
        { status: 400 },
      );
    }

    // require authenticated user
    let user = undefined as unknown;
    try {
      user = await requireUser();
    } catch (e: unknown) {
      console.warn("Unauthorized bulk import attempt", String(e));
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const userObj = user as { id: number };
    const userId = userObj.id;

    let inserted = 0;
    let updated = 0;
    let failed = 0;
    const failures: Array<{ telefone: string; error: string }> = [];

    for (const c of contacts) {
      const telefone = (c.telefone || "").replace(/\D/g, "");
      if (!telefone) continue;

      try {
        const existing = await prisma.contact.findUnique({
          where: { telefone },
        });
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
      } catch (e) {
        failed++;
        failures.push({ telefone, error: String(e) });
        console.warn("Failed to persist contact", telefone, e);
        // continue processing other contacts
      }
    }

    const sample = contacts.slice(0, 5).map((c) => ({
      nome: c.nome,
      telefone: (c.telefone || "").replace(/\D/g, ""),
    }));

    return NextResponse.json({ inserted, updated, failed, failures, sample });
  } catch (err) {
    console.error("Error in /api/contacts/bulk", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
