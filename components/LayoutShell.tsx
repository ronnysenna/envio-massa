"use client";
import React from "react";
import { usePathname } from "next/navigation";
import SidebarLoader from "./SidebarLoader";
import ThemeToggle from "./ThemeToggle";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const seg = pathname ? pathname.split('/')[1] || '' : '';
    const hideShell = seg === 'login' || seg === 'register' || (pathname ? pathname.startsWith('/login') || pathname.startsWith('/register') : false);

    if (hideShell) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex">
            <SidebarLoader />

            <div className="flex-1 min-h-screen flex flex-col ml-64">
                <header className="h-16 flex items-center px-6 bg-(--panel) border-b border-(--border) shadow-sm">
                    <div className="flex-1 text-sm text-(--muted)">&nbsp;</div>
                    <div className="flex items-center gap-3"><ThemeToggle /></div>
                </header>

                <main className="flex-1 p-6">{children}</main>
            </div>
        </div>
    );
}
