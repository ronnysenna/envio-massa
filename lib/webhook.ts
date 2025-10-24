import { getErrorMessage } from "./utils";

export interface Contact {
  id?: number;
  nome: string;
  telefone: string;
  email?: string;
}

export interface MessagePayload {
  message: string;
  // contatos são mantidos apenas para uso no cliente; o endpoint interno `/api/send` agora
  // aceita somente { message, imageUrl } por padrão e o servidor usa userId para buscar contatos.
  contacts?: Contact[];
  image?: string; // Base64 da imagem (legacy)
  imageUrl?: string; // URL pública da imagem
}

export async function sendMessage(
  payload: MessagePayload,
  options?: { includeContacts?: boolean; contacts?: Contact[] }
) {
  try {
    // construir corpo que será enviado para /api/send
    const body: Record<string, unknown> = {
      message: payload.message,
      imageUrl: payload.imageUrl,
    };

    if (
      options?.includeContacts &&
      Array.isArray(options.contacts) &&
      options.contacts.length > 0
    ) {
      body.contacts = options.contacts.map((c) => ({
        nome: c.nome,
        telefone: c.telefone,
      }));
    }

    // Envia para rota interna que por sua vez encaminha ao webhook
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erro" }));
      return { success: false, error: err.error || "Erro ao enviar" };
    }

    const data = await res.json();
    return { success: true, data };
  } catch (err) {
    return {
      success: false,
      error: getErrorMessage(err),
    };
  }
}
