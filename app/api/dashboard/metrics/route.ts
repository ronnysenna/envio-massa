import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const [contactsCount, groupsCount, imagesCount, topGroups, recentImages] =
      await Promise.all([
        prisma.contact.count({ where: { userId } }),
        prisma.group.count({ where: { userId } }),
        prisma.image.count({ where: { userId } }),
        prisma.group.findMany({
          where: { userId },
          orderBy: { contacts: { _count: "desc" } },
          take: 5,
          select: {
            id: true,
            nome: true,
            _count: { select: { contacts: true } },
          },
        }),
        prisma.image.findMany({
          where: { userId },
          orderBy: { createdAt: "desc" },
          take: 5,
          select: { id: true, filename: true, url: true, createdAt: true },
        }),
      ]);

    // Normalize topGroups to simple shape
    const topGroupsNormalized = (topGroups || []).map((g: any) => ({
      id: g.id,
      nome: g.nome,
      contacts: g._count?.contacts || 0,
    }));

    return NextResponse.json({
      contactsCount,
      groupsCount,
      imagesCount,
      topGroups: topGroupsNormalized,
      recentImages,
    });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
