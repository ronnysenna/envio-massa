import type { Metadata } from "next";
import "../../app/globals.css";

export const metadata: Metadata = {
    title: "Registrar - Envio em Massa",
};

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen bg-linear-to-br from-slate-800 to-gray-900 text-gray-100">
            {children}
        </div>
    );
}
