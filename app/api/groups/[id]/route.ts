import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

export async function PUT(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const user = await requireUser();
    const groupId = parseInt(params.id, 10);
    const body = await _req.json();
    const { nome, descricao } = body;

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 },
      );
    if (group.userId !== user.id)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const data: Partial<{ nome: string; descricao: string | null }> = {};
    if (typeof nome === "string" && nome.trim()) {
      const trimmedNome = nome.trim();

      // Verificar se já existe outro grupo com este nome para o mesmo usuário
      const existing = await prisma.group.findUnique({
        where: {
          userId_nome: {
            userId: user.id,
            nome: trimmedNome,
          },
        },
      });

      if (existing && existing.id !== groupId) {
        return NextResponse.json(
          { error: "Já existe um grupo com este nome" },
          { status: 400 },
        );
      }

      data.nome = trimmedNome;
    }
    if (typeof descricao === "string")
      data.descricao = descricao.trim() || null;

    const updated = await prisma.group.update({
      where: { id: groupId },
      data,
      include: {
        _count: {
          select: { contacts: true },
        },
      },
    });
    return NextResponse.json({ group: updated });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function DELETE(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const user = await requireUser();
    const groupId = parseInt(params.id, 10);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
    });
    if (!group)
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 },
      );
    if (group.userId !== user.id)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    await prisma.group.delete({ where: { id: groupId } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function GET(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const user = await requireUser();
    const groupId = parseInt(params.id, 10);

    const group = await prisma.group.findUnique({
      where: { id: groupId },
      include: {
        contacts: {
          include: {
            contact: true,
          },
        },
        _count: {
          select: { contacts: true },
        },
      },
    });

    if (!group)
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 },
      );
    if (group.userId !== user.id)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    return NextResponse.json({ group });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
