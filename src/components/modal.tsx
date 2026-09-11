"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Modal reutilizable con Portal, bloqueo de scroll, y prevención de click-through.
 * Renderiza fuera del árbol de componentes para evitar propagación de eventos.
 */
export function Modal({
  open,
  onClose,
  children,
  zIndex = 50,
}: {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
  zIndex?: number;
}) {
  const [mounted, setMounted] = useState(false);
  const justClosedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  // Bloquear scroll del body cuando el modal está abierto
  useEffect(() => {
    if (open) {
      const prev = {
        overflow: document.body.style.overflow,
        touchAction: document.body.style.touchAction,
      };
      document.body.style.overflow = "hidden";
      document.body.style.touchAction = "none";
      return () => {
        document.body.style.overflow = prev.overflow;
        document.body.style.touchAction = prev.touchAction;
      };
    }
  }, [open]);

  // Cerrar con Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Interceptor GLOBAL de clicks después de cerrar.
  // No depende de [open] — se mantiene activo 400ms tras el cierre
  // para absorber el click/pointerdown que sigue al pointerup del overlay.
  useEffect(() => {
    const intercept = (e: MouseEvent | TouchEvent) => {
      if (justClosedRef.current) {
        e.stopPropagation();
        e.preventDefault();
        e.stopImmediatePropagation();
      }
    };
    document.addEventListener("click", intercept, true);
    document.addEventListener("touchend", intercept, true);
    document.addEventListener("pointerdown", intercept, true);
    document.addEventListener("mousedown", intercept, true);
    return () => {
      document.removeEventListener("click", intercept, true);
      document.removeEventListener("touchend", intercept, true);
      document.removeEventListener("pointerdown", intercept, true);
      document.removeEventListener("mousedown", intercept, true);
    };
  }, []);

  const handleClose = () => {
    justClosedRef.current = true;
    onClose();
    setTimeout(() => { justClosedRef.current = false; }, 400);
  };

  if (!mounted || !open) return null;

  return createPortal(
    <div
      className="fixed inset-0 flex items-end justify-center sm:items-center"
      style={{ zIndex }}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70"
        onPointerDown={(e) => {
          if (e.target === e.currentTarget) handleClose();
        }}
      />
      {/* Contenido del modal */}
      <div
        className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-3xl"
        onPointerDown={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
