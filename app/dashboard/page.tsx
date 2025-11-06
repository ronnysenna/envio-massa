"use client";

import { BarChart3, Send, Users } from "lucide-react";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardMetrics from "./metrics";

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <main className="flex-1 p-8 bg-transparent min-h-screen">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl font-bold text-(--text) mb-8">Dashboard</h1>

          {/* Stats Cards */}
          <DashboardMetrics />

          {/* Quick Actions */}
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-(--text) mb-4">Ações Rápidas</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a href="/enviar" className="p-4 border-2 border-(--border) rounded-lg hover:bg-[rgba(99,102,241,0.03)] transition-colors text-center">
                <Send className="mx-auto mb-2 text-(--primary)" size={32} />
                <p className="font-semibold text-(--text)">Enviar Mensagem</p>
              </a>
              <a href="/contatos" className="p-4 border-2 border-(--border) rounded-lg hover:bg-[rgba(99,102,241,0.03)] transition-colors text-center">
                <Users className="mx-auto mb-2 text-(--primary)" size={32} />
                <p className="font-semibold text-(--text)">Gerenciar Contatos</p>
              </a>
              <a href="/imagem" className="p-4 border-2 border-(--border) rounded-lg hover:bg-[rgba(99,102,241,0.03)] transition-colors text-center">
                <BarChart3 className="mx-auto mb-2 text-(--primary)" size={32} />
                <p className="font-semibold text-(--text)">Upload de Imagem</p>
              </a>
            </div>
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
