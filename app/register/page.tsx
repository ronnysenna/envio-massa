"use client";

// biome-ignore assist/source/organizeImports: false positive
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UserPlus } from "lucide-react";
import Brand from "../../components/Brand";

export default function RegisterPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro no registro");
        return;
      }
      // redirect to login
      router.push("/login");
    } catch (_err) {
      setError("Erro de conexão");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-slate-800 to-gray-900 text-gray-100">
      <div className="bg-white/5 backdrop-blur-sm p-8 rounded-xl shadow-xl w-full max-w-md border border-white/6">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-4 rounded-full">
            <UserPlus size={32} className="text-white" />
          </div>
        </div>

        <h1 className="text-3xl font-bold text-center mb-2">
          <Brand />
        </h1>
        <p className="text-center text-gray-300 mb-6">
          Crie sua conta para continuar
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg text-white outline-none"
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
              className="w-full px-4 py-2 bg-white/6 border border-white/8 rounded-lg text-white outline-none"
              required
            />
          </div>

          {error && <div className="text-red-600 text-sm">{error}</div>}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 rounded-lg"
          >
            Criar conta
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-gray-300">
          <p className="mt-2">
            Já tem conta?{" "}
            <a href="/login" className="text-blue-300 hover:underline">
              Fazer login
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
