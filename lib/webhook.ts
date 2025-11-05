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
  options?: {
    includeContacts?: boolean;
    contacts?: Contact[];
    groupIds?: number[];
  }
) {
  try {
    // construir corpo que será enviado para /api/send
    const body: Record<string, unknown> = {
      message: payload.message,
      imageUrl: payload.imageUrl,
    };

    // Suporta envio de contatos diretamente (cliente) ou ids de grupos (servidor monta a lista)
    if (options?.includeContacts) {
      const contactsArr = Array.isArray(options.contacts)
        ? options.contacts
        : [];
      if (contactsArr.length > 0) {
        body.contacts = contactsArr.map((c) => ({
          nome: c.nome,
          telefone: c.telefone,
        }));
      }
    }

    if (Array.isArray(options?.groupIds) && options.groupIds.length > 0) {
      body.groupIds = options.groupIds;
    }

    // Envia para rota interna que por sua vez encaminha ao webhook
    const res = await fetch("/api/send", {
      method: "POST",
      // enviar cookies (token) para que o servidor possa autenticar via requireUser
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const parsed = await res.json().catch(() => null);
      const errMsg =
        parsed && typeof parsed === "object" && "error" in parsed
          ? (parsed as { error: string }).error
          : "Erro ao enviar";
      return { success: false, error: errMsg };
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
