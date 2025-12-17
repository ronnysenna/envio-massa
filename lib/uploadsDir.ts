import fs from "node:fs";
import path from "node:path";

/**
 * Determina o diretório de uploads considerando ambiente de desenvolvimento e Docker
 */
export function getUploadsDir(): string {
  // Em Docker do Easypanel, use /app/public/uploads se existir
  const dockerPath = path.join("/app", "public", "uploads");
  if (fs.existsSync(dockerPath)) {
    return dockerPath;
  }

  // Fallback para desenvolvimento local
  const localPath = path.join(process.cwd(), "public", "uploads");

  // Garantir que o diretório existe
  if (!fs.existsSync(localPath)) {
    fs.mkdirSync(localPath, { recursive: true });
  }

  return localPath;
}

/**
 * Retorna lista de todos os caminhos possíveis onde arquivos podem estar
 */
export function getPossibleUploadsPaths(filename: string): string[] {
  return [
    path.join(process.cwd(), "public", "uploads", filename),
    path.join("/app", "public", "uploads", filename),
    path.join("/usr/src/app", "public", "uploads", filename),
    path.join("/tmp", "uploads", filename),
  ];
}
