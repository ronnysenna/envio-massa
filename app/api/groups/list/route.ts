import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET() {
  try {
    console.log("[GROUPS LIST] Iniciando busca de grupos...");
    const user = await requireUser();
    console.log("[GROUPS LIST] Usuário autenticado:", user.id);
    const userId = user.id;

    console.log("[GROUPS LIST] Buscando grupos do usuário:", userId);
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

    console.log("[GROUPS LIST] Grupos encontrados:", normalizedGroups.length);
    return NextResponse.json({ groups: normalizedGroups });
  } catch (err) {
    console.error("[GROUPS LIST ERROR]", err);
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
