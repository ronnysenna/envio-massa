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

    // Determine base URL. Prefer NEXT_PUBLIC_BASE_URL only when it matches the
    // incoming Host; otherwise derive from request so local dev points to localhost.
    const configuredBaseRaw = process.env.NEXT_PUBLIC_BASE_URL;
    let configuredBase: string | null = null;
    let configuredHost: string | null = null;
    try {
      if (configuredBaseRaw) {
        configuredBase = configuredBaseRaw.replace(/\/$/, "");
        configuredHost = new URL(configuredBase).host;
      }
    } catch {
      configuredBase = null;
      configuredHost = null;
    }

    const reqHost =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      "localhost:3000";
    const reqProto = req.headers.get("x-forwarded-proto") || "http";
    const derivedBase = `${reqProto}://${reqHost}`;

    const useConfigured =
      typeof configuredBase === "string" &&
      typeof configuredHost === "string" &&
      configuredHost === reqHost;
    const baseUrl = useConfigured ? configuredBase : derivedBase;

    // Build absolute URLs for the frontend.
    const normalized = images.map((img) => {
      let url = img.url || "";
      try {
        if (
          typeof url === "string" &&
          (url.startsWith("http://") || url.startsWith("https://"))
        ) {
          // already absolute
        } else if (typeof url === "string" && url.startsWith("/")) {
          url = `${baseUrl}${url}`;
        } else if (typeof url === "string") {
          // bare filename or relative path => assume /api/download/
          url = `${baseUrl}/api/download/${encodeURIComponent(String(url))}`;
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
