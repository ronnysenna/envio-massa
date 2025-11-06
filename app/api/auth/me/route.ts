// biome-ignore assist/source/organizeImports: false positive
import { NextResponse } from "next/server";
import jwt from "jsonwebtoken";
import { cookies } from "next/headers";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function GET() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get?.("token")?.value || "";
    if (!token)
      return NextResponse.json({ authenticated: false }, { status: 401 });

    const decoded = jwt.verify(token, JWT_SECRET);
    if (
      typeof decoded !== "object" ||
      decoded === null ||
      !("userId" in decoded)
    ) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const maybeUserId = (decoded as { userId?: unknown }).userId;
    const userId =
      typeof maybeUserId === "number" ? maybeUserId : Number(maybeUserId);
    if (Number.isNaN(userId))
      return NextResponse.json({ authenticated: false }, { status: 401 });

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user)
      return NextResponse.json({ authenticated: false }, { status: 401 });

    return NextResponse.json({
      authenticated: true,
      id: user.id,
      username: user.username,
    });
  } catch (err) {
    return NextResponse.json(
      { authenticated: false, error: getErrorMessage(err) },
      { status: 401 },
    );
  }
}
