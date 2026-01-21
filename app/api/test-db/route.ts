import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    console.log("[TEST-DB] Testando conexão com o banco...");
    console.log(
      "[TEST-DB] DATABASE_URL:",
      process.env.DATABASE_URL?.substring(0, 50) + "..."
    );

    const userCount = await prisma.user.count();
    console.log("[TEST-DB] Número de usuários:", userCount);

    const firstUser = await prisma.user.findFirst();
    console.log("[TEST-DB] Primeiro usuário:", firstUser?.username);

    return NextResponse.json({
      success: true,
      userCount,
      firstUser: firstUser
        ? { id: firstUser.id, username: firstUser.username }
        : null,
      databaseUrl: process.env.DATABASE_URL?.substring(0, 50) + "...",
    });
  } catch (error) {
    console.error("[TEST-DB ERROR]", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
