import axios from "axios";
import { NextResponse } from "next/server";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const user = await requireUser();

    const WEBHOOK_URL = process.env.WEBHOOK_URL;
    if (!WEBHOOK_URL) {
      return NextResponse.json(
        { error: "WEBHOOK_URL not configured on server" },
        { status: 500 }
      );
    }

    const body = await req.json();
    const { message, imageUrl, contacts } = body;
    if (!message) {
      return NextResponse.json(
        { error: "Invalid payload: message is required" },
        { status: 400 }
      );
    }

    // Extrair apenas o caminho da URL da imagem (/api/download/filename)
    // Se não houver imagem, usar "sem-imagem"
    let imagemPath = "sem-imagem";
    if (imageUrl && typeof imageUrl === "string") {
      // Se for URL completa, extrair apenas o pathname
      if (imageUrl.includes("://")) {
        try {
          const url = new URL(imageUrl);
          imagemPath = url.pathname; // Resultado: /api/download/1761503198117-PM.jpg
        } catch {
          imagemPath = "sem-imagem";
        }
      } else {
        // Se já for um caminho, usar como está
        imagemPath = imageUrl;
      }
    }

    // build payload to n8n com contatos selecionados em estrutura organizada
    // Construir URL completa da imagem (para N8N conseguir fazer download)
    let imagemUrlCompleta = "sem-imagem";
    if (imagemPath !== "sem-imagem") {
      // Em produção no Easypanel, usar URL base do ambiente
      const baseUrl =
        process.env.NEXT_PUBLIC_BASE_URL ||
        (() => {
          const protocol = req.headers.get("x-forwarded-proto") || "https";
          const host =
            req.headers.get("x-forwarded-host") ||
            req.headers.get("host") ||
            "localhost:3000";
          return `${protocol}://${host}`;
        })();
      imagemUrlCompleta = `${baseUrl}${imagemPath}`;
    }

    const payload: Record<string, unknown> = {
      message,
      imagemUrl: imagemUrlCompleta,
      userId: user.id,
    };

    // Se contatos foram fornecidos, incluir no payload como objeto estruturado
    if (Array.isArray(contacts) && contacts.length > 0) {
      payload.selectedContacts = {
        total: contacts.length,
        list: contacts.map((c: Record<string, unknown>) => ({
          nome: c.nome,
          telefone: c.telefone,
        })),
      };
    }

    // Log para debug (remover em produção se necessário)
    console.log("[WEBHOOK DEBUG]", {
      imagemPath,
      imagemUrlCompleta,
      baseUrl:
        imagemUrlCompleta !== "sem-imagem"
          ? imagemUrlCompleta.split("/api/download/")[0]
          : "N/A",
      messageLength: message.length,
      contactsCount: Array.isArray(contacts) ? contacts.length : 0,
    });

    try {
      const response = await axios.post(WEBHOOK_URL, payload, {
        timeout: 30000,
      });
      return NextResponse.json(
        { success: true, status: response.status, data: response.data },
        { status: 200 }
      );
    } catch (axiosErr: unknown) {
      // if n8n responded with an error status, forward that information
      const upstreamErr = axiosErr as
        | { response?: { status?: number; data?: unknown } }
        | undefined;
      const upstreamStatus = upstreamErr?.response?.status ?? 502;
      const upstreamData = upstreamErr?.response?.data ?? null;
      return NextResponse.json(
        {
          error: "Upstream webhook error",
          status: upstreamStatus,
          data: upstreamData,
        },
        { status: upstreamStatus }
      );
    }
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
