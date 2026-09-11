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
export function useTripPolling(tripId: string, options: { pause?: boolean } = {}) {
  const router = useRouter();
  const { pause } = options;
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const startPolling = () => {
      if (intervalRef.current || pause) return;
      intervalRef.current = setInterval(() => {
        router.refresh();
      }, 5000);
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        if (!pause) {
          router.refresh();
          startPolling();
        }
      } else {
        stopPolling();
      }
    };

    if (!pause && document.visibilityState === "visible") {
      startPolling();
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [tripId, router, pause]);
}
