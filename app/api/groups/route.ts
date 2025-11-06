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
          select: { contacts: true },
        },
      },
    });

    return NextResponse.json({ groups });
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
        { status: 400 },
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
        { status: 400 },
      );
    }

    const created = await prisma.group.create({
      data: { nome, descricao, userId },
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });

    return NextResponse.json({ group: created });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
