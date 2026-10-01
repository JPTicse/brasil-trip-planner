"use client";

// Cliente gratuito de OpenStreetMap (Nominatim) para búsqueda de lugares,
// direcciones y ciudades. Sin API key ni billing.
// Uso moderado: debounce en los componentes, máx ~1 req/seg.

export type OsmPlace = {
  id: number;
  name: string;
  displayName: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  type?: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
};

export type OsmSearchOptions = {
  limit?: number;
  /** Filtro por país, ej. "br" */
  countryCode?: string;
  /** Sesgo: [minLat, maxLat, minLon, maxLon] */
  viewbox?: [number, number, number, number];
  /** Si true, solo resultados dentro del viewbox */
  bounded?: boolean;
  /** "city" | "country" | "state" | "settlement" */
  featureType?: string;
};

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";

type NominatimItem = {
  place_id: number;
  name?: string;
  display_name: string;
  lat: string;
  lon: string;
  category?: string;
  type?: string;
  addresstype?: string;
  importance?: number;
  boundingbox?: [string, string, string, string];
  address?: {
    road?: string;
    house_number?: string;
    suburb?: string;
    neighbourhood?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
    state?: string;
    country?: string;
  };
};

function shortAddress(item: NominatimItem): string {
  const a = item.address;
  if (!a) return item.display_name;
  const street = a.road ? `${a.road}${a.house_number ? ` ${a.house_number}` : ""}` : null;
  const locality = a.city ?? a.town ?? a.village ?? a.municipality ?? a.suburb ?? a.neighbourhood;
  return [street, locality, a.state].filter(Boolean).join(", ") || item.display_name;
}

function toPlace(item: NominatimItem): OsmPlace {
  const name = item.name || item.display_name.split(",")[0]?.trim() || item.display_name;
  return {
    id: item.place_id,
    name,
    displayName: item.display_name,
    address: shortAddress(item),
    lat: Number(item.lat),
    lng: Number(item.lon),
    category: item.category,
    type: item.type ?? item.addresstype,
    importance: item.importance,
    boundingbox: item.boundingbox,
  };
}

export async function searchOsmPlaces(
  query: string,
  options: OsmSearchOptions = {},
): Promise<OsmPlace[]> {
  const q = query.trim();
  if (q.length < 3) return [];

  try {
    const params = new URLSearchParams({
      q,
      format: "jsonv2",
      addressdetails: "1",
      limit: String(options.limit ?? 6),
      "accept-language": "es",
    });
    if (options.countryCode) params.set("countrycodes", options.countryCode.toLowerCase());
    if (options.featureType) params.set("featuretype", options.featureType);
    if (options.viewbox) {
      const [minLat, maxLat, minLon, maxLon] = options.viewbox;
      params.set("viewbox", `${minLon},${maxLat},${maxLon},${minLat}`);
      params.set("bounded", options.bounded ? "1" : "0");
    }

    const res = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return [];
    const items = (await res.json()) as NominatimItem[];
    return items.map(toPlace);
  } catch {
    return [];
  }
}

/** Mapea category/type de Nominatim al tipo de actividad de la app */
export function osmToActivityType(place: OsmPlace): string {
  const cat = place.category;
  const type = place.type ?? "";

  if (cat === "amenity") {
    if (["restaurant", "cafe", "bar", "fast_food", "food_court", "pub", "ice_cream", "biergarten"].includes(type)) {
      return "meal";
    }
    if (["bus_station", "taxi"].includes(type)) return "transport";
  }
  if (cat === "railway" || cat === "public_transport" || cat === "aeroway" || type === "airport") {
    return "transport";
  }
  if (cat === "tourism") {
    if (["attraction", "theme_park", "zoo", "aquarium"].includes(type)) return "tour";
    return "visit";
  }
  if (cat === "leisure" || cat === "natural" || type === "beach") return "free";
  if (cat === "sport" || type === "stadium") return "event";
  if (cat === "historic" || cat === "shop") return "visit";
  return "visit";
}

/** Busca una foto real gratuita del lugar via nuestra API interna (Openverse/Wikimedia/Pexels) */
export async function searchPlacePhoto(
  name: string,
  context?: string,
): Promise<string | null> {
  try {
    const q = [name, context].filter(Boolean).join(" ");
    const params = new URLSearchParams({ q, type: "place", count: "1" });
    const res = await fetch(`/api/pose-search?${params.toString()}`, {
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.results?.[0]?.url ?? null;
  } catch {
    return null;
  }
}
