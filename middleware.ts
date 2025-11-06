import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Função para verificar JWT no Edge Runtime (sem crypto do Node.js)
function verifyJWT(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) {
      return null;
    }

    const payload = parts[1];
    const decodedPayload = JSON.parse(atob(payload));

    // Verificar se o token não expirou
    if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
      return null;
    }

    return decodedPayload;
  } catch {
    return null;
  }
}

// Rotas que não precisam de autenticação
const publicRoutes = [
  "/login",
  "/register",
  "/api/auth/login",
  "/api/auth/register",
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Permitir acesso a rotas públicas
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Verificar autenticação para rotas protegidas
  const token = request.cookies.get("token")?.value;

  if (!token) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  const payload = verifyJWT(token);
  if (!payload) {
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete("token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|uploads).*)"],
};
