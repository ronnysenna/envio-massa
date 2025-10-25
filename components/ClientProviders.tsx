"use client";
import { ToastProvider } from "./ToastProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return <ToastProvider>{children}</ToastProvider>;
}
