"use client";

import { useEffect, useState } from "react";
import { updateMyLocation } from "@/lib/actions";

export function LocationTracker() {
  const [status, setStatus] = useState<"idle" | "requesting" | "tracking" | "denied" | "error">("idle");

  useEffect(() => {
    if (!("geolocation" in navigator)) {
      setStatus("error");
      return;
    }

    setStatus("requesting");

    const sendLocation = (lat: number, lng: number) => {
      const formData = new FormData();
      formData.set("lat", String(lat));
      formData.set("lng", String(lng));
      updateMyLocation(formData).catch(console.error);
    };

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setStatus("tracking");
        sendLocation(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          setStatus("denied");
        } else {
          setStatus("error");
        }
      },
      {
        enableHighAccuracy: true,
        maximumAge: 30000, // 30s
        timeout: 15000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, []);

  if (status === "idle" || status === "requesting") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
        Solicitando ubicación...
      </div>
    );
  }

  if (status === "tracking") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-emerald-600">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
        </span>
        Ubicación compartida
      </div>
    );
  }

  if (status === "denied") {
    return (
      <div className="flex items-center gap-1.5 text-[11px] text-amber-600">
        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Ubicación denegada
      </div>
    );
  }

  return null;
}
