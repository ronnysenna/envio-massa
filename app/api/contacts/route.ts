import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";
import { getErrorMessage } from "@/lib/utils";

export async function GET(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") ?? 1));
    const limit = Math.min(
      1000,
      Math.max(1, Number(url.searchParams.get("limit") ?? 25)),
    );
    const search = (url.searchParams.get("search") || "").trim();

    const where: Record<string, unknown> = { userId };
    if (search) {
      // busca por nome ou telefone parcialmente
      Object.assign(where, {
        OR: [
          { nome: { contains: search, mode: "insensitive" } },
          { telefone: { contains: search } },
        ],
      });
    }

    const [total, contacts] = await Promise.all([
      prisma.contact.count({ where }),
      prisma.contact.findMany({
        where,
        orderBy: { nome: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({ contacts, total, page, limit });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const user = await requireUser();
    const userId = user.id;

    const body = await req.json().catch(() => ({}));
    const nome = (body.nome || "").toString();
    const telefoneRaw = (body.telefone || "").toString();
    const telefone = telefoneRaw.replace(/\D/g, "");

    if (!telefone) {
      return NextResponse.json({ error: "Telefone inválido" }, { status: 400 });
    }

    // verificar contato existente pelo telefone
    const existing = await prisma.contact.findUnique({ where: { telefone } });
    if (existing) {
      // atualizar nome / reassociar ao usuário atual
      const updated = await prisma.contact.update({
        where: { id: existing.id },
        data: { nome, userId },
      });
      return NextResponse.json({ contact: updated });
    }

    const created = await prisma.contact.create({
      data: { nome, telefone, userId },
    });

    return NextResponse.json({ contact: created });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
