import fs from "node:fs";
import path from "node:path";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    const { filename } = await params;

    // Decodifica o filename (caso contenha espaços ou caracteres especiais)
    const decodedFilename = decodeURIComponent(String(filename || ""));

    // Validar nome do arquivo para evitar directory traversal
    if (
      !decodedFilename ||
      decodedFilename.includes("..") ||
      decodedFilename.includes("/")
    ) {
      return NextResponse.json({ error: "Invalid filename" }, { status: 400 });
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");

    // Tentar múltiplos caminhos para suportar desenvolvimento e execução dentro de containers
    const possiblePaths = [
      path.join(uploadsDir, decodedFilename),
      path.join("/app", "public", "uploads", decodedFilename),
      path.join("/usr/src/app", "public", "uploads", decodedFilename),
      path.join("/tmp", "uploads", decodedFilename),
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
    const ext = path.extname(decodedFilename).toLowerCase();
    let contentType = "application/octet-stream";
    if (ext === ".jpg" || ext === ".jpeg") contentType = "image/jpeg";
    else if (ext === ".png") contentType = "image/png";
    else if (ext === ".gif") contentType = "image/gif";
    else if (ext === ".webp") contentType = "image/webp";

    // Retornar arquivo com headers de cache
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Content-Length": fileBuffer.length.toString(),
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Erro ao servir arquivo:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
