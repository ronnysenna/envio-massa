import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const images = await prisma.image.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        url: true,
        filename: true,
        createdAt: true,
      },
    });

    // Determine base URL: use NEXT_PUBLIC_BASE_URL only in production. In dev prefer derived host
    const configuredBase = process.env.NEXT_PUBLIC_BASE_URL;
    const derivedBase = (() => {
      try {
        const protocol =
          req.headers.get("x-forwarded-proto") ||
          req.headers.get("x-forwarded-proto") ||
          "http";
        const host =
          req.headers.get("x-forwarded-host") ||
          req.headers.get("host") ||
          "localhost:3000";
        return `${protocol}://${host}`;
      } catch {
        return "http://localhost:3000";
      }
    })();
    const isProd = process.env.NODE_ENV === "production";
    const baseUrl =
      isProd && configuredBase
        ? configuredBase.replace(/\/$/, "")
        : derivedBase.replace(/\/$/, "");

    const normalized = images.map((img) => {
      let url = img.url || "";
      try {
        if (
          typeof url === "string" &&
          (url.startsWith("http://") || url.startsWith("https://"))
        ) {
          // URL absoluta (S3 ou externa) — manter como está para evitar reescrita incorreta
          // Não reescrever para `baseUrl` — isso causava 404 quando o host original era diferente
        } else if (typeof url === "string" && url.startsWith("/")) {
          url = `${baseUrl}${url}`;
        } else if (typeof url === "string") {
          url = `${baseUrl}/api/uploads/${encodeURIComponent(String(url))}`;
        }
      } catch {
        // fallback keep original
      }
      return { ...img, url };
    });

    return NextResponse.json({ images: normalized });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
