"use client";
import { ToastProvider } from "./ToastProvider";
import { ThemeProvider } from "./ThemeProvider";

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    return (
        <ThemeProvider>
            <ToastProvider>{children}</ToastProvider>
        </ThemeProvider>
    );
}
