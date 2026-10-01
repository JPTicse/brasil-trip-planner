"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { ActivityDetailModal } from "@/components/activity-detail-modal";
import {
  createOsmMap,
  dotMarkerElement,
  fitMapToPoints,
  homeMarkerElement,
  setRouteLine,
} from "@/lib/maplibre";
import { formatTime } from "@/lib/format";
import { type Accommodation, type Activity, type ActivityType } from "@/lib/types";
import { DayChipsV2 } from "@/components/v2/day-chips-v2";

const TYPE_COLOR: Record<ActivityType, string> = {
  visit: "#3b82f6",
  tour: "#8b5cf6",
  meal: "#f97316",
  event: "#f43f5e",
  free: "#10b981",
  transport: "#71717a",
};

const TYPE_EMOJI: Record<ActivityType, string> = {
  visit: "👀",
  tour: "🚌",
  meal: "🍽️",
  event: "🎉",
  free: "🌿",
  transport: "✈️",
};

function timeToMinutes(t: string | null | undefined): number {
  if (!t) return 24 * 60;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function ItineraryMap({
  activities,
  accommodations,
  tripId,
  currentUserId,
  days,
  selectedDay,
  onSelectDay,
}: {
  activities: Activity[];
  accommodations: Accommodation[];
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

  // Filtrar actividades con coordenadas y del día seleccionado
  const dayActivities = activities.filter(
    (a) =>
      a.date === selectedDay &&
      a.location_lat != null &&
      a.location_lng != null,
  );
  const locatedAccommodations = accommodations.filter(
    (accommodation) =>
      accommodation.address &&
      accommodation.location_lat != null &&
      accommodation.location_lng != null &&
      accommodation.check_in &&
      accommodation.check_out,
  );
  const endAccommodation = locatedAccommodations
    .filter(
      (accommodation) =>
        accommodation.check_in! <= selectedDay && selectedDay < accommodation.check_out!,
    )
    .sort((a, b) => b.check_in!.localeCompare(a.check_in!))[0] ?? null;
  const startAccommodation = locatedAccommodations
    .filter(
      (accommodation) =>
        accommodation.check_in! < selectedDay && selectedDay <= accommodation.check_out!,
    )
    .sort((a, b) => b.check_in!.localeCompare(a.check_in!))[0] ?? endAccommodation;
  const sameDayAccommodation = Boolean(
    startAccommodation && endAccommodation && startAccommodation.id === endAccommodation.id,
  );

  // Inicializar mapa una sola vez (MapLibre + tiles OSM/Carto, gratis)
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

  // Renderizar markers cuando cambia el día o las actividades
  useEffect(() => {
    const map = mapInstance.current;
    if (!map || loading) return;

    // Limpiar markers y ruta anteriores
    for (const m of markersRef.current) m.remove();
    markersRef.current = [];
    setRouteLine(map, []);

    if (dayActivities.length === 0 && !startAccommodation && !endAccommodation) return;

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
        const item = document.getElementById(`map-item-${a.id}`);
        item?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      markersRef.current.push(
        new maplibregl.Marker({ element: el }).setLngLat(pos).addTo(map),
      );
    });

    const addAccommodationMarker = (
      accommodation: Accommodation,
      label: string,
      color: string,
      title: string,
    ) => {
      const pos: [number, number] = [accommodation.location_lng!, accommodation.location_lat!];
      points.push(pos);
      const el =
        label === "A" ? homeMarkerElement(color) : dotMarkerElement(color, label);
      el.title = `${title}: ${accommodation.name}`;
      markersRef.current.push(
        new maplibregl.Marker({ element: el }).setLngLat(pos).addTo(map),
      );
    };

    // Alojamientos al final para que queden encima de las actividades
    if (startAccommodation) {
      addAccommodationMarker(
        startAccommodation,
        sameDayAccommodation ? "A" : "S",
        "#047857",
        sameDayAccommodation ? "Alojamiento" : "Salida",
      );
    }
    if (endAccommodation && !sameDayAccommodation) {
      addAccommodationMarker(endAccommodation, "F", "#0f766e", "Final");
    }

    // Línea conectando: alojamiento de salida → actividades por hora → alojamiento final
    const path: [number, number][] = [
      ...(startAccommodation
        ? [[startAccommodation.location_lng!, startAccommodation.location_lat!] as [number, number]]
        : []),
      ...sorted.map(
        (activity) => [activity.location_lng!, activity.location_lat!] as [number, number],
      ),
      ...(endAccommodation && (!sameDayAccommodation || sorted.length > 0)
        ? [[endAccommodation.location_lng!, endAccommodation.location_lat!] as [number, number]]
        : []),
    ];
    setRouteLine(map, path);

    fitMapToPoints(map, points);
  }, [dayActivities, startAccommodation, endAccommodation, sameDayAccommodation, loading]);

  if (error) {
    return (
      <div className="rounded-xl border border-dashed border-amber-200 bg-amber-50 px-4 py-8 text-center dark:border-amber-900/50 dark:bg-amber-900/20">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          No se pudo cargar el mapa.
        </p>
        <p className="mt-1 text-xs text-amber-600/80 dark:text-amber-500/80">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Chips de días */}
      {days.length > 0 && (
        <DayChipsV2
          days={days}
          selectedDay={selectedDay}
          onSelect={onSelectDay}
          activities={activities}
        />
      )}

      {/* Mapa */}
      <div className="relative h-[40dvh] overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
        <div ref={mapRef} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-50 dark:bg-zinc-900">
            <svg className="h-6 w-6 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {dayActivities.length === 0 && !startAccommodation && !endAccommodation && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No hay actividades ni alojamiento con ubicación para este día.
            </p>
          </div>
        )}
      </div>

      {(startAccommodation || endAccommodation) && (
        <div className="space-y-1.5">
          {startAccommodation && (
            <div className="flex items-center gap-2.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 dark:border-emerald-900/60 dark:bg-emerald-900/20">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-700 text-[10px] font-bold text-white">
                {sameDayAccommodation ? (
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 11l9-8 9 8M5 10v11h14V10M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : "S"}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-emerald-700 dark:text-emerald-400">
                  {sameDayAccommodation ? "Inicio y final en tu alojamiento" : "Punto de salida"}
                </p>
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {startAccommodation.name}
                </p>
                <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {startAccommodation.address}
                </p>
              </div>
            </div>
          )}
          {endAccommodation && !sameDayAccommodation && (
            <div className="flex items-center gap-2.5 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 dark:border-teal-900/60 dark:bg-teal-900/20">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-teal-700 text-[10px] font-bold text-white">
                F
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-wide text-teal-700 dark:text-teal-400">
                  Final del día
                </p>
                <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {endAccommodation.name}
                </p>
                <p className="truncate text-[11px] text-zinc-500 dark:text-zinc-400">
                  {endAccommodation.address}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista compacta debajo (ordenada por hora) */}
      {dayActivities.length > 0 && (
        <div className="space-y-1.5">
          {dayActivities
            .slice()
            .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time))
            .map((a, idx) => {
              const color = TYPE_COLOR[a.type] ?? TYPE_COLOR.visit;
              const emoji = TYPE_EMOJI[a.type] ?? "👀";
              const isHighlighted = highlightId === a.id;
              const trigger = (
                <div
                  id={`map-item-${a.id}`}
                  className={`flex w-full items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left shadow-sm transition active:scale-[0.99] hover:shadow-md dark:bg-zinc-900 ${
                    isHighlighted
                      ? "border-emerald-500 ring-2 ring-emerald-500/30"
                      : "border-zinc-100 dark:border-zinc-800"
                  }`}
                >
                  <div
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white shadow-sm"
                    style={{ backgroundColor: color }}
                  >
                    {idx + 1}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                      {emoji} {a.title}
                    </p>
                    <p className="line-clamp-1 text-[11px] text-zinc-500 dark:text-zinc-400">
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
