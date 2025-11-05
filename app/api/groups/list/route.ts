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
          select: { contacts: true },
        },
      },
      orderBy: { nome: "asc" },
    });

    return NextResponse.json({ groups });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
