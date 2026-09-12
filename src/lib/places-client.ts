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

// Queries que encuentran spots trending/instagramables/iconic en vez de tours genéricos
const INSPIRE_QUERIES = [
  "most photographed places in",
  "iconic landmarks in",
  "famous viewpoints in",
  "best photo spots in",
  "instagrammable places in",
  "must-see places in",
  "famous monuments in",
  "hidden gems in",
];

type GPlaceResult = google.maps.places.PlaceResult;

function placeToInspiration(place: GPlaceResult): Inspiration | null {
  if (!place.place_id || !place.name) return null;

  const types = place.types ?? [];
  const suggestedType = mapGoogleTypeToActivityType(types);

  // Múltiples fotos (hasta 10)
  const imageUrls: string[] = [];
  if (place.photos) {
    for (const photo of place.photos.slice(0, 10)) {
      try {
        const url = photo.getUrl({ maxWidth: 800, maxHeight: 600 });
        if (url) imageUrls.push(url);
      } catch {
        // skip
      }
    }
  }

  const lat = place.geometry?.location?.lat();
  const lng = place.geometry?.location?.lng();

  // editorial_summary no está tipado en @types/google.maps pero sí existe en runtime
  const editorialSummary = (place as any).editorial_summary as
    | { overview?: string }
    | undefined;

  return {
    id: place.place_id,
    place_id: place.place_id,
    trip_id: "",
    title: place.name,
    address: place.formatted_address ?? place.vicinity ?? null,
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
    description: editorialSummary?.overview ?? null,
    opening_hours: place.opening_hours?.weekday_text ?? null,
    website: place.website ?? null,
    user_ratings_total: place.user_ratings_total ?? null,
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
 * Busca lugares trending/instagramables en la ciudad del viaje.
 * Usa Google Places JavaScript SDK (no REST) porque la API key está
 * restringida por referer y el endpoint REST no soporta CORS.
 *
 * 1. textSearch con queries que encuentran spots icónicos (no tours)
 * 2. getDetails para cada place_id → hasta 10 fotos + descripción + horarios
 */
export async function fetchInspirationsClient(
  destination: string,
  _apiKey: string, // no se usa: la key ya está cargada por loadGoogleMaps()
  maxResults = 30,
): Promise<Inspiration[]> {
  await loadGoogleMaps();

  const google = (window as any).google;
  if (!google?.maps?.places) {
    throw new Error("Google Places no está disponible");
  }

  // PlacesService requiere un Map o un Element para atribución.
  const attribDiv = document.createElement("div");
  attribDiv.style.display = "none";
  document.body.appendChild(attribDiv);
  const service = new google.maps.places.PlacesService(attribDiv);

  // Fase 1: textSearch con múltiples queries para encontrar places
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

  // Fase 2: getDetails para los top places → múltiples fotos + descripción
  // Limitamos a maxResults * 2 para tener margen tras filtrar los sin fotos
  const placeIds = Array.from(allPlaces.keys()).slice(0, maxResults * 2);
  const detailedPlaces: GPlaceResult[] = [];

  await Promise.allSettled(
    placeIds.map(
      (placeId) =>
        new Promise<void>((resolve) => {
          service.getDetails(
            {
              placeId,
              fields: [
                "name",
                "place_id",
                "formatted_address",
                "vicinity",
                "geometry",
                "types",
                "rating",
                "user_ratings_total",
                "price_level",
                "photos",
                "editorial_summary",
                "opening_hours",
                "website",
                "business_status",
              ],
              language: "es",
            },
            (place: GPlaceResult | null, detailStatus: string) => {
              if (
                detailStatus === google.maps.places.PlacesServiceStatus.OK &&
                place &&
                place.photos &&
                place.photos.length > 0
              ) {
                detailedPlaces.push(place);
              }
              resolve();
            },
          );
        }),
    ),
  );

  // Limpiar div temporal
  attribDiv.remove();

  // Mapear a Inspiration, ordenar por rating descendente
  const inspirations: Inspiration[] = [];
  for (const place of detailedPlaces) {
    const insp = placeToInspiration(place);
    if (insp && insp.image_urls.length > 0) {
      inspirations.push(insp);
    }
    if (inspirations.length >= maxResults) break;
  }

  // Ordenar por rating (nulls last)
  inspirations.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return inspirations;
}
