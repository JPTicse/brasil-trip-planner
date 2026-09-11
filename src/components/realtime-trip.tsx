"use client";

import { usePathname } from "next/navigation";
import { useTripPolling } from "@/components/use-trip-realtime";

export function RealtimeTrip({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const isFormPage = pathname?.endsWith("/new") || pathname?.includes("/edit");

  useTripPolling(tripId, { pause: isFormPage });
  return null;
}
