"use client";
import Sidebar from "./Sidebar";
import { usePathname } from "next/navigation";

export default function SidebarLoader() {
    const pathname = usePathname();
    if (!pathname) return null;

    // esconder sidebar nas rotas de autenticação (login, register) e em subrotas
    const seg = pathname.split('/')[1] || '';
    if (seg === 'login' || seg === 'register' || pathname.startsWith('/login') || pathname.startsWith('/register')) return null;

    return <Sidebar />;
}
