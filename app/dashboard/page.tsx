"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import { BarChart3, Users, Send, TrendingUp } from "lucide-react";

export default function DashboardPage() {
    return (
        <ProtectedRoute>
            <main className="flex-1 p-8 bg-transparent min-h-screen">
                <div className="max-w-7xl mx-auto px-4">
                    <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted text-sm">Total de Contatos</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                                </div>
                                <div className="bg-blue-50 p-3 rounded-full">
                                    <Users className="text-blue-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted text-sm">Mensagens Enviadas</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                                </div>
                                <div className="bg-green-50 p-3 rounded-full">
                                    <Send className="text-green-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted text-sm">Taxa de Sucesso</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">100%</p>
                                </div>
                                <div className="bg-purple-50 p-3 rounded-full">
                                    <TrendingUp className="text-purple-600" size={24} />
                                </div>
                            </div>
                        </div>

                        <div className="card p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-muted text-sm">Campanhas Ativas</p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">0</p>
                                </div>
                                <div className="bg-orange-50 p-3 rounded-full">
                                    <BarChart3 className="text-orange-600" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="card p-6">
                        <h2 className="text-xl font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <a href="/enviar" className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors text-center">
                                <Send className="mx-auto mb-2 text-blue-600" size={32} />
                                <p className="font-semibold text-gray-900">Enviar Mensagem</p>
                            </a>
                            <a href="/contatos" className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors text-center">
                                <Users className="mx-auto mb-2 text-green-600" size={32} />
                                <p className="font-semibold text-gray-900">Gerenciar Contatos</p>
                            </a>
                            <a href="/imagem" className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors text-center">
                                <BarChart3 className="mx-auto mb-2 text-purple-600" size={32} />
                                <p className="font-semibold text-gray-900">Upload de Imagem</p>
                            </a>
                        </div>
                    </div>
                </div>
            </main>
        </ProtectedRoute>
    );
}
