import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

/**
 * GET /api/download/[filename]
 * Serve only files which are registered in the DB (image record). This prevents
 * arbitrary files from being downloaded just by guessing a filename.
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ filename: string }> }
) {
  try {
    const { filename } = await params;

    // Validação básica de segurança
    if (!filename || filename.includes("..") || filename.includes("/")) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    // Verificar se existe um registro de imagem no DB que corresponda a esse filename.
    // O campo `filename` no DB pode ser o nome original; o URL salvo contém o nome final
    // (basename). Procuramos por registros cujo `filename` seja igual ao solicitado
    // ou cujo `url` contenha o nome do arquivo.
    const image = await prisma.image.findFirst({
      where: {
        OR: [{ filename: filename }, { url: { contains: `/${filename}` } }],
      },
    });

    if (!image) {
      // Não permitir acesso a arquivos que não estão registrados no banco
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Tentar múltiplos caminhos para suportar desenvolvimento e produção
    const possiblePaths = [
      path.join(process.cwd(), "public", "uploads", filename),
      path.join("/app", "public", "uploads", filename), // Container path
      path.join("/tmp", "uploads", filename), // Fallback para volumes temporários
    ];

    let filePath: string | null = null;
    for (const p of possiblePaths) {
      if (fs.existsSync(p)) {
        filePath = p;
        break;
      }
    }

    if (!filePath) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Ler arquivo
    const fileBuffer = fs.readFileSync(filePath);

    // Determinar MIME type
    const ext = path.extname(filename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";

    // Retornar arquivo com headers apropriados para download
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Content-Disposition": `inline; filename="${filename}"`,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Erro ao servir arquivo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * OPTIONS request para CORS preflight
 */
export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}

export const dynamic = "force-dynamic";
