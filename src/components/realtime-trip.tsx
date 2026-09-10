"use client";

import { useTripRealtime } from "@/components/use-trip-realtime";

export function RealtimeTrip({ tripId }: { tripId: string }) {
  useTripRealtime(tripId);
  return null;
}
