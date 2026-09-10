"use client";

import { useEffect, useRef } from "react";
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

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current) return;

        const google = (window as any).google;
        const defaultCenter = center ?? markers?.[0] ?? { lat: -22.9068, lng: -43.1729 }; // Rio default

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

        // Añadir marcadores
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

        // Auto-ajustar si hay múltiples marcadores
        if (markers && markers.length > 1) {
          const bounds = new google.maps.LatLngBounds();
          markers.forEach((m) => bounds.extend({ lat: m.lat, lng: m.lng }));
          mapInstance.current.fitBounds(bounds, 50);
        }
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [center, markers, zoom]);

  return (
    <div
      ref={mapRef}
      className={className ?? "w-full rounded-xl"}
      style={{ height, minHeight: height }}
    />
  );
}
