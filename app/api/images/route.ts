import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
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

    // Normalizar URLs: se o registro possuir uma URL absoluta (ex.: salva com NEXT_PUBLIC_BASE_URL),
    // retornamos apenas o pathname (/api/download/xxx) para evitar apontar para hosts externos
    // que nem sempre existem no ambiente local.
    const normalized = images.map((img) => {
      let url = img.url;
      try {
        if (
          typeof url === "string" &&
          (url.startsWith("http://") || url.startsWith("https://"))
        ) {
          const parsed = new URL(url);
          url = parsed.pathname + (parsed.search || "");
        }
      } catch {
        // keep original
      }
      return { ...img, url };
    });

    return NextResponse.json({ images: normalized });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
