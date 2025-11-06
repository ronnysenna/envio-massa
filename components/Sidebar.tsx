"use client";

import {
  Home,
  Image as ImageIcon,
  LogOut,
  Send,
  Tags,
  Users,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const menuItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/enviar", label: "Enviar Mensagem", icon: Send },
  { href: "/contatos", label: "Contatos", icon: Users },
  { href: "/grupos", label: "Grupos", icon: Tags },
  { href: "/imagem", label: "Upload de Imagem", icon: ImageIcon },
  // Nota: a página de upload de imagem foi removida do menu. Uploads agora são feitos
  // diretamente na página Enviar Mensagem. A rota de API /api/images permanece ativa.
];

export default function Sidebar({
  mobileOpen,
  onClose,
}: {
  mobileOpen?: boolean;
  onClose?: () => void;
} = {}) {
  const pathname = usePathname();

  const handleLogout = async () => {
    try {
      // Call logout API to clear the JWT cookie
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Force redirect to login regardless of API call result
      window.location.replace("/login");
      onClose?.();
    }
  };

  const sidebarContent = (
    <div className="w-64 h-full relative flex flex-col bg-[#071224] text-white border-r border-[#0b1220]">
      {/* Close button (visible only on mobile overlays) */}
      <button
        type="button"
        aria-label="Fechar menu"
        onClick={onClose ?? undefined}
        className="md:hidden absolute top-3 right-3 p-2 rounded bg-white/6 text-white hover:bg-white/10"
      >
        <X size={16} />
      </button>
      <div className="p-6 border-b border-[#0b1220]">
        <h1 className="text-2xl font-bold text-white">
          <span className="text-blue-500">Envio</span>
          <span className="mx-1 text-yellow-600 font-extrabold">Express</span>
        </h1>
        <div className="text-xs text-gray-300 mt-1">
          Envie mensagens facilmente
        </div>
      </div>

      <nav className="flex-1 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => onClose?.()}
              className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? "bg-[#0b1620] border-l-4 border-blue-500 text-white" : "text-gray-300 hover:bg-[#0b1620]/70"}`}
            >
              <Icon
                size={18}
                className={isActive ? "text-blue-400" : "text-gray-400"}
              />
              <span
                className={`text-sm ${isActive ? "text-white font-medium" : "text-gray-200"}`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="p-6 border-t border-[#0b1220]">
        <button
          type="button"
          onClick={() => {
            handleLogout();
          }}
          className="flex items-center gap-3 w-full px-4 py-2 text-gray-200 hover:bg-red-700/10 rounded"
        >
          <LogOut size={18} className="text-gray-300" />
          <span className="text-sm">Sair</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar (hidden on small screens) */}
      <aside className="hidden md:flex fixed left-0 top-0 h-screen">
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={onClose ?? undefined}
            aria-hidden="true"
          />
          <div className="relative">
            <div className="h-screen">{sidebarContent}</div>
          </div>
        </div>
      )}
    </>
  );
}
