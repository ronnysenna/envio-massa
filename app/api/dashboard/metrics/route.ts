import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    console.log("[DASHBOARD METRICS] Iniciando busca de métricas...");
    const user = await requireUser();
    console.log("[DASHBOARD METRICS] Usuário autenticado:", user.id);
    const userId = user.id;

    console.log("[DASHBOARD METRICS] Buscando dados...");
    const [contactsCount, groupsCount, imagesCount, topGroups, recentImages] =
      await Promise.all([
        prisma.contact.count({ where: { userId } }),
        prisma.group.count({ where: { userId } }),
        prisma.image.count({ where: { userId } }),
        prisma.group.findMany({
          where: { userId },
          select: {
            id: true,
            nome: true,
            _count: { select: { ContactGroup: true } },
          },
          take: 5,
        }),
        prisma.image.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, filename: true, url: true, createdAt: true },
        }),
      ]);

    console.log("[DASHBOARD METRICS] Dados coletados:", {
      contactsCount,
      groupsCount,
      imagesCount,
      topGroupsCount: topGroups.length,
      recentImagesCount: recentImages.length,
    });

    // Normalize topGroups to simple shape
    const topGroupsNormalized = topGroups.map((g) => ({
      id: g.id,
      nome: g.nome,
      contacts: g._count?.ContactGroup || 0,
    }));

    return NextResponse.json({
      contactsCount,
      groupsCount,
      imagesCount,
      topGroups: topGroupsNormalized,
      recentImages,
    });
  } catch (err) {
    console.error("[DASHBOARD METRICS ERROR]", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
