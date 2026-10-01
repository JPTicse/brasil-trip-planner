"use client";

import {
  osmToActivityType,
  searchOsmPlaces,
  searchPlacePhoto,
  type OsmPlace,
} from "@/lib/osm";

export type Suggestion = {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photo_url: string | null;
  rating: number | null;
  price_level: number | null;
  suggested_type: string;
  suggested_time: string | null;
  suggested_cost: number | null;
  suggested_currency: string;
  opening_hours: string | null;
  website: string | null;
  phone: string | null;
  types: string[];
};

// Caché del viewbox del destino para no re-geocodificar en cada búsqueda
const regionViewboxCache = new Map<string, [number, number, number, number] | null>();

async function getRegionViewbox(
  regionBias: string,
): Promise<[number, number, number, number] | null> {
  const key = regionBias.toLowerCase().trim();
  if (regionViewboxCache.has(key)) return regionViewboxCache.get(key) ?? null;

  const results = await searchOsmPlaces(regionBias, { limit: 1 });
  const bb = results[0]?.boundingbox;
  const viewbox: [number, number, number, number] | null = bb
    ? [Number(bb[0]), Number(bb[1]), Number(bb[2]), Number(bb[3])]
    : null;
  regionViewboxCache.set(key, viewbox);
  return viewbox;
}

function toSuggestion(place: OsmPlace, photoUrl: string | null): Suggestion {
  return {
    place_id: `osm-${place.id}`,
    name: place.name,
    address: place.address || place.displayName,
    lat: place.lat,
    lng: place.lng,
    photo_url: photoUrl,
    rating: null,
    price_level: null,
    suggested_type: osmToActivityType(place),
    suggested_time: null,
    suggested_cost: null,
    suggested_currency: "BRL",
    opening_hours: null,
    website: null,
    phone: null,
    types: [place.category, place.type].filter(Boolean) as string[],
  };
}

export async function suggestPlace(
  query: string,
  regionBias = "Brasil",
): Promise<{ error?: string; suggestions?: Suggestion[] }> {
  if (!query || query.trim().length < 3) {
    return { error: "Query muy corta" };
  }

  try {
    const viewbox = await getRegionViewbox(regionBias);
    const results = await searchOsmPlaces(query, {
      limit: 5,
      viewbox: viewbox ?? undefined,
    });

    if (!results.length) {
      return { error: "No se encontró el lugar", suggestions: [] };
    }

    const topResults = results.slice(0, 3);
    // Fotos gratuitas en paralelo (Openverse/Wikimedia via nuestra API)
    const photos = await Promise.all(
      topResults.map((place) => searchPlacePhoto(place.name, regionBias)),
    );

    const suggestions = topResults.map((place, i) => toSuggestion(place, photos[i]));
    return { suggestions };
  } catch (e) {
    console.error("Error en suggestPlace:", e);
    return { error: "Error al buscar lugares", suggestions: [] };
  }
}
