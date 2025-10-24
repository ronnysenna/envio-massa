import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "secret";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;
    if (!username || !password)
      return NextResponse.json({ error: "Missing" }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) return NextResponse.json({ error: "Invalid" }, { status: 401 });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return NextResponse.json({ error: "Invalid" }, { status: 401 });

    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" },
    );
    const res = NextResponse.json({ id: user.id, username: user.username });
    res.cookies.set("token", token, {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    });
    return res;
  } catch (unknownErr) {
    return NextResponse.json(
      { error: getErrorMessage(unknownErr) },
      { status: 500 },
    );
  }
}
