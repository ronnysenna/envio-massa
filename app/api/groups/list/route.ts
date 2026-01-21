import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    const user = await requireUser();
    const userId = user.id;

    const groups = await prisma.group.findMany({
      where: { userId },
      select: {
        id: true,
        nome: true,
        _count: {
          select: { ContactGroup: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    // Normalizar resposta para manter compatibilidade com frontend
    const normalizedGroups = groups.map((g) => ({
      id: g.id,
      nome: g.nome,
      _count: {
        contacts: g._count?.ContactGroup || 0,
      },
    }));

    return NextResponse.json({ groups: normalizedGroups });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
