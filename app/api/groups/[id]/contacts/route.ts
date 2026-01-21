import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

type NextContextWithParams = {
  params?: { id: string } | Promise<{ id: string }>;
};

export async function POST(_req: Request, context: NextContextWithParams) {
  const params = await (context?.params ?? ({} as { id: string }));
  try {
    const user = await requireUser();
    const groupId = parseInt(params.id, 10);
    const body = await _req.json();
    const { contactIds } = body;

    if (!Array.isArray(contactIds)) {
      return NextResponse.json(
        { error: "contactIds deve ser um array" },
        { status: 400 }
      );
    }

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

    // Verificar se todos os contatos pertencem ao usuário
    const contacts = await prisma.contact.findMany({
      where: {
        id: { in: contactIds },
        userId: user.id,
      },
    });

    if (contacts.length !== contactIds.length) {
      return NextResponse.json(
        {
          error:
            "Alguns contatos não foram encontrados ou não pertencem a você",
        },
        { status: 400 }
      );
    }

    // Remover contatos existentes do grupo
    await prisma.contactGroup.deleteMany({
      where: { groupId },
    });

    // Adicionar novos contatos
    if (contactIds.length > 0) {
      await prisma.contactGroup.createMany({
        data: contactIds.map((contactId: number) => ({
          groupId,
          contactId,
        })),
        skipDuplicates: true,
      });
    }

    const updatedGroup = await prisma.group.findUnique({
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

    if (!updatedGroup) {
      return NextResponse.json(
        { error: "Grupo não encontrado após atualização" },
        { status: 500 }
      );
    }

    // Normalizar resposta para manter compatibilidade com frontend
    const normalized = {
      ...updatedGroup,
      contacts: updatedGroup.ContactGroup.map((cg) => ({
        contact: cg.Contact,
      })),
      _count: {
        contacts: updatedGroup._count.ContactGroup,
      },
    };

    return NextResponse.json({ group: normalized });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
