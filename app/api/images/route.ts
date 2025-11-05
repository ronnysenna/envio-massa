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
    const base: string =
      useConfigured && configuredBase ? configuredBase : derivedBase;

    // Build absolute URLs for the frontend. Always point to our base host + pathname
    const normalized = images.map((img) => {
      let url = img.url || "";
      try {
        // Try to parse stored url relative to base to get a stable pathname
        const parsed = new URL(url, base);
        const pathname = parsed.pathname + (parsed.search || "");
        url = `${base.replace(/\/$/, "")}${pathname}`;
      } catch {
        // Fallback: use filename stored in DB to build download path
        const name = img.filename || String(url || "");
        url = `${base.replace(/\/$/, "")}/api/download/${encodeURIComponent(
          name
        )}`;
      }
      return { ...img, url };
    });

    return NextResponse.json({ images: normalized });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
