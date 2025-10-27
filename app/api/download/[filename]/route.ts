import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";

/**
 * GET /api/download/[filename]
 * Rota pública para download direto de imagens
 * Sem autenticação, sem verificações, apenas serve o arquivo
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

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    const filePath = path.join(uploadsDir, filename);

    // Verificar que está dentro da pasta uploads
    if (!filePath.startsWith(uploadsDir)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Verificar se arquivo existe
    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
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
