"use client";
import { createContext, useCallback, useContext, useState } from "react";

type Toast = {
  id: string;
  type: "success" | "error" | "info";
  message: string;
};

type ToastContextValue = {
  showToast: (t: Omit<Toast, "id">) => void;
};

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback(({ type, message }: Omit<Toast, "id">) => {
    const id = String(Date.now()) + Math.random().toString(36).slice(2, 7);
    const t: Toast = { id, type, message };
    setToasts((s) => [t, ...s]);
    setTimeout(() => {
      setToasts((s) => s.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="fixed top-6 right-6 z-50 flex flex-col gap-3">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`max-w-sm w-full px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 transition-opacity animate-fade-in ${
              t.type === "success"
                ? "bg-green-50 border border-green-200 text-green-800"
                : t.type === "error"
                  ? "bg-red-50 border border-red-200 text-red-800"
                  : "bg-gray-50 border border-gray-200 text-gray-800"
            }`}
          >
            <div className="flex-1 text-sm">{t.message}</div>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Durante prerender ou quando usado fora do provider, retornar um fallback silencioso
    return {
      showToast: (_: Omit<Toast, "id">) => {
        // noop
      },
    } as ToastContextValue;
  }
  return ctx;
}
