"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Suscribe a cambios en las tablas del viaje y refresca la ruta
 * cuando hay inserciones/actualizaciones/eliminaciones.
 */
export function useTripRealtime(tripId: string) {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel(`trip-${tripId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expenses", filter: `trip_id=eq.${tripId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "expense_splits" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "activities", filter: `trip_id=eq.${tripId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "accommodations", filter: `trip_id=eq.${tripId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transports", filter: `trip_id=eq.${tripId}` },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_members", filter: `trip_id=eq.${tripId}` },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tripId, router]);
}
