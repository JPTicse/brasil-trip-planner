"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";

/**
 * Modal reutilizable v2 con animaciones de slide-up/down usando motion/react.
 * Versión específica para itinerary-v2 — no afecta al modal compartido v1.
 *
 * Animaciones:
 * - Overlay: fade in/out
 * - Contenido: slide-up entrada, slide-down salida (spring)
 * - AnimatePresence maneja la animación de salida, eliminando el hack justClosedRef.
 */
export function ModalV2({
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
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0 flex items-end justify-center sm:items-center"
          style={{ zIndex }}
        >
          {/* Overlay con fade */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) onClose();
            }}
          />
          {/* Contenido del modal con slide-up/down */}
          <motion.div
            className="relative z-10 flex max-h-[90dvh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-3xl"
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 300 }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            {/* Handle bar */}
            <div className="flex shrink-0 justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
