import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const MAX_FILE_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024); // 5MB default
// aceitar somente JPEG/JPG e PNG no servidor (síncrono com validação cliente)
const ALLOWED_MIMES = new Set(["image/png", "image/jpeg"]);

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    // Use Web Request.formData() (App Router) to obtain uploaded file (File/Blob)
    const formData = await req.formData();
    const fileField = formData.get("file") as File | null;
    if (!fileField) {
      throw new Error("Nenhum arquivo recebido");
    }

    const arrayBuffer = await fileField.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const originalName =
      (fileField as File & { name?: string }).name || `upload-${Date.now()}`;
    // validar extensão do nome original antes de gravar
    if (!/\.(jpe?g|png)$/i.test(originalName)) {
      return NextResponse.json(
        { error: "Formato não suportado. Envie apenas JPG, JPEG ou PNG." },
        { status: 400 }
      );
    }
    const destFilename = `${Date.now()}-${originalName}`;
    const destPath = path.join(uploadsDir, destFilename);
    fs.writeFileSync(destPath, buffer);

    const result = {
      filepath: destPath,
      filename: originalName,
      mime: (fileField as File).type || "",
      size: buffer.length,
    };

    if (!result.filepath) throw new Error("Nenhum arquivo recebido");

    // garantir tamanho (caso formidable não informe)
    let size = result.size;
    if (typeof size !== "number") {
      try {
        const stats = fs.statSync(result.filepath);
        size = stats.size;
      } catch {
        // ignore, será validado abaixo
      }
    }

    if (typeof size === "number" && size > MAX_FILE_BYTES) {
      // remover arquivo excedente
      try {
        fs.unlinkSync(result.filepath);
      } catch {}
      return NextResponse.json(
        { error: "Arquivo excede o tamanho máximo permitido" },
        { status: 400 }
      );
    }

    // validar mime se possível
    const mime = result.mime || "";
    if (mime && !ALLOWED_MIMES.has(mime)) {
      try {
        fs.unlinkSync(result.filepath);
      } catch {}
      return NextResponse.json(
        { error: "Tipo de arquivo não aceito" },
        { status: 400 }
      );
    }

    const dest = path.basename(result.filepath);
    let url = `/uploads/${dest}`;

    // Se variáveis S3 estiverem configuradas, tentar upload para S3 (import dinâmico)
    const S3_BUCKET = process.env.S3_BUCKET;
    const S3_REGION = process.env.S3_REGION;
    const S3_UPLOAD_ENABLED = !!(S3_BUCKET && S3_REGION);

    if (S3_UPLOAD_ENABLED) {
      try {
        const s3Mod = await import("@aws-sdk/client-s3");
        const { S3Client, PutObjectCommand } = s3Mod;

        // construir client com credenciais se presentes
        const s3ClientConfig: Record<string, unknown> = { region: S3_REGION };
        if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
          s3ClientConfig.credentials = {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          };
        }

        const s3 = new S3Client(
          s3ClientConfig as unknown as Record<string, unknown>
        );
        const fileBuffer = fs.readFileSync(result.filepath);
        const key = `uploads/${Date.now()}-${dest}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: fileBuffer,
            ContentType: mime || undefined,
          })
        );
        url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
        try {
          fs.unlinkSync(result.filepath);
        } catch {}
      } catch (s3Err) {
        console.warn("S3 upload falhou:", getErrorMessage(s3Err));
      }
    }

    // se existir NEXT_PUBLIC_BASE_URL, prefixar para formar URL absoluta
    const base = process.env.NEXT_PUBLIC_BASE_URL || "";
    const publicUrl = base ? `${base.replace(/\/$/, "")}${url}` : url;

    // save image record in DB
    const image = await prisma.image.create({
      data: { url: publicUrl, filename: result.filename || dest, userId },
    });

    return NextResponse.json({ url: publicUrl, id: image.id });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
