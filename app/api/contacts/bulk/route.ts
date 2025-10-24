import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const contacts: { nome: string; telefone: string }[] = body.contacts || [];

    if (!Array.isArray(contacts) || contacts.length === 0) {
      return NextResponse.json(
        { inserted: 0, updated: 0, message: "Nenhum contato recebido" },
        { status: 400 },
      );
    }

    // require authenticated user
    const user = await requireUser();
    const userId = user.id;

    let inserted = 0;
    let updated = 0;

    for (const c of contacts) {
      const telefone = (c.telefone || "").replace(/\D/g, "");
      if (!telefone) continue;

      const existing = await prisma.contact
        .findUnique({ where: { telefone } })
        .catch(() => null);
      if (existing) {
        await prisma.contact.update({
          where: { id: existing.id },
          data: { nome: c.nome, userId },
        });
        updated++;
      } else {
        await prisma.contact.create({
          data: { nome: c.nome, telefone, userId },
        });
        inserted++;
      }
    }

    const sample = contacts.slice(0, 5).map((c) => ({
      nome: c.nome,
      telefone: (c.telefone || "").replace(/\D/g, ""),
    }));

    return NextResponse.json({ inserted, updated, sample });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
