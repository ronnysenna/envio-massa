import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

const uploadsDir = path.join(process.cwd(), "public", "uploads");
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const MAX_FILE_BYTES = Number(process.env.MAX_UPLOAD_BYTES || 5 * 1024 * 1024); // 5MB default
// aceitar somente JPEG/JPG e PNG no servidor (síncrono com validação cliente)
const ALLOWED_MIMES = new Set([
  "image/png",
  "image/jpeg",
  // alguns clients podem usar image/jpg ou image/pjpeg
  "image/jpg",
  "image/pjpeg",
]);

// checa magic bytes básicos para PNG/JPEG
const isProbablyImage = (buf: Buffer) => {
  if (!buf || buf.length < 4) return false;
  // PNG signature: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47
  )
    return true;
  // JPEG starts with FF D8
  if (buf[0] === 0xff && buf[1] === 0xd8) return true;
  return false;
};

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const formData = await req.formData();
    const fileField = formData.get("file") as File | null;
    if (!fileField) {
      throw new Error("Nenhum arquivo recebido");
    }

    const arrayBuffer = await fileField.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // validação básica de conteúdo (magic bytes) antes de gravar
    if (!isProbablyImage(buffer)) {
      const nm = (fileField as File & { name?: string }).name || "unknown";
      console.warn(
        `Upload rejeitado: arquivo não parece ser uma imagem válida (size=${buffer.length}, name=${nm})`,
      );
      return NextResponse.json(
        { error: "Arquivo não é uma imagem válida ou está corrompido." },
        { status: 400 },
      );
    }

    const originalName =
      (fileField as File & { name?: string }).name || `upload-${Date.now()}`;
    // validar extensão do nome original antes de gravar
    if (!/\.(jpe?g|png)$/i.test(originalName)) {
      return NextResponse.json(
        { error: "Formato não suportado. Envie apenas JPG, JPEG ou PNG." },
        { status: 400 },
      );
    }

    // sanitize original filename to avoid spaces and special chars in saved file
    const safeOriginalName = originalName.replace(/[^a-zA-Z0-9.\-_]/g, "-");

    // escrever de forma atômica: gravar em temp e depois renomear
    const destFilename = `${Date.now()}-${safeOriginalName}`;
    const tempFilename = `${destFilename}.tmp`;
    const tempPath = path.join(uploadsDir, tempFilename);
    const destPath = path.join(uploadsDir, destFilename);

    // escreve o temp file primeiro
    fs.writeFileSync(tempPath, buffer, { flag: "w" });

    // garantir tamanho
    const size = buffer.length;
    if (size > MAX_FILE_BYTES) {
      try {
        fs.unlinkSync(tempPath);
      } catch {}
      return NextResponse.json(
        { error: "Arquivo excede o tamanho máximo permitido" },
        { status: 400 },
      );
    }

    // renomear (atomically move temp -> final)
    try {
      fs.renameSync(tempPath, destPath);
    } catch (renameErr) {
      // se rename falhar, tentar remover temp e retornar erro
      try {
        fs.unlinkSync(tempPath);
      } catch {}
      console.error(
        "Falha ao mover arquivo temp para destino:",
        getErrorMessage(renameErr),
      );
      return NextResponse.json(
        { error: "Falha ao gravar arquivo no servidor." },
        { status: 500 },
      );
    }

    const result = {
      filepath: destPath,
      filename: originalName,
      mime: (fileField as File).type || "",
      size,
    };

    // Normalizar MIME comum e inferir quando necessário
    let mime = (result.mime || "").toLowerCase();
    if (mime === "image/jpg" || mime === "image/pjpeg") mime = "image/jpeg";
    const ext = path.extname(originalName || "").toLowerCase();
    if (
      (!mime || !ALLOWED_MIMES.has(mime)) &&
      (ext === ".jpg" || ext === ".jpeg")
    ) {
      mime = "image/jpeg";
    }
    if (!mime) {
      if (ext === ".png") mime = "image/png";
      else if (ext === ".jpg" || ext === ".jpeg") mime = "image/jpeg";
    }

    if (mime && !ALLOWED_MIMES.has(mime)) {
      console.warn(
        `Upload recebido com mime inesperado: ${result.mime} (inferido: ${mime}). Aceitando pela extensão.`,
      );
    }

    const dest = path.basename(result.filepath);
    // encode dest for URL safety
    const encodedDest = encodeURIComponent(dest);
    let url = `/api/uploads/${encodedDest}`;

    // Se variáveis S3 estiverem configuradas, tentar upload para S3 (import dinâmico)
    const S3_BUCKET = process.env.S3_BUCKET;
    const S3_REGION = process.env.S3_REGION;
    const S3_UPLOAD_ENABLED = !!(S3_BUCKET && S3_REGION);

    if (S3_UPLOAD_ENABLED) {
      try {
        const s3Mod = await import("@aws-sdk/client-s3");
        const { S3Client, PutObjectCommand } = s3Mod;

        const s3ClientConfig: Record<string, unknown> = { region: S3_REGION };
        if (process.env.S3_ACCESS_KEY_ID && process.env.S3_SECRET_ACCESS_KEY) {
          s3ClientConfig.credentials = {
            accessKeyId: process.env.S3_ACCESS_KEY_ID,
            secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
          };
        }

        const s3 = new S3Client(
          s3ClientConfig as unknown as Record<string, unknown>,
        );
        const fileBuffer = fs.readFileSync(destPath);
        const key = `uploads/${Date.now()}-${dest}`;
        await s3.send(
          new PutObjectCommand({
            Bucket: S3_BUCKET,
            Key: key,
            Body: fileBuffer,
            ContentType: mime || undefined,
          }),
        );
        url = `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
        try {
          fs.unlinkSync(destPath);
        } catch {}
      } catch (s3Err) {
        console.warn("S3 upload falhou:", getErrorMessage(s3Err));
      }
    }

    // In production we may want to store absolute URL; in dev store relative path to /api/uploads
    const configuredBase = process.env.NEXT_PUBLIC_BASE_URL || "";
    const isProd = process.env.NODE_ENV === "production";
    const publicUrl =
      isProd && configuredBase
        ? `${configuredBase.replace(/\/$/, "")}${url}`
        : url;

    // save image record in DB
    const image = await prisma.image.create({
      data: { url: publicUrl, filename: result.filename || dest, userId },
    });

    return NextResponse.json({ url: publicUrl, id: image.id });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
