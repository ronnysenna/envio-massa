// Simulação de autenticação - Em produção, integre com backend real
export const DEMO_USER = {
  username: "admin",
  password: "admin123",
};

export function validateCredentials(
  username: string,
  password: string,
): boolean {
  return username === DEMO_USER.username && password === DEMO_USER.password;
}

export function isAuthenticated(): boolean {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("isAuthenticated") === "true";
}

export function login(): void {
  if (typeof window !== "undefined") {
    localStorage.setItem("isAuthenticated", "true");
  }
}

export function logout(): void {
  if (typeof window !== "undefined") {
    localStorage.removeItem("isAuthenticated");
  }
}
