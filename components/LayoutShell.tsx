"use client";
import React from "react";
import { usePathname } from "next/navigation";
import SidebarLoader from "./SidebarLoader";
import ThemeToggle from "./ThemeToggle";
import Sidebar from "./Sidebar";

export default function LayoutShell({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const seg = pathname ? pathname.split('/')[1] || '' : '';
    const hideShell = seg === 'login' || seg === 'register' || (pathname ? pathname.startsWith('/login') || pathname.startsWith('/register') : false);

    const [mobileOpen, setMobileOpen] = React.useState(false);

    if (hideShell) {
        return <>{children}</>;
    }

    return (
        <div className="min-h-screen flex pt-[env(safe-area-inset-top)]">
            <SidebarLoader />

            <div className="flex-1 min-h-screen flex flex-col md:ml-64 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
                <header className="h-14 sm:h-16 flex items-center px-4 sm:px-6 bg-(--panel) border-b border-(--border) shadow-sm">
                    <div className="flex items-center md:hidden mr-4">
                        <button type="button" onClick={() => setMobileOpen(true)} className="p-2 rounded-md bg-transparent">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-(--muted)" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" /></svg>
                        </button>
                    </div>

                    <div className="flex-1 text-sm text-(--muted)">&nbsp;</div>
                    <div className="flex items-center gap-3"><ThemeToggle /></div>
                </header>

                <main className="flex-1 p-4 sm:p-6 pb-[env(safe-area-inset-bottom)]">{children}</main>
            </div>

            {/* Mobile sidebar overlay instance controlled via state */}
            <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
        </div>
    );
}
