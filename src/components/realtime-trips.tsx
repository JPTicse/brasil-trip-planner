"use client";

import { useTripsPolling } from "@/components/use-trips-realtime";

export function RealtimeTrips() {
  useTripsPolling();
  return null;
}
