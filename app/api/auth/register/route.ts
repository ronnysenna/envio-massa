import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;
    if (!username || !password)
      return NextResponse.json({ error: "Missing" }, { status: 400 });

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing)
      return NextResponse.json({ error: "User exists" }, { status: 409 });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, password: hashed },
    });

    return NextResponse.json({ id: user.id, username: user.username });
  } catch (err) {
    return NextResponse.json({ error: getErrorMessage(err) }, { status: 500 });
  }
}
