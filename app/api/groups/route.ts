import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const url = new URL(req.url);
    const search = (url.searchParams.get("search") || "").trim();

    const where: Record<string, unknown> = { userId };
    if (search) {
      Object.assign(where, {
        OR: [
          { nome: { contains: search, mode: "insensitive" } },
          { descricao: { contains: search, mode: "insensitive" } },
        ],
      });
    }

    const groups = await prisma.group.findMany({
      where,
      orderBy: { nome: "asc" },
      include: {
        _count: {
          select: { ContactGroup: true },
        },
      },
    });

    // Normalizar resposta para manter compatibilidade com frontend
    const normalizedGroups = groups.map((g) => ({
      ...g,
      _count: {
        contacts: g._count.ContactGroup,
      },
    }));

    return NextResponse.json({ groups: normalizedGroups });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const nome = (body.nome || "").toString().trim();
    const descricao = body.descricao ? body.descricao.toString().trim() : null;

    if (!nome) {
      return NextResponse.json(
        { error: "Nome é obrigatório" },
        { status: 400 }
      );
    }

    // Verificar se já existe um grupo com o mesmo nome para este usuário
    const existing = await prisma.group.findUnique({
      where: {
        userId_nome: {
          userId,
          nome,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Já existe um grupo com este nome" },
        { status: 400 }
      );
    }

    const created = await prisma.group.create({
      data: {
        nome,
        descricao,
        userId,
        updatedAt: new Date(),
      },
    });

    // Buscar novamente com _count para retornar corretamente
    const group = await prisma.group.findUnique({
      where: { id: created.id },
      include: {
        _count: {
          select: { ContactGroup: true },
        },
      },
    });

    if (!group) {
      return NextResponse.json(
        { error: "Grupo criado mas não encontrado" },
        { status: 500 }
      );
    }

    // Normalizar resposta
    const normalized = {
      ...group,
      _count: {
        contacts: group._count.ContactGroup,
      },
    };

    return NextResponse.json({ group: normalized });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
