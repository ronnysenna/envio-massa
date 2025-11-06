"use client";

// biome-ignore assist/source/organizeImports: false positive
import { useState } from "react";
import { LogIn } from "lucide-react";
import Brand from "../../components/Brand";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // Important: include cookies
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro de login");
        return;
      }
      // successful login (cookie set by server)
      // Force a hard refresh to ensure middleware picks up the new cookie
      window.location.replace("/dashboard");
    } catch (err) {
      console.error(err);
      setError("Erro de conexão");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-800 to-gray-900 text-gray-100">
      <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md border border-white/6">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-full">
            <LogIn size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          <Brand />
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Faça login para continuar
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Usuário
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition text-white"
              placeholder="Digite seu usuário"
              required
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-200 mb-1"
            >
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition text-white"
              placeholder="Digite sua senha"
              required
            />
          </div>

          {error && (
            <div className="bg-red-700/20 border border-red-600/20 text-red-100 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors focus:ring-4 focus:ring-blue-300"
          >
            Entrar
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-300">
          <p className="mt-2">
            Não tem conta?{" "}
            <a href="/register" className="text-blue-300 hover:underline">
              Criar conta
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
