import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";
import { requireUser } from "@/lib/serverAuth";

export async function GET() {
  try {
    const user = await requireUser();
    const userId = user.id;

    const images = await prisma.image.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        url: true,
        filename: true,
        createdAt: true,
        userId: true,
      },
    });
    return NextResponse.json({ images });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
