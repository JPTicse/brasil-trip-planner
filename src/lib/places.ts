import type { ActivityType } from "@/lib/types";

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

// price_level 0..4 → costo estimado en BRL
const COST_MAP = [0, 30, 80, 200, 500];
export function priceLevelToCost(priceLevel: number | null): number | null {
  if (priceLevel == null) return null;
  return COST_MAP[priceLevel] ?? null;
}

// Coordenadas aproximadas por ciudad para sesgo de búsqueda (textSearch no las requiere, pero si hacemos nearbySearch las usamos)
const CITY_COORDS: Record<string, { lat: number; lng: number; radius: number }> = {
  "rio de janeiro": { lat: -22.9068, lng: -43.1729, radius: 15000 },
  rio: { lat: -22.9068, lng: -43.1729, radius: 15000 },
  "sao paulo": { lat: -23.5505, lng: -46.6333, radius: 15000 },
  "são paulo": { lat: -23.5505, lng: -46.6333, radius: 15000 },
  salvador: { lat: -12.9714, lng: -38.5014, radius: 15000 },
  florianopolis: { lat: -27.5949, lng: -48.5482, radius: 15000 },
  "florianópolis": { lat: -27.5949, lng: -48.5482, radius: 15000 },
  fortaleza: { lat: -3.7319, lng: -38.5267, radius: 15000 },
  recife: { lat: -8.0476, lng: -34.877, radius: 15000 },
  natal: { lat: -5.7945, lng: -35.211, radius: 15000 },
  manaus: { lat: -3.119, lng: -60.0217, radius: 15000 },
  curitiba: { lat: -25.4284, lng: -49.2733, radius: 15000 },
  brasilia: { lat: -15.7975, lng: -47.8919, radius: 15000 },
  "brasília": { lat: -15.7975, lng: -47.8919, radius: 15000 },
  "belo horizonte": { lat: -19.9167, lng: -43.9345, radius: 15000 },
  "porto alegre": { lat: -30.0346, lng: -51.2177, radius: 15000 },
  "foz do iguacu": { lat: -25.5163, lng: -54.5854, radius: 15000 },
  "foz do iguaçu": { lat: -25.5163, lng: -54.5854, radius: 15000 },
  buenos: { lat: -34.6037, lng: -58.3816, radius: 15000 },
  "buenos aires": { lat: -34.6037, lng: -58.3816, radius: 15000 },
  santiago: { lat: -33.4489, lng: -70.6693, radius: 15000 },
  "valparaiso": { lat: -33.0472, lng: -71.6127, radius: 15000 },
  bogota: { lat: 4.711, lng: -74.0721, radius: 15000 },
  "bogotá": { lat: 4.711, lng: -74.0721, radius: 15000 },
  medellin: { lat: 6.2476, lng: -75.5658, radius: 15000 },
  "medellín": { lat: 6.2476, lng: -75.5658, radius: 15000 },
  cartagena: { lat: 10.391, lng: -75.4794, radius: 15000 },
  lima: { lat: -12.0464, lng: -77.0428, radius: 15000 },
  cusco: { lat: -13.1631, lng: -72.545, radius: 15000 },
  "machu picchu": { lat: -13.1631, lng: -72.545, radius: 20000 },
};

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

type InspirationRow = {
  place_id: string;
  title: string;
  address: string | null;
  image_url: string | null;
  rating: number | null;
  price_level: number | null;
  types: string[];
  suggested_type: ActivityType;
  lat: number | null;
  lng: number | null;
  cost_estimate: number | null;
  currency: string;
};

const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

function getCityCoords(destination: string): { lat: number; lng: number; radius: number } {
  const normalized = destination.toLowerCase().replace(/[^a-z0-9\s]/g, "").trim();
  const cityPart = normalized.split(",")[0] ?? normalized;
  return CITY_COORDS[cityPart] ?? CITY_COORDS[normalized] ?? { lat: -14.235, lng: -51.9253, radius: 50000 };
}

