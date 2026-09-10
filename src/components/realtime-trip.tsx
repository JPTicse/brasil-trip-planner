"use client";

import { useTripPolling } from "@/components/use-trip-realtime";

export function RealtimeTrip({ tripId }: { tripId: string }) {
  useTripPolling(tripId);
  return null;
}
