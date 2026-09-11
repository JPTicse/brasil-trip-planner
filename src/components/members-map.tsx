"use client";

import { GoogleMap, type MapMarker } from "@/components/google-map";
import type { Profile } from "@/lib/types";

export function MembersMap({ members }: { members: Profile[] }) {
  const markers: MapMarker[] = members
    .filter((m) => m.location_lat != null && m.location_lng != null)
    .map((m) => ({
      lat: m.location_lat!,
      lng: m.location_lng!,
      title: m.name ?? "Usuario",
    }));

  if (markers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-700 bg-white/50 dark:bg-zinc-900/50 px-4 py-8 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          Nadie está compartiendo su ubicación todavía.
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">
          La app pedirá permiso de ubicación automáticamente.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-700">
      <GoogleMap markers={markers} height="250px" zoom={12} />
    </div>
  );
}
