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
        { status: 404 }
      );
    if (group.userId !== user.id)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    const data: Partial<{
      nome: string;
      descricao: string | null;
      updatedAt: Date;
    }> = {
      updatedAt: new Date(),
    };
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
          { status: 400 }
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
          select: { ContactGroup: true },
        },
      },
    });

    // Normalizar resposta
    const normalized = {
      ...updated,
      _count: {
        contacts: updated._count.ContactGroup,
      },
    };

    return NextResponse.json({ group: normalized });
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
        { status: 404 }
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
        ContactGroup: {
          include: {
            Contact: true,
          },
        },
        _count: {
          select: { ContactGroup: true },
        },
      },
    });

    if (!group)
      return NextResponse.json(
        { error: "Grupo não encontrado" },
        { status: 404 }
      );
    if (group.userId !== user.id)
      return NextResponse.json({ error: "Sem permissão" }, { status: 403 });

    // Normalizar resposta para manter compatibilidade com frontend
    const normalized = {
      ...group,
      contacts: group.ContactGroup.map((cg) => ({
        contact: cg.Contact,
      })),
      _count: {
        contacts: group._count.ContactGroup,
      },
    };

    return NextResponse.json({ group: normalized });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
