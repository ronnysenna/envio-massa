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
