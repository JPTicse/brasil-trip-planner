"use client";

import type { ActivityType, Inspiration } from "@/lib/types";

// Mapeo de tipos de Google Places → ActivityType de la app
export function mapGoogleTypeToActivityType(types: string[]): ActivityType {
  const t = new Set(types);
  if (t.has("restaurant") || t.has("food") || t.has("cafe") || t.has("bar") || t.has("bakery"))
    return "meal";
  if (t.has("transit_station") || t.has("airport") || t.has("bus_station") || t.has("train_station") || t.has("subway_station"))
    return "transport";
  if (t.has("tourist_attraction") || t.has("amusement_park") || t.has("aquarium") || t.has("zoo") || t.has("museum"))
    return "tour";
  if (t.has("night_club") || t.has("stadium") || t.has("movie_theater") || t.has("casino"))
    return "event";
  if (t.has("park") || t.has("beach") || t.has("natural_feature") || t.has("campground"))
    return "free";
  return "visit";
}

const COST_MAP = [0, 30, 80, 200, 500];
export function priceLevelToCost(priceLevel: number | null): number | null {
  if (priceLevel == null) return null;
  return COST_MAP[priceLevel] ?? null;
}

type RawPlace = {
  place_id: string;
  name: string;
  vicinity?: string;
  formatted_address?: string;
  geometry?: { location?: { lat: number; lng: number } };
  photos?: Array<{ photo_reference?: string; html_attributions?: string[] }>;
  rating?: number;
  price_level?: number;
  types?: string[];
};

function buildPhotoUrl(photoReference: string | undefined, apiKey: string): string | null {
  if (!photoReference) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&maxheight=600&photoreference=${photoReference}&key=${apiKey}`;
}

const INSPIRE_QUERIES = [
  "best things to do in",
  "top attractions in",
  "best restaurants in",
  "tours and activities in",
];

/**
 * Busca lugares populares en la ciudad del viaje usando Google Places Text Search.
 * Corre en el cliente porque la API key pública está restringida por referer.
 */
export async function fetchInspirationsClient(
  destination: string,
  apiKey: string,
  maxResults = 40,
): Promise<Inspiration[]> {
  if (!apiKey) throw new Error("No hay clave de Google Maps");

  const allPlaces: Map<string, RawPlace> = new Map();

  const queries = INSPIRE_QUERIES.map((q) => `${q} ${destination}`);
  const results = await Promise.allSettled(
    queries.slice(0, 4).map((query) => textSearch(query, apiKey)),
  );

  for (const result of results) {
    if (result.status === "fulfilled") {
      for (const place of result.value) {
        if (place.place_id && !allPlaces.has(place.place_id)) {
          allPlaces.set(place.place_id, place);
        }
      }
    }
  }

  const inspirations: Inspiration[] = [];
  for (const place of allPlaces.values()) {
    if (inspirations.length >= maxResults) break;

    const types = place.types ?? [];
    const suggestedType = mapGoogleTypeToActivityType(types);
    const photoRef = place.photos?.[0]?.photo_reference;
    const imageUrl = buildPhotoUrl(photoRef, apiKey);

    inspirations.push({
      id: place.place_id,
      place_id: place.place_id,
      trip_id: "",
      title: place.name,
      address: place.formatted_address ?? place.vicinity ?? null,
      image_url: imageUrl,
      rating: place.rating ?? null,
      price_level: place.price_level ?? null,
      types,
      suggested_type: suggestedType,
      location: place.formatted_address ?? place.vicinity ?? null,
      lat: place.geometry?.location?.lat ?? null,
      lng: place.geometry?.location?.lng ?? null,
      cost_estimate: priceLevelToCost(place.price_level ?? null),
      currency: "BRL",
      cached_at: null,
      expires_at: null,
    } as Inspiration);
  }

  return inspirations;
}

async function textSearch(query: string, apiKey: string): Promise<RawPlace[]> {
  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=es&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Error HTTP ${res.status}`);
  }
  const data = await res.json();
  if (data.status === "REQUEST_DENIED") {
    throw new Error(data.error_message ?? "La clave de Google Maps no tiene permisos para esta búsqueda");
  }
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    throw new Error(data.error_message ?? data.status);
  }
  return (data.results ?? []) as RawPlace[];
}
