"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

const STORAGE_KEY = "beta-access-v2";

export function BetaAccess({ tripId }: { tripId: string }) {
  const [unlocked, setUnlocked] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);

  useEffect(() => {
    setUnlocked(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  const handleUnlock = () => {
    if (password.trim().toLowerCase() === "beta") {
      localStorage.setItem(STORAGE_KEY, "true");
      setUnlocked(true);
      setShowPrompt(false);
      setPassword("");
      setError(false);
    } else {
      setError(true);
    }
  };

  if (unlocked) {
    return (
      <div className="mt-6 rounded-xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900">
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100 text-xs font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
            ✓
          </span>
          <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
            Beta desbloqueado
          </h3>
        </div>
        <p className="mt-1.5 text-xs text-stone-500 dark:text-stone-400">
          Tienes acceso al itinerario v2 con diseño minimalista.
        </p>
        <Link
          href={`/trips/${tripId}/itinerary-v2`}
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg bg-stone-900 py-2.5 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-[0.98] dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
        >
          Ver itinerario v2
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setShowPrompt(true)}
        className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl border border-stone-200 bg-white py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50 active:scale-[0.98] dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M15 7a4 4 0 11-8 0 4 4 0 018 0zM12 15a7 7 0 00-7 7M19 15a7 7 0 017 7" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Acceso beta
      </button>

      {showPrompt && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center sm:items-center"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowPrompt(false);
          }}
        >
          <div className="absolute inset-0 bg-black/40 dark:bg-black/60" />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-2xl bg-white shadow-xl dark:bg-stone-900 sm:rounded-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-8 rounded-full bg-stone-300 dark:bg-stone-700" />
            </div>
            <div className="px-5 pb-5 pt-3">
              <h3 className="text-base font-semibold text-stone-900 dark:text-stone-100">
                Acceso beta
              </h3>
              <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">
                Introduce la contraseña para desbloquear el itinerario v2.
              </p>
              <input
                type="password"
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError(false);
                }}
                onKeyDown={(e) => e.key === "Enter" && handleUnlock()}
                placeholder="Contraseña"
                className={`mt-4 w-full rounded-lg border bg-stone-50 px-4 py-3 text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none dark:bg-stone-800 dark:text-stone-100 dark:placeholder:text-stone-500 ${
                  error
                    ? "border-red-400 focus:border-red-500"
                    : "border-stone-200 focus:border-stone-400 dark:border-stone-700 dark:focus:border-stone-500"
                }`}
              />
              {error && (
                <p className="mt-2 text-xs text-red-500">Contraseña incorrecta</p>
              )}
              <div className="mt-5 flex gap-2">
                <button
                  onClick={() => {
                    setShowPrompt(false);
                    setPassword("");
                    setError(false);
                  }}
                  className="flex-1 rounded-lg border border-stone-200 bg-white py-3 text-sm font-medium text-stone-600 transition hover:bg-stone-50 active:scale-95 dark:border-stone-700 dark:bg-stone-800 dark:text-stone-300 dark:hover:bg-stone-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUnlock}
                  className="flex-1 rounded-lg bg-stone-900 py-3 text-sm font-medium text-white transition hover:bg-stone-800 active:scale-95 dark:bg-white dark:text-stone-900 dark:hover:bg-stone-100"
                >
                  Desbloquear
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
