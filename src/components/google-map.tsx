"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export type MapMarker = {
  lat: number;
  lng: number;
  title?: string;
  color?: string;
  icon?: string;
};

export function GoogleMap({
  center,
  markers,
  zoom = 14,
  className,
  height = "200px",
}: {
  center?: { lat: number; lng: number };
  markers?: MapMarker[];
  zoom?: number;
  className?: string;
  height?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;
        const google = (window as any).google;
        if (!google?.maps) {
          setError("Google Maps no disponible");
          return;
        }

        const defaultCenter = center ?? markers?.[0] ?? { lat: -22.9068, lng: -43.1729 };

        mapInstance.current = new google.maps.Map(mapRef.current, {
          center: defaultCenter,
          zoom,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          styles: [
            { featureType: "poi", elementType: "labels", stylers: [{ visibility: "off" }] },
          ],
        });

        if (markers) {
          markers.forEach((m) => {
            const marker = new google.maps.Marker({
              position: { lat: m.lat, lng: m.lng },
              map: mapInstance.current,
              title: m.title,
              animation: google.maps.Animation.DROP,
            });

            if (m.title) {
              const info = new google.maps.InfoWindow({ content: m.title });
              marker.addListener("click", () => info.open(mapInstance.current, marker));
            }
          });
        }

        if (markers && markers.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
          mapInstance.current.fitBounds(bounds, 50);
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar el mapa");
      });

    return () => {
      cancelled = true;
    };
  }, [center, markers, zoom]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-400"
        style={{ height }}
      >
        <span className="px-3 text-center">No se pudo cargar el mapa: {error}</span>
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className={className ?? "w-full rounded-xl"}
      style={{ height, minHeight: height }}
    />
  );
}
