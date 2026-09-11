"use client";

import { useMemo } from "react";
import { GoogleMap, type MapMarker } from "@/components/google-map";
import type { Profile } from "@/lib/types";

export function MembersMap({ members }: { members: Profile[] }) {
  const locatedMembers = useMemo(
    () => members.filter((member) => member.location_lat != null && member.location_lng != null),
    [members],
  );
  const markers = useMemo<MapMarker[]>(
    () => locatedMembers.map((member) => {
      const name = member.name ?? "Usuario";
      const label = name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();
      return {
        id: member.id,
        lat: member.location_lat!,
        lng: member.location_lng!,
        title: name,
        label,
      };
    }),
    [locatedMembers],
  );

  if (markers.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white/50 px-4 py-8 text-center dark:border-zinc-700 dark:bg-zinc-900/50">
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
      <div className="flex flex-wrap gap-2 border-t border-zinc-200 bg-white p-2.5 dark:border-zinc-700 dark:bg-zinc-900">
        {locatedMembers.map((member) => {
          const name = member.name ?? "Usuario";
          const initials = name.split(" ").map((word) => word[0]).slice(0, 2).join("").toUpperCase();
          return (
            <div key={member.id} className="flex items-center gap-1.5 text-xs text-zinc-700 dark:text-zinc-300">
              <span className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-[9px] font-bold text-white">
                {member.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                ) : initials}
              </span>
              <span className="max-w-24 truncate">{name}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
