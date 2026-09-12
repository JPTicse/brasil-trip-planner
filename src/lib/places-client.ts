"use client";

import { loadGoogleMaps } from "@/lib/google-maps";
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

const INSPIRE_QUERIES = [
  "best things to do in",
  "top attractions in",
  "best restaurants in",
  "tours and activities in",
];

type GPlaceResult = google.maps.places.PlaceResult;

function placeToInspiration(place: GPlaceResult): Inspiration | null {
  if (!place.place_id || !place.name) return null;

  const types = place.types ?? [];
  const suggestedType = mapGoogleTypeToActivityType(types);

  let imageUrl: string | null = null;
  try {
    imageUrl = place.photos?.[0]?.getUrl({ maxWidth: 800, maxHeight: 600 }) ?? null;
  } catch {
    imageUrl = null;
  }

  const lat = place.geometry?.location?.lat();
  const lng = place.geometry?.location?.lng();

  return {
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
    lat: typeof lat === "number" ? lat : null,
    lng: typeof lng === "number" ? lng : null,
    cost_estimate: priceLevelToCost(place.price_level ?? null),
    currency: "BRL",
    cached_at: null,
    expires_at: null,
  } as Inspiration;
}

/**
 * Busca lugares populares en la ciudad del viaje usando Google Places
 * a través del SDK de JavaScript (no REST), porque la API key pública está
 * restringida por referer y el endpoint REST no soporta CORS desde el navegador.
 */
export async function fetchInspirationsClient(
  destination: string,
  _apiKey: string, // no se usa: la key ya está cargada por loadGoogleMaps()
  maxResults = 40,
): Promise<Inspiration[]> {
  await loadGoogleMaps();

  const google = (window as any).google;
  if (!google?.maps?.places) {
    throw new Error("Google Places no está disponible");
  }

  // PlacesService requiere un Map o un Element para atribución.
  // Usamos un div oculto temporal.
  const attribDiv = document.createElement("div");
  attribDiv.style.display = "none";
  document.body.appendChild(attribDiv);
  const service = new google.maps.places.PlacesService(attribDiv);

  const queries = INSPIRE_QUERIES.map((q) => `${q} ${destination}`);

  const allPlaces = new Map<string, GPlaceResult>();

  await Promise.allSettled(
    queries.map(
      (query) =>
        new Promise<void>((resolve) => {
          service.textSearch(
            { query, language: "es" },
            (results: GPlaceResult[] | null, status: string) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && results) {
                for (const r of results) {
                  if (r.place_id && !allPlaces.has(r.place_id)) {
                    allPlaces.set(r.place_id, r);
                  }
                }
              }
              resolve();
            },
          );
        }),
    ),
  );

  // Limpiar el div temporal
  attribDiv.remove();

  const inspirations: Inspiration[] = [];
  for (const place of allPlaces.values()) {
    if (inspirations.length >= maxResults) break;
    const insp = placeToInspiration(place);
    if (insp) inspirations.push(insp);
  }

  return inspirations;
}
