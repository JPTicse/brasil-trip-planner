"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export type MapMarker = {
  id?: string;
  lat: number;
  lng: number;
  title?: string;
  label?: string;
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
  const markerInstances = useRef(new Map<string, any>());
  const fittedBounds = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !mapRef.current || mapInstance.current) return;
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
        setMapReady(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar el mapa");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!mapReady || !mapInstance.current) return;
    const google = (window as any).google;
    const nextMarkers = markers ?? [];
    const activeKeys = new Set<string>();

    nextMarkers.forEach((item, index) => {
      const key = item.id ?? `${item.lat},${item.lng},${index}`;
      activeKeys.add(key);
      const existing = markerInstances.current.get(key);

      if (existing) {
        existing.setPosition({ lat: item.lat, lng: item.lng });
        existing.setTitle(item.title ?? "");
        return;
      }

      const marker = new google.maps.Marker({
        position: { lat: item.lat, lng: item.lng },
        map: mapInstance.current,
        title: item.title,
        label: item.label
          ? { text: item.label, color: "#ffffff", fontSize: "11px", fontWeight: "700" }
          : undefined,
        animation: google.maps.Animation.DROP,
      });

      if (item.title) {
        const content = document.createElement("div");
        content.textContent = item.title;
        content.style.fontWeight = "600";
        const info = new google.maps.InfoWindow({ content });
        marker.addListener("click", () => info.open(mapInstance.current, marker));
      }
      markerInstances.current.set(key, marker);
    });

    markerInstances.current.forEach((marker, key) => {
      if (!activeKeys.has(key)) {
        marker.setMap(null);
        markerInstances.current.delete(key);
      }
    });

    if (!fittedBounds.current && nextMarkers.length > 1) {
      const bounds = new google.maps.LatLngBounds();
      nextMarkers.forEach((item) => bounds.extend({ lat: item.lat, lng: item.lng }));
      mapInstance.current.fitBounds(bounds, 50);
      fittedBounds.current = true;
    }
  }, [mapReady, markers]);

  useEffect(() => {
    if (!mapReady || !center || !mapInstance.current) return;
    mapInstance.current.setCenter(center);
    mapInstance.current.setZoom(zoom);
  }, [center, mapReady, zoom]);

  if (error) {
    return (
      <div
        className="flex items-center justify-center rounded-xl bg-zinc-100 text-xs text-zinc-400 dark:bg-zinc-800"
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
