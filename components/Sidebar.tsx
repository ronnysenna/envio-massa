"use client";

import { Home, Image as ImageIcon, LogOut, Send, Users } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logout } from "@/lib/auth";

const menuItems = [
    { href: "/dashboard", label: "Dashboard", icon: Home },
    { href: "/enviar", label: "Enviar Mensagem", icon: Send },
    { href: "/contatos", label: "Exportar Contatos", icon: Users },
    { href: "/imagem", label: "Upload de Imagem", icon: ImageIcon },
];

export default function Sidebar() {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        logout();
        router.push("/login");
    };

    return (
        <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col bg-white border-r" aria-label="Sidebar">
            <div className="p-6 border-b">
                <h1 className="text-lg font-bold text-gray-900">Envio em Massa</h1>
                <div className="text-xs text-muted mt-1">Envie campanhas facilmente</div>
            </div>

            <nav className="flex-1 py-6">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'border-l-4 border-primary-600 bg-gradient-to-r from-white to-[rgba(99,102,241,0.02)]' : 'text-gray-700 hover:bg-[rgba(15,23,42,0.02)]'}`}
                        >
                            <Icon size={18} className={isActive ? 'text-primary-600' : 'text-muted'} />
                            <span className={`text-sm ${isActive ? 'text-gray-900 font-medium' : 'text-gray-700'}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t">
                <button type="button" onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-gray-700 hover:bg-red-50 rounded">
                    <LogOut size={18} className="text-muted" />
                    <span className="text-sm">Sair</span>
                </button>
            </div>
        </aside>
    );
}
