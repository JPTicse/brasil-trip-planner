"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { ActivityDetailModalV2 as ActivityDetailModal } from "@/components/v2/activity-detail-modal-v2";
import {
  createOsmMap,
  dotMarkerElement,
  fitMapToPoints,
  setRouteLine,
} from "@/lib/maplibre";
import { formatTime } from "@/lib/format";
import { type Activity, type ActivityType } from "@/lib/types";
import { DayChipsV2 } from "@/components/v2/day-chips-v2";

const TYPE_COLOR: Record<ActivityType, string> = {
  visit: "#3b82f6",
  tour: "#8b5cf6",
  meal: "#f97316",
  event: "#f43f5e",
  free: "#10b981",
  transport: "#71717a",
};

function timeToMinutes(t: string | null | undefined): number {
  if (!t) return 24 * 60;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function ItineraryMapV2({
  activities,
  tripId,
  currentUserId,
  days,
  selectedDay,
  onSelectDay,
}: {
  activities: Activity[];
  tripId: string;
  currentUserId: string;
  days: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [highlightId, setHighlightId] = useState<string | null>(null);

  const dayActivities = activities.filter(
    (a) =>
      a.date === selectedDay &&
      a.location_lat != null &&
      a.location_lng != null,
  );

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled || !mapRef.current || mapInstance.current) return;
        const map = createOsmMap(mapRef.current, { center: [-46.6361, -23.5475], zoom: 12 });
        mapInstance.current = map;
        let styleLoaded = false;
        map.on("load", () => {
          styleLoaded = true;
          if (!cancelled) setLoading(false);
        });
        map.on("error", () => {
          if (!cancelled && !styleLoaded) {
            setError("Error al cargar el mapa");
            setLoading(false);
          }
        });
      })
      .catch((e) => {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Error al cargar el mapa");
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!map || loading) return;

    for (const m of markersRef.current) m.remove();
    markersRef.current = [];
    setRouteLine(map, []);

    if (dayActivities.length === 0) return;

    const points: [number, number][] = [];
    const sorted = dayActivities
      .slice()
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    sorted.forEach((a, idx) => {
      const pos: [number, number] = [a.location_lng!, a.location_lat!];
      points.push(pos);

      const color = TYPE_COLOR[a.type] ?? TYPE_COLOR.visit;
      const el = dotMarkerElement(color, String(idx + 1));
      el.title = a.title;
      el.addEventListener("click", () => {
        setHighlightId(a.id);
        const item = document.getElementById(`map-item-v2-${a.id}`);
        item?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      markersRef.current.push(
        new maplibregl.Marker({ element: el }).setLngLat(pos).addTo(map),
      );
    });

    setRouteLine(map, sorted.map((a) => [a.location_lng!, a.location_lat!]));
    fitMapToPoints(map, points);
  }, [dayActivities, loading]);

  if (error) {
    return (
      <div className="py-12 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No se pudo cargar el mapa.
        </p>
        <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.length > 0 && (
        <DayChipsV2 days={days} selectedDay={selectedDay} onSelect={onSelectDay} activities={activities} />
      )}

      <div className="relative h-[40dvh] overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <div ref={mapRef} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
            <svg className="h-6 w-6 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {dayActivities.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No hay actividades con ubicación para este día.
            </p>
          </div>
        )}
      </div>

      {dayActivities.length > 0 && (
        <div className="space-y-2">
          {dayActivities
            .slice()
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
            .map((a, idx) => {
              const isHighlighted = highlightId === a.id;
              const trigger = (
                <div
                  id={`map-item-v2-${a.id}`}
                  className={`flex w-full items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left transition active:scale-[0.99] hover:bg-zinc-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 ${
                    isHighlighted
                      ? "border-zinc-400 dark:border-zinc-500"
                      : "border-zinc-200 dark:border-zinc-800"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xs font-semibold text-zinc-400 dark:text-zinc-500">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-zinc-900 dark:text-zinc-50">
                      {a.title}
                    </p>
                    <p className="line-clamp-1 text-xs text-zinc-500 dark:text-zinc-400">
                      {a.start_time ? formatTime(a.start_time) : ""}
                      {a.start_time && a.location ? " · " : ""}
                      {a.location}
                    </p>
                  </div>
                </div>
              );
              return (
                <ActivityDetailModal
                  key={a.id}
                  activity={a}
                  tripId={tripId}
                  currentUserId={currentUserId}
                  trigger={trigger}
                  myActivities={activities}
                />
              );
            })}
        </div>
      )}
    </div>
  );
}