function buildPhotoUrl(photoReference: string | undefined): string | null {
  if (!photoReference || !API_KEY) return null;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=800&maxheight=600&photoreference=${photoReference}&key=${API_KEY}`;
}

/**
 * Busca lugares populares en la ciudad del viaje usando Google Places Text Search.
 * Text Search acepta nombres de ciudad/país y devuelve resultados georreferenciados.
 */
export async function fetchInspirations(
  destination: string,
  maxResults = 40,
): Promise<InspirationRow[]> {
  if (!API_KEY) {
    console.warn("GOOGLE_MAPS_API_KEY no configurada para fetchInspirations");
    return [];
  }

  const queries = [
    `best things to do in ${destination}`,
    `top attractions in ${destination}`,
    `best restaurants in ${destination}`,
    `tours and activities in ${destination}`,
    `parks and nature in ${destination}`,
    `nightlife in ${destination}`,
    `museums and culture in ${destination}`,
  ];

  const allPlaces: Map<string, RawPlace> = new Map();

  const results = await Promise.allSettled(
    queries.slice(0, 4).map((query) => textSearch(query)),
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

  const inspirations: InspirationRow[] = [];
  for (const place of allPlaces.values()) {
    if (inspirations.length >= maxResults) break;

    const types = place.types ?? [];
    const suggestedType = mapGoogleTypeToActivityType(types);
    const photoRef = place.photos?.[0]?.photo_reference;
    const imageUrl = buildPhotoUrl(photoRef);

    inspirations.push({
      place_id: place.place_id,
      title: place.name,
      address: place.formatted_address ?? place.vicinity ?? null,
      image_url: imageUrl,
      rating: place.rating ?? null,
      price_level: place.price_level ?? null,
      types,
      suggested_type: suggestedType,
      lat: place.geometry?.location?.lat ?? null,
      lng: place.geometry?.location?.lng ?? null,
      cost_estimate: priceLevelToCost(place.price_level ?? null),
      currency: "BRL",
    });
  }

  return inspirations;
}

async function textSearch(query: string): Promise<RawPlace[]> {
  if (!API_KEY) return [];

  const url = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query)}&language=es&key=${API_KEY}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("HTTP error en textSearch:", res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places textSearch status:", data.status, data.error_message);
      return [];
    }
    return (data.results ?? []) as RawPlace[];
  } catch (e) {
    console.error("Error en textSearch:", e);
    return [];
  }
}

/**
 * Fallback por nearbySearch si se necesita búsqueda por radio.
 */
export async function fetchInspirationsNearby(
  destination: string,
  maxResults = 40,
): Promise<InspirationRow[]> {
  if (!API_KEY) {
    console.warn("GOOGLE_MAPS_API_KEY no configurada para fetchInspirationsNearby");
    return [];
  }

  const coords = getCityCoords(destination);
  const allPlaces: Map<string, RawPlace> = new Map();

  const queries = [
    "tourist attractions",
    "restaurants",
    "parks and nature",
    "tours and experiences",
  ];

  const results = await Promise.allSettled(
    queries.map((query) => nearbySearch(query, coords.lat, coords.lng, coords.radius)),
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

  const inspirations: InspirationRow[] = [];
  for (const place of allPlaces.values()) {
    if (inspirations.length >= maxResults) break;

    const types = place.types ?? [];
    const suggestedType = mapGoogleTypeToActivityType(types);
    const photoRef = place.photos?.[0]?.photo_reference;
    const imageUrl = buildPhotoUrl(photoRef);

    inspirations.push({
      place_id: place.place_id,
      title: place.name,
      address: place.vicinity ?? place.formatted_address ?? null,
      image_url: imageUrl,
      rating: place.rating ?? null,
      price_level: place.price_level ?? null,
      types,
      suggested_type: suggestedType,
      lat: place.geometry?.location?.lat ?? null,
      lng: place.geometry?.location?.lng ?? null,
      cost_estimate: priceLevelToCost(place.price_level ?? null),
      currency: "BRL",
    });
  }

  return inspirations;
}

async function nearbySearch(
  keyword: string,
  lat: number,
  lng: number,
  radius: number,
): Promise<RawPlace[]> {
  if (!API_KEY) return [];

  const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(keyword)}&language=es&key=${API_KEY}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) {
      console.error("HTTP error en nearbySearch:", res.status, res.statusText);
      return [];
    }
    const data = await res.json();
    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Google Places nearbySearch status:", data.status, data.error_message);
      return [];
    }
    return (data.results ?? []) as RawPlace[];
  } catch (e) {
    console.error("Error en nearbySearch:", e);
    return [];
  }
}
