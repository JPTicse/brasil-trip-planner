"use client";

import { useEffect, useRef, useState } from "react";
import { ActivityDetailModalV2 as ActivityDetailModal } from "@/components/v2/activity-detail-modal-v2";
import { loadGoogleMaps } from "@/lib/google-maps";
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
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const polylineRef = useRef<google.maps.Polyline | null>(null);
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

  useEffect(() => {
    const map = mapInstance.current;
    if (!map) return;

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
        const el = document.getElementById(`map-item-v2-${a.id}`);
        el?.scrollIntoView({ behavior: "smooth", block: "center" });
      });

      markersRef.current.push(marker);
    });

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
        strokeOpacity: 0.4,
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
      <div className="py-12 text-center">
        <p className="text-sm text-stone-400 dark:text-stone-500">
          No se pudo cargar el mapa.
        </p>
        <p className="mt-1 text-xs text-stone-400 dark:text-stone-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {days.length > 0 && (
        <DayChipsV2 days={days} selectedDay={selectedDay} onSelect={onSelectDay} />
      )}

      <div className="relative h-[40dvh] overflow-hidden rounded-xl border border-stone-200 dark:border-stone-800">
        <div ref={mapRef} className="h-full w-full" />
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-stone-50 dark:bg-stone-950">
            <svg className="h-6 w-6 animate-spin text-stone-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}
        {dayActivities.length === 0 && !loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-stone-400 dark:text-stone-500">
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
                  className={`flex w-full items-center gap-2.5 rounded-lg border bg-white px-3 py-2 text-left transition active:scale-[0.99] hover:bg-stone-50 dark:bg-stone-900 dark:hover:bg-stone-800/50 ${
                    isHighlighted
                      ? "border-stone-400 dark:border-stone-500"
                      : "border-stone-200 dark:border-stone-800"
                  }`}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-xs font-semibold text-stone-400 dark:text-stone-500">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-1 text-sm font-medium text-stone-900 dark:text-stone-50">
                      {a.title}
                    </p>
                    <p className="line-clamp-1 text-xs text-stone-500 dark:text-stone-400">
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
