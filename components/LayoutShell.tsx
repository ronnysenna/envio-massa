"use client";
import { Menu } from "lucide-react";
import { usePathname } from "next/navigation";
import React from "react";
import Footer from "./Footer";
import Sidebar from "./Sidebar";
import SidebarLoader from "./SidebarLoader";

export default function LayoutShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const seg = pathname ? pathname.split("/")[1] || "" : "";
  const hideShell =
    seg === "login" ||
    seg === "register" ||
    (pathname
      ? pathname.startsWith("/login") || pathname.startsWith("/register")
      : false);

  // header/title removed — titles map intentionally omitted

  const [mobileOpen, setMobileOpen] = React.useState(false);

  if (hideShell) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex pt-[env(safe-area-inset-top)]">
      <SidebarLoader />

      <div className="flex-1 min-h-screen flex flex-col md:ml-64 pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="md:hidden fixed top-4 left-4 z-40 p-2 bg-[#071224] text-white rounded shadow-lg"
          aria-label="Abrir menu"
        >
          <Menu size={24} />
        </button>

        <main className="flex-1 p-4 sm:p-6 pb-[env(safe-area-inset-bottom)] pt-16 md:pt-4">
          {children}
        </main>
        <footer className="mt-auto">
          <React.Suspense fallback={null}>
            <Footer />
          </React.Suspense>
        </footer>
      </div>

      {/* Mobile sidebar overlay instance controlled via state */}
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
    </div>
  );
}
