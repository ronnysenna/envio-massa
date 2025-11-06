"use client";
import { ThemeProvider } from "./ThemeProvider";
import { ToastProvider } from "./ToastProvider";

export default function ClientProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ThemeProvider>
      <ToastProvider>{children}</ToastProvider>
    </ThemeProvider>
  );
}
