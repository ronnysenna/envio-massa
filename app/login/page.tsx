"use client";

// biome-ignore assist/source/organizeImports: false positive
import { useState } from "react";
import { LogIn } from "lucide-react";

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
            });
            const data = await res.json();
            if (!res.ok) {
                setError(data.error || "Erro de login");
                return;
            }
            // successful login (cookie set by server)
            window.location.href = "/dashboard";
        } catch (err) {
            console.error(err);
            setError("Erro de conexão");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-500 to-purple-600">
            <div className="bg-white p-8 rounded-lg shadow-2xl w-full max-w-md">
                <div className="flex justify-center mb-6">
                    <div className="bg-blue-600 p-4 rounded-full">
                        <LogIn size={32} className="text-white" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-2 text-gray-800">
                    Envio em Massa
                </h1>
                <p className="text-center text-gray-600 mb-6">
                    Faça login para continuar
                </p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label
                            htmlFor="username"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Usuário
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                            placeholder="Digite seu usuário"
                            required
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Senha
                        </label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition text-gray-900"
                            placeholder="Digite sua senha"
                            required
                        />
                    </div>

                    {error && (
                        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
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

                <div className="mt-6 text-center text-sm text-gray-600">
                    <p>Demo: admin / admin123</p>
                    <p className="mt-2">
                        Não tem conta? <a href="/register" className="text-blue-600 hover:underline">Criar conta</a>
                    </p>
                </div>
            </div>
        </div>
    );
}
