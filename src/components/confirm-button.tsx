"use client";

import { useTransition, useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

/**
 * Botón que muestra un diálogo de confirmación antes de ejecutar una acción.
 * Incluye estado de carga con spinner.
 *
 * Uso:
 * <ConfirmButton
 *   action={deleteActivity}
 *   fields={[{ name: "activity_id", value: activity.id }, { name: "trip_id", value: tripId }]}
 *   confirmTitle="¿Eliminar actividad?"
 *   confirmMessage="Esta acción no se puede deshacer."
 *   confirmLabel="Eliminar"
 * >
 *   <svg ... />
 * </ConfirmButton>
 */
export function ConfirmButton({
  action,
  fields,
  confirmTitle,
  confirmMessage,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  variant = "danger",
  children,
  className = "",
  onSuccess,
  detail,
}: {
  action: (formData: FormData) => Promise<void>;
  fields: { name: string; value: string }[];
  confirmTitle: string;
  confirmMessage: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "neutral";
  children: React.ReactNode;
  className?: string;
  onSuccess?: () => void;
  detail?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => setMounted(true), []);

  const handleConfirm = () => {
    const formData = new FormData();
    for (const f of fields) formData.append(f.name, f.value);
    startTransition(async () => {
      try {
        await action(formData);
        setOpen(false);
        onSuccess?.();
      } catch (e) {
        console.error(e);
        setOpen(false);
      }
    });
  };

  const VARIANT_BTN = {
    danger: "bg-red-600 text-white hover:bg-red-700",
    warning: "bg-amber-500 text-white hover:bg-amber-600",
    neutral: "bg-zinc-800 text-white hover:bg-zinc-900",
  };

  const VARIANT_ICON = {
    danger: "text-red-100 dark:text-red-900/40",
    warning: "text-amber-100 dark:text-amber-900/40",
    neutral: "text-zinc-100 dark:text-zinc-800",
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className={className}
        disabled={pending}
      >
        {pending ? (
          <svg className="h-3.5 w-3.5 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        ) : (
          children
        )}
      </button>

      {mounted && open && createPortal(
        <div
          className="fixed inset-0 flex items-end justify-center sm:items-center"
          style={{ zIndex: 80 }}
        >
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget && !pending) setOpen(false);
            }}
          />
          {/* Contenido */}
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-3xl">
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>

            <div className="px-5 pb-5 pt-2">
              {/* Icono */}
              <div className="mb-3 flex justify-center">
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  variant === "danger"
                    ? "bg-red-100 dark:bg-red-900/30"
                    : variant === "warning"
                    ? "bg-amber-100 dark:bg-amber-900/30"
                    : "bg-zinc-100 dark:bg-zinc-800"
                }`}>
                  <svg className={`h-6 w-6 ${
                    variant === "danger"
                      ? "text-red-600 dark:text-red-400"
                      : variant === "warning"
                      ? "text-amber-600 dark:text-amber-400"
                      : "text-zinc-600 dark:text-zinc-400"
                  }`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              <h3 className="text-center text-base font-bold text-zinc-900 dark:text-zinc-100">
                {confirmTitle}
              </h3>
              <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
                {confirmMessage}
              </p>
              {detail && (
                <div className="mt-3 rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                  {detail}
                </div>
              )}

              {/* Botones */}
              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={pending}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-95 disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  {cancelLabel}
                </button>
                <button
                  type="button"
                  onClick={handleConfirm}
                  disabled={pending}
                  className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl py-3 text-sm font-semibold shadow-lg transition active:scale-95 disabled:opacity-70 ${VARIANT_BTN[variant]}`}
                >
                  {pending ? (
                    <>
                      <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Procesando...
                    </>
                  ) : (
                    confirmLabel
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
