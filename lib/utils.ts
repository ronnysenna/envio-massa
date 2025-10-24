export function getErrorMessage(err: unknown): string {
  if (err == null) return "Erro desconhecido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message;
  try {
    return JSON.stringify(err);
  } catch (_) {
    return "Erro desconhecido";
  }
}
