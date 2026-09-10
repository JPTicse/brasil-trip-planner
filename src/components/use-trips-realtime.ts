"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

/**
 * Suscribe a cambios en trip_members y trip_access_requests
 * para refrescar la lista de viajes en tiempo real.
 */
export function useTripsRealtime() {
  const router = useRouter();

  useEffect(() => {
    const supabase = createSupabaseBrowserClient();
    const channel = supabase
      .channel("trips-list")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trips" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_members" },
        () => router.refresh(),
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "trip_access_requests" },
        () => router.refresh(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [router]);
}
