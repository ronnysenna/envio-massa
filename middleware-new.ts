import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const JWT_SECRET = "b9f3a1d8c6e24f7b9a2c3d4e5f6071829a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4";

// Função para verificar JWT no Edge Runtime
function verifyJWT(token: string) {
  try {
    // Dividir o token em partes
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Token inválido');
    }

    const [header, payload, signature] = parts;
    
    // Decodificar o payload
    const decodedPayload = JSON.parse(atob(payload));
    
    // Verificar se o token não expirou
    if (decodedPayload.exp && Date.now() >= decodedPayload.exp * 1000) {
      throw new Error('Token expirado');
    }

    // Para simplicidade no middleware, vamos apenas verificar estrutura e expiração
    // A verificação completa da assinatura é feita nas APIs
    
    return decodedPayload;
  } catch (error) {
    throw new Error('Token inválido');
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

  console.log(`[MIDDLEWARE] ${request.method} ${pathname}`);

  // Permitir acesso a rotas públicas (login/register)
  if (publicRoutes.includes(pathname)) {
    console.log(`[MIDDLEWARE] Rota pública: ${pathname}`);
    // Se já estiver autenticado e tentando acessar login, redirecionar para dashboard
    const token = request.cookies.get("token")?.value;
    if (token && pathname === "/login") {
      console.log(`[MIDDLEWARE] Token encontrado no login: ${token.substring(0, 20)}...`);
      try {
        const decoded = verifyJWT(token);
        console.log(`[MIDDLEWARE] Token válido, redirecionando para dashboard:`, decoded);
        const dashboardUrl = new URL("/dashboard", request.url);
        return NextResponse.redirect(dashboardUrl);
      } catch (error) {
        console.log(`[MIDDLEWARE] Token inválido no login:`, error);
        // Token inválido, permitir acesso ao login
        return NextResponse.next();
      }
    }
    return NextResponse.next();
  }

  // Para todas as outras rotas (protegidas), verificar autenticação
  const token = request.cookies.get("token")?.value;
  console.log(`[MIDDLEWARE] Verificando autenticação para ${pathname}, token: ${token ? token.substring(0, 20) + '...' : 'NENHUM'}`);

  if (!token) {
    console.log(`[MIDDLEWARE] Nenhum token encontrado, redirecionando para login`);
    // Se não tiver token, redirecionar para login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    // Verificar se o token é válido
    const decoded = verifyJWT(token);
    console.log(`[MIDDLEWARE] Token válido:`, decoded);
    // Token válido, permitir acesso
    return NextResponse.next();
  } catch (error) {
    console.log(`[MIDDLEWARE] Token inválido:`, error);
    // Token inválido, redirecionar para login
    const loginUrl = new URL("/login", request.url);
    const response = NextResponse.redirect(loginUrl);

    // Limpar cookie inválido
    response.cookies.delete("token");

    return response;
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - uploads (public uploads)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|uploads).*)",
  ],
};
