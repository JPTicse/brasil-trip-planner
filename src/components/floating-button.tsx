"use client";

import { useState, useCallback } from "react";
import { useDockVisible } from "@/components/use-dock-visible";

/**
 * Botón flotante (FAB) fijo en la esquina inferior derecha.
 * Se reposiciona cuando el dock se esconde/muestra.
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
  const dockVisible = useDockVisible();

  return (
    <button
      onClick={onClick}
      aria-label={label}
      className={`fixed right-4 z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-600/30 transition-all duration-300 hover:bg-emerald-700 hover:shadow-xl hover:shadow-emerald-600/40 active:scale-90 ${
        dockVisible ? "bottom-20" : "bottom-6"
      }`}
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
