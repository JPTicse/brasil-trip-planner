"use client";

import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";

// Tiles raster gratuitos de CARTO (basados en OpenStreetMap).
// Sin API key ni billing. Requieren atribución (la añade MapLibre sola).
const TILES_LIGHT = "https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png";
const TILES_DARK = "https://basemaps.cartocdn.com/dark_all/{z}/{x}/{y}.png";
const ATTRIBUTION =
  '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>';

export function osmMapStyle(): maplibregl.StyleSpecification {
  const dark =
    typeof document !== "undefined" &&
    document.documentElement.classList.contains("dark");
  return {
    version: 8,
    sources: {
      carto: {
        type: "raster",
        tiles: [dark ? TILES_DARK : TILES_LIGHT],
        tileSize: 256,
        attribution: ATTRIBUTION,
      },
    },
    layers: [{ id: "carto", type: "raster", source: "carto" }],
  };
}

export function createOsmMap(
  container: HTMLElement,
  options: { center?: [number, number]; zoom?: number } = {},
): maplibregl.Map {
  return new maplibregl.Map({
    container,
    style: osmMapStyle(),
    center: options.center ?? [-46.6361, -23.5475],
    zoom: options.zoom ?? 12,
    attributionControl: { compact: true },
  });
}

/** Punto circular con etiqueta numérica/letra (actividades, S, F) */
export function dotMarkerElement(color: string, label: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 28px; height: 28px; border-radius: 9999px;
    background: ${color}; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 700;
    border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35);
    cursor: pointer;
  `;
  el.textContent = label;
  return el;
}

/** Icono de casa para el alojamiento del día */
export function homeMarkerElement(color: string): HTMLElement {
  const el = document.createElement("div");
  el.style.cssText = `
    width: 30px; height: 30px; border-radius: 8px;
    background: ${color}; color: #fff;
    display: flex; align-items: center; justify-content: center;
    border: 2px solid #fff; box-shadow: 0 1px 4px rgba(0,0,0,.35);
    cursor: pointer;
  `;
  el.innerHTML =
    '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11l9-8 9 8M5 10v11h14V10M9 21v-6h6v6"/></svg>';
  return el;
}

const ROUTE_SOURCE = "day-route";

/** Dibuja/actualiza la línea de la ruta del día. coords = [[lng,lat], ...] */
export function setRouteLine(map: maplibregl.Map, coords: [number, number][]) {
  const existing = map.getSource(ROUTE_SOURCE) as maplibregl.GeoJSONSource | undefined;

  if (coords.length < 2) {
    if (map.getLayer(`${ROUTE_SOURCE}-line`)) map.removeLayer(`${ROUTE_SOURCE}-line`);
    if (map.getLayer(`${ROUTE_SOURCE}-casing`)) map.removeLayer(`${ROUTE_SOURCE}-casing`);
    if (existing) map.removeSource(ROUTE_SOURCE);
    return;
  }

  const data: GeoJSON.Feature<GeoJSON.LineString> = {
    type: "Feature",
    properties: {},
    geometry: { type: "LineString", coordinates: coords },
  };

  if (existing) {
    existing.setData(data);
    return;
  }

  map.addSource(ROUTE_SOURCE, { type: "geojson", data });
  map.addLayer({
    id: `${ROUTE_SOURCE}-casing`,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#ffffff", "line-width": 4.5, "line-opacity": 0.8 },
  });
  map.addLayer({
    id: `${ROUTE_SOURCE}-line`,
    type: "line",
    source: ROUTE_SOURCE,
    layout: { "line-cap": "round", "line-join": "round" },
    paint: {
      "line-color": "#10b981",
      "line-width": 2.5,
      "line-opacity": 0.85,
      "line-dasharray": [2, 1.4],
    },
  });
}

export function fitMapToPoints(
  map: maplibregl.Map,
  points: [number, number][],
  maxZoom = 15,
) {
  if (points.length === 0) return;
  if (points.length === 1) {
    map.jumpTo({ center: points[0], zoom: maxZoom });
    return;
  }
  const bounds = new maplibregl.LngLatBounds();
  for (const p of points) bounds.extend(p);
  map.fitBounds(bounds, { padding: 50, maxZoom, duration: 0 });
}
