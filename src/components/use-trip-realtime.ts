"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

/**
 * Refresca los datos del servidor periódicamente mientras la pestaña
 * está activa. Deja de hacer polling cuando la pestaña está en segundo
 * plano para ahorrar recursos.
 *
 * Más confiable que Supabase Realtime cuando se usa service_role
 * (que bypassa RLS y por tanto no recibe eventos de realtime).
 */
export function useTripPolling(tripId: string, intervalMs = 5000) {
  const router = useRouter();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startPolling = () => {
      if (intervalRef.current) return;
      intervalRef.current = setInterval(() => {
        router.refresh();
      }, intervalMs);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Refrescar inmediatamente al volver a la pestaña
        router.refresh();
        startPolling();
      } else {
        stopPolling();
      }
    };

    // Iniciar polling si la pestaña está visible
    if (document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [tripId, router, intervalMs]);
}
