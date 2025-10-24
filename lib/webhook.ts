import { getErrorMessage } from "./utils";

const _WEBHOOK_URL = "https://n8n.ronnysenna.com.br/webhook/envio";

export interface Contact {
  id?: number;
  nome: string;
  telefone: string;
  email?: string;
}

export interface MessagePayload {
  message: string;
  contacts: Contact[];
  image?: string; // Base64 da imagem (legacy)
  imageUrl?: string; // URL pública da imagem
}

export async function sendMessage(payload: MessagePayload) {
  try {
    // Envia para rota interna que por sua vez encaminha ao webhook
    const res = await fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: payload.message,
        contacts: payload.contacts.map((c) => ({
          nome: c.nome,
          telefone: c.telefone,
        })),
        imageUrl: payload.imageUrl,
      }),
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
