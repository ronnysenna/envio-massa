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
        <aside className="w-64 h-screen fixed left-0 top-0 flex flex-col bg-[#071224] text-white border-r border-[#0b1220]" aria-label="Sidebar">
            <div className="p-6 border-b border-[#0b1220]">
                <h1 className="text-lg font-bold text-white">Envio em Massa</h1>
                <div className="text-xs text-gray-300 mt-1">Envie campanhas facilmente</div>
            </div>

            <nav className="flex-1 py-6">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex items-center gap-3 px-6 py-3 transition-colors ${isActive ? 'bg-[#0b1620] border-l-4 border-blue-500 text-white' : 'text-gray-300 hover:bg-[#0b1620]/70'}`}
                        >
                            <Icon size={18} className={isActive ? 'text-blue-400' : 'text-gray-400'} />
                            <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-gray-200'}`}>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            <div className="p-6 border-t border-[#0b1220]">
                <button type="button" onClick={handleLogout} className="flex items-center gap-3 w-full px-4 py-2 text-gray-200 hover:bg-red-700/10 rounded">
                    <LogOut size={18} className="text-gray-300" />
                    <span className="text-sm">Sair</span>
                </button>
            </div>
        </aside>
    );
}
