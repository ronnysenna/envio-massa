import axios from "axios";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
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
    let { message, imageUrl, contacts, groupIds } = body;

    // Corrigir imageUrl se vier com aspas extras (stringify duplo)
    if (
      typeof imageUrl === "string" &&
      imageUrl.startsWith('"') &&
      imageUrl.endsWith('"')
    ) {
      try {
        imageUrl = JSON.parse(imageUrl);
      } catch {
        // Mantém o valor original se falhar ao fazer parse
      }
    }

    if (!message) {
      return NextResponse.json(
        { error: "Invalid payload: message is required" },
        { status: 400 }
      );
    }

    // Extrair apenas o caminho da URL da imagem (/api/uploads/filename)
    // Se não houver imagem, usar "sem-imagem"
    let imagemPath = "sem-imagem";
    if (imageUrl && typeof imageUrl === "string") {
      // IMPORTANTE: remover espaços/quebras de linha antes de processar
      const cleanUrl = imageUrl.trim();

      // Se for URL completa (contém ://), extrair apenas o pathname
      if (cleanUrl.includes("://")) {
        // Usar regex em vez de new URL() para evitar problemas de encoding
        const match = cleanUrl.match(/^https?:\/\/[^/]+(.+)$/);
        if (match?.[1]) {
          imagemPath = match[1];
        } else {
          // Fallback: tentar extrair tudo após o primeiro /
          const slashIndex = cleanUrl.indexOf("/", cleanUrl.indexOf("://") + 3);
          if (slashIndex !== -1) {
            imagemPath = cleanUrl.substring(slashIndex);
          } else {
            imagemPath = "sem-imagem";
          }
        }
      } else if (cleanUrl.startsWith("/api/uploads/")) {
        // Se já é um caminho relativo, usar como está
        imagemPath = cleanUrl;
      } else {
        // Caminho desconhecido
        imagemPath = "sem-imagem";
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

    // Se groupIds foram fornecidos, buscar contatos desses grupos (garantindo pertencimento ao usuário)
    if (Array.isArray(groupIds) && groupIds.length > 0) {
      // normalizar ids para números
      const groupIdsNum = groupIds
        .map((g: unknown) => Number(g))
        .filter((n: number) => !Number.isNaN(n));

      const contactsFromGroups = await prisma.contact.findMany({
        where: {
          ContactGroup: {
            some: {
              Group: {
                id: { in: groupIdsNum },
                userId: user.id,
              },
            },
          },
        },
        select: { nome: true, telefone: true },
      });

      // deduplicar por telefone (enforce unique list)
      const seen = new Set<string>();
      const uniqueList: Array<{ nome: string; telefone: string }> = [];
      for (const c of contactsFromGroups) {
        if (!c || !c.telefone) continue;
        if (!seen.has(c.telefone)) {
          seen.add(c.telefone);
          uniqueList.push({ nome: c.nome, telefone: c.telefone });
        }
      }

      payload.selectedContacts = {
        total: uniqueList.length,
        list: uniqueList,
      };
    } else {
      // Se contatos foram fornecidos diretamente, incluir no payload como objeto estruturado
      if (Array.isArray(contacts) && contacts.length > 0) {
        payload.selectedContacts = {
          total: contacts.length,
          list: contacts.map((c: Record<string, unknown>) => ({
            nome: c.nome,
            telefone: c.telefone,
          })),
        };
      }
    }

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
