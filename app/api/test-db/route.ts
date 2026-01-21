import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const userCount = await prisma.user.count();

    const firstUser = await prisma.user.findFirst();

    return NextResponse.json({
      success: true,
      userCount,
      firstUser: firstUser
        ? { id: firstUser.id, username: firstUser.username }
        : null,
      databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + "...",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
