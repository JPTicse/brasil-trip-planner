"use client";

import { useState, useCallback } from "react";

/**
 * Botón flotante (FAB) fijo en la esquina inferior derecha.
 * Mantiene el botón siempre visible sin importar el scroll.
 * Respeta el bottom-nav (se posiciona encima).
 */
export function FloatingActionButton({
  onClick,
  label,
  icon,
}: {
  onClick: () => void;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="fixed bottom-20 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/40 active:scale-90"
      style={{ marginBottom: "env(safe-area-inset-bottom)" }}
    >
      {icon ?? (
        <svg className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

/**
 * Hook para manejar un FAB que abre un modal/form.
 * El FAB se renderiza por separado del contenido del modal.
 */
export function useFloatingButton() {
  const [open, setOpen] = useState(false);
  const handleOpen = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);
  return { open, handleOpen, handleClose };
}
