import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireUser } from "@/lib/serverAuth";

export async function GET() {
  const user = await requireUser();
  const selection = await prisma.selection.findUnique({
    where: { userId: user.id },
  });
  return NextResponse.json({ selectedIds: selection?.selectedIds ?? [] });
}

export async function POST(req: Request) {
  const user = await requireUser();
  const body = await req.json().catch(() => ({}));
  const selectedIds = Array.isArray(body.selectedIds)
    ? (body.selectedIds as unknown[])
    : [];

  // basic validation: ensure array of numbers
  const normalized: number[] = selectedIds
    .map((v) => Number(v))
    .filter((n) => !Number.isNaN(n));

  const upsert = await prisma.selection.upsert({
    where: { userId: user.id },
    update: { selectedIds: normalized },
    create: { userId: user.id, selectedIds: normalized },
  });

  return NextResponse.json({ selectedIds: upsert.selectedIds });
}

export async function DELETE() {
  const user = await requireUser();
  await prisma.selection.deleteMany({ where: { userId: user.id } });
  return NextResponse.json({ ok: true });
}
