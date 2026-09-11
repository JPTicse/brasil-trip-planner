"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { loadGoogleMaps } from "@/lib/google-maps";
import { formatTime } from "@/lib/format";
import { type Activity, type ActivityType } from "@/lib/types";
import { DayChips } from "@/components/day-chips";

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
  tripId,
  currentUserId,
  days,
}: {
  activities: Activity[];
  tripId: string;
  currentUserId: string;
  days: string[];
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
  const [selectedDay, setSelectedDay] = useState<string>(
    days.length > 0 ? days[0] : "",
  );
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

  // Inicializar mapa una sola vez
  useEffect(() => {
    let cancelled = false;
    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        if (mapInstance.current) {
          setLoading(false);
          return;
        }
        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: { lat: -23.5475, lng: -46.6361 },
          zoom: 12,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: "greedy",
          styles: [
            { featureType: "poi", stylers: [{ visibility: "off" }] },
            { featureType: "transit", stylers: [{ visibility: "simplified" }] },
          ],
        });
        setLoading(false);
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
    if (!map) return;

    // Limpiar markers y polyline anteriores
    for (const m of markersRef.current) m.setMap(null);
    markersRef.current = [];
    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (dayActivities.length === 0) return;

    const bounds = new google.maps.LatLngBounds();
    const sorted = dayActivities
      .slice()
      .sort((a, b) => timeToMinutes(a.start_time) - timeToMinutes(b.start_time));

    sorted.forEach((a, idx) => {
      const pos = { lat: a.location_lat!, lng: a.location_lng! };
      bounds.extend(pos);

      const color = TYPE_COLOR[a.type] ?? TYPE_COLOR.visit;
      const label = String(idx + 1);

      const marker = new google.maps.Marker({
        position: pos,
        map,
        label: {
          text: label,
          color: "white",
          fontWeight: "bold",
          fontSize: "11px",
        },
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 14,
          fillColor: color,
          fillOpacity: 1,
          strokeColor: "white",
          strokeWeight: 2,
        },
        title: a.title,
      });

      marker.addListener("click", () => {
        setHighlightId(a.id);
        // Scroll al item correspondiente
        const el = document.getElementById(`map-item-${a.id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      markersRef.current.push(marker);
    });

    // Línea conectando actividades en orden de hora
    if (sorted.length > 1) {
      const path = sorted.map((a) => ({
        lat: a.location_lat!,
        lng: a.location_lng!,
      }));
      polylineRef.current = new google.maps.Polyline({
        path,
        map,
        geodesic: true,
        strokeColor: "#10b981",
        strokeOpacity: 0.5,
        strokeWeight: 2,
        icons: [
          {
            icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW },
            offset: "100%",
            repeat: "60px",
          },
        ],
      });
    }

    map.fitBounds(bounds, 50);
    const z = map.getZoom();
    if (z && z > 15) map.setZoom(15);
  }, [dayActivities]);

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
        <DayChips
          days={days}
          selectedDay={selectedDay}
          onSelect={setSelectedDay}
          getCount={(day) => activities.filter((a) => a.date === day && a.location_lat != null).length}
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
        {dayActivities.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-zinc-900/80">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No hay actividades con ubicación para este día.
            </p>
          </div>
        )}
      </div>

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
