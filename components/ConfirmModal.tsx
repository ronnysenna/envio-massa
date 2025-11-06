"use client";

import { useEffect, useRef } from "react";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmModal({
  open,
  title = "Confirmação",
  description,
  confirmLabel = "Excluir",
  cancelLabel = "Cancelar",
  loading = false,
  onCancel,
  onConfirm,
}: ConfirmModalProps) {
  const modalRef = useRef<HTMLDivElement | null>(null);
  const confirmRef = useRef<HTMLButtonElement | null>(null);
  const cancelRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const prevActive = document.activeElement as HTMLElement | null;

    // focus first actionable element
    const toFocus = confirmRef.current ?? cancelRef.current;
    toFocus?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
        return;
      }

      if (e.key === "Tab") {
        // focus trap
        const root = modalRef.current;
        if (!root) return;
        const focusable = Array.from(
          root.querySelectorAll<HTMLElement>(
            'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((n) => n.offsetParent !== null);
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];

        if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      }
    }

    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      // restore focus
      prevActive?.focus?.();
    };
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
      role="button"
      tabIndex={0}
      onClick={(e) => {
        // fechar ao clicar no backdrop (mas não quando clicar no conteúdo)
        if (e.target === e.currentTarget) onCancel();
      }}
      onKeyUp={(e) => {
        // permitir fechamento via Enter ou Space quando o backdrop estiver focado
        if (e.key === "Enter" || e.key === " ") {
          onCancel();
        }
      }}
    >
      <div
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-modal-title"
        className="w-full max-w-md bg-white rounded-lg shadow-lg overflow-hidden transform transition-all duration-150 ease-out scale-100"
      >
        <div className="p-4 border-b">
          <h3 id="confirm-modal-title" className="text-lg font-semibold">
            {title}
          </h3>
        </div>
        <div className="p-4">
          {description && (
            <p className="text-sm text-gray-700 mb-4">{description}</p>
          )}
          <div className="flex items-center justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="px-3 py-1 rounded bg-gray-200"
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              disabled={loading}
              onClick={onConfirm}
              className={`px-3 py-1 rounded text-white ${loading ? "bg-gray-400" : "bg-red-600"}`}
            >
              {loading ? "Excluindo..." : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
