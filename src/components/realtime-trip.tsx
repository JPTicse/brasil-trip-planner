"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { useTripPolling } from "@/components/use-trip-realtime";

export function RealtimeTrip({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const body = document.body;
    const observer = new MutationObserver(() => {
      setFormOpen(body.getAttribute("data-pause-polling") === "true");
    });
    observer.observe(body, { attributes: true, attributeFilter: ["data-pause-polling"] });
    setFormOpen(body.getAttribute("data-pause-polling") === "true");
    return () => observer.disconnect();
  }, []);

  const isFormPage = pathname?.endsWith("/new") || pathname?.includes("/edit");

  useTripPolling(tripId, { pause: isFormPage || formOpen });
  return null;
}
