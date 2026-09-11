"use client";

import { useState } from "react";
import { Modal } from "@/components/modal";

export function ComingSoon({
  icon,
  title,
  description,
  features,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  features: string[];
}) {
  const [open, setOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setOpen(false);
      setSubmitted(false);
      (e.target as HTMLFormElement).reset();
    }, 1500);
  };

  return (
    <div className="space-y-5">
      <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h2>

      {/* Card "Próximamente" */}
      <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-6 dark:border-zinc-800 dark:from-zinc-900 dark:to-zinc-900/50">
        <div className="flex flex-col items-center text-center">
          {/* Icono grande */}
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-100 dark:bg-zinc-800">
            {icon}
          </div>

          <span className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Próximamente
          </span>

          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
            {title}
          </h3>
          <p className="mt-1 max-w-xs text-sm text-zinc-500 dark:text-zinc-400">
            {description}
          </p>

          {/* Features previstas */}
          <ul className="mt-4 w-full max-w-xs space-y-1.5 text-left">
            {features.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <svg className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {f}
              </li>
            ))}
          </ul>

          {/* Botón sugerencia */}
          <button
            onClick={() => setOpen(true)}
            className="mt-5 flex items-center gap-1.5 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
          >
            <svg className="h-4 w-4 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Sugerir una idea
          </button>
        </div>
      </div>

      {/* Modal de sugerencia */}
      <Modal open={open} onClose={() => setOpen(false)} zIndex={50}>
        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Sugerencia para {title}</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {submitted ? (
          <div className="px-5 pb-6 pt-4 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30 mx-auto">
              <svg className="h-6 w-6 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">¡Gracias por tu sugerencia!</p>
            <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">La tendremos en cuenta para futuras versiones.</p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-4 pt-1"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                ¿Qué te gustaría ver aquí?
              </label>
              <textarea
                name="content"
                required
                rows={4}
                placeholder="Ej: Me gustaría poder reservar hoteles directamente desde la app, ver mapas, comparar precios..."
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-zinc-600 dark:text-zinc-300">
                Tu nombre (opcional)
              </label>
              <input
                name="author"
                type="text"
                placeholder="Anónimo"
                className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500"
              />
            </div>

            <div className="sticky bottom-0 -mx-5 mt-2 border-t border-zinc-100 bg-white/95 px-5 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:border-zinc-800 dark:bg-zinc-900/95">
              <button
                type="submit"
                className="w-full rounded-2xl bg-emerald-600 py-3.5 text-base font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-700 active:scale-95"
              >
                Enviar sugerencia
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
