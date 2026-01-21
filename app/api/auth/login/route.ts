import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getErrorMessage } from "@/lib/utils";

const JWT_SECRET = process.env.JWT_SECRET || "secret";
const COOKIE_DOMAIN = process.env.COOKIE_DOMAIN;
const IS_PROD = process.env.NODE_ENV === "production";

export async function POST(req: Request) {
  try {
    console.log("[LOGIN] Recebendo requisição de login...");
    const body = await req.json();
    const { username, password } = body;
    console.log("[LOGIN] Username:", username);

    if (!username || !password) {
      console.log("[LOGIN] Campos obrigatórios faltando");
      return NextResponse.json({ error: "Missing" }, { status: 400 });
    }

    console.log("[LOGIN] Tentando conectar ao banco de dados...");
    console.log(
      "[LOGIN] DATABASE_URL:",
      process.env.DATABASE_URL ? "Definida" : "Não definida"
    );

    const user = await prisma.user.findUnique({ where: { username } });
    console.log(
      "[LOGIN] Usuário encontrado:",
      user ? `Sim (ID: ${user.id})` : "Não"
    );

    if (!user) {
      console.log("[LOGIN] Usuário não encontrado, retornando 401");
      return NextResponse.json({ error: "Invalid" }, { status: 401 });
    }

    console.log("[LOGIN] Comparando senha...");
    const match = await bcrypt.compare(password, user.password);
    console.log("[LOGIN] Senha corresponde:", match ? "Sim" : "Não");

    if (!match) {
      console.log("[LOGIN] Senha incorreta, retornando 401");
      return NextResponse.json({ error: "Invalid" }, { status: 401 });
    }

    console.log("[LOGIN] Gerando token JWT...");
    const token = jwt.sign(
      { userId: user.id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7d" }
    );
    console.log("[LOGIN] Token gerado com sucesso");

    const res = NextResponse.json({ id: user.id, username: user.username });

    // Hardened cookie attributes for stateless JWT
    const cookieOptions = {
      httpOnly: true,
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
      secure: IS_PROD,
      ...(COOKIE_DOMAIN ? { domain: COOKIE_DOMAIN } : {}),
    } as Parameters<typeof res.cookies.set>[2];

    console.log("[LOGIN] Configurando cookie com opções:", cookieOptions);
    res.cookies.set("token", token, cookieOptions);
    console.log("[LOGIN] Login bem-sucedido!");
    return res;
  } catch (unknownErr) {
    console.error("[LOGIN ERROR]", unknownErr);
    return NextResponse.json(
      { error: getErrorMessage(unknownErr) },
      { status: 500 }
    );
  }
}
