"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import { createOsmMap, fitMapToPoints } from "@/lib/maplibre";

export type MapMarker = {
  id?: string;
  lat: number;
  lng: number;
  title?: string;
  label?: string;
  color?: string;
  icon?: string;
};

export function OsmMap({
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
  const mapInstance = useRef<maplibregl.Map | null>(null);
  const markerInstances = useRef(new Map<string, maplibregl.Marker>());
  const fittedBounds = useRef(false);
  const [mapReady, setMapReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.resolve()
      .then(() => {
        if (cancelled || !mapRef.current || mapInstance.current) return;
        const defaultCenter = center ?? markers?.[0] ?? { lat: -22.9068, lng: -43.1729 };
        const map = createOsmMap(mapRef.current, {
          center: [defaultCenter.lng, defaultCenter.lat],
          zoom,
        });
        mapInstance.current = map;
        let styleLoaded = false;
        map.on("load", () => {
          styleLoaded = true;
          if (!cancelled) setMapReady(true);
        });
        map.on("error", () => {
          if (!cancelled && !styleLoaded) setError("Error al cargar el mapa");
        });
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error al cargar el mapa");
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !map) return;
    const nextMarkers = markers ?? [];
    const activeKeys = new Set<string>();

    nextMarkers.forEach((item, index) => {
      const key = item.id ?? `${item.lat},${item.lng},${index}`;
      activeKeys.add(key);
      const existing = markerInstances.current.get(key);

      if (existing) {
        existing.setLngLat([item.lng, item.lat]);
        return;
      }

      let el: HTMLElement | undefined;
      if (item.label) {
        el = document.createElement("div");
        el.style.cssText = `
          width: 28px; height: 28px; border-radius: 9999px;
          background: ${item.color ?? "#059669"}; color: #fff;
          display: flex; align-items: center; justify-content: center;
          font-size: 10px; font-weight: 700;
          border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35);
        `;
        el.textContent = item.label;
      }

      const marker = new maplibregl.Marker(el ? { element: el } : { color: item.color ?? "#059669" })
        .setLngLat([item.lng, item.lat])
        .addTo(map);

      if (item.title) {
        const popup = new maplibregl.Popup({ closeButton: false, offset: 18 }).setText(item.title);
        marker.setPopup(popup);
      }
      markerInstances.current.set(key, marker);
    });

    markerInstances.current.forEach((marker, key) => {
      if (!activeKeys.has(key)) {
        marker.remove();
        markerInstances.current.delete(key);
      }
    });

    if (!fittedBounds.current && nextMarkers.length > 1) {
      fitMapToPoints(map, nextMarkers.map((m) => [m.lng, m.lat]));
      fittedBounds.current = true;
    }
  }, [mapReady, markers]);

  useEffect(() => {
    const map = mapInstance.current;
    if (!mapReady || !center || !map) return;
    map.jumpTo({ center: [center.lng, center.lat], zoom });
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
