"use client";

import { loadGoogleMaps } from "@/lib/google-maps";

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

// Coordenadas aproximadas por país para sesgo de búsqueda
const COUNTRY_BIAS: Record<string, { lat: number; lng: number; radius: number }> = {
  brasil: { lat: -14.235, lng: -51.9253, radius: 3_000_000 },
  brazil: { lat: -14.235, lng: -51.9253, radius: 3_000_000 },
  rio: { lat: -22.9068, lng: -43.1729, radius: 100_000 },
  "rio de janeiro": { lat: -22.9068, lng: -43.1729, radius: 100_000 },
  sao: { lat: -23.5505, lng: -46.6333, radius: 100_000 },
  saopaulo: { lat: -23.5505, lng: -46.6333, radius: 100_000 },
  "são paulo": { lat: -23.5505, lng: -46.6333, radius: 100_000 },
};

// Función cliente que usa Google Maps JS API (ya cargada en el navegador)
export async function suggestPlace(query: string, regionBias = "Brasil"): Promise<{ error?: string; suggestions?: Suggestion[] }> {
  if (!query || query.trim().length < 3) {
    return { error: "Query muy corta" };
  }

  try {
    await loadGoogleMaps();
    const google = window.google;
    if (!google?.maps?.places) {
      return { error: "Google Places no disponible" };
    }

    // Crear un div oculto para PlacesService (requiere un elemento)
    const container = document.createElement("div");
    container.style.display = "none";
    document.body.appendChild(container);
    const service = new google.maps.places.PlacesService(container);

    // Buscar coordenadas del destino
    const normalized = regionBias.toLowerCase().replace(/[^a-z0-9\s]/g, "");
    let bias = COUNTRY_BIAS[normalized];
    if (!bias) {
      // Tratar de geocodificar el destino
      const geocode = await new Promise<{ lat: number; lng: number; radius: number } | null>((resolve) => {
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ address: regionBias, language: "es" }, (results, status) => {
          if (status === google.maps.GeocoderStatus.OK && results?.[0]?.geometry?.location) {
            const loc = results[0].geometry.location;
            resolve({ lat: loc.lat(), lng: loc.lng(), radius: 500_000 });
          } else {
            resolve(null);
          }
        });
      });
      bias = geocode ?? COUNTRY_BIAS.brasil;
    }

    // Buscar lugares con nearbySearch sesgado a la ubicación del destino
    const nearbyResults = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
      service.nearbySearch(
        {
          location: new google.maps.LatLng(bias.lat, bias.lng),
          radius: bias.radius,
          keyword: query,
          language: "es",
        },
        (results, status) => {
          resolve(status === google.maps.places.PlacesServiceStatus.OK && results ? results : []);
        },
      );
    });

    // Si nearbySearch no da resultados, fallback a textSearch con "en {region}"
    let results = nearbyResults;
    if (!results.length) {
      results = await new Promise<google.maps.places.PlaceResult[]>((resolve) => {
        service.textSearch(
          {
            query: `${query} en ${regionBias}`,
            language: "es",
          },
          (res, status) => {
            resolve(status === google.maps.places.PlacesServiceStatus.OK && res ? res : []);
          },
        );
      });
    }

    if (!results.length) {
      document.body.removeChild(container);
      return { error: "No se encontró el lugar", suggestions: [] };
    }

    // Tomar los primeros 3 directamente del resultado de búsqueda.
    // No llamamos a getDetails: los resultados ya traen foto, rating,
    // types, precio y dirección — evita 3 llamadas billables por búsqueda.
    const topResults = results.slice(0, 3);
    const costMap = [0, 30, 80, 200, 500];
    const suggestions: Suggestion[] = topResults.map((place) => {
      let photoUrl: string | null = null;
      try {
        photoUrl = place.photos?.[0]?.getUrl?.({ maxWidth: 800, maxHeight: 600 }) ?? null;
      } catch {
        photoUrl = null;
      }

      const types: string[] = place.types ?? [];
      let suggestedType = "visit";
      if (types.includes("restaurant") || types.includes("food") || types.includes("cafe")) {
        suggestedType = "meal";
      } else if (types.includes("transit_station") || types.includes("airport") || types.includes("bus_station")) {
        suggestedType = "transport";
      } else if (types.includes("tourist_attraction") || types.includes("amusement_park")) {
        suggestedType = "tour";
      } else if (types.includes("night_club") || types.includes("stadium")) {
        suggestedType = "event";
      }

      return {
        place_id: place.place_id ?? `place-${place.name ?? ""}`,
        name: place.name ?? "",
        address: place.formatted_address ?? place.vicinity ?? place.name ?? "",
        lat: place.geometry?.location?.lat() ?? 0,
        lng: place.geometry?.location?.lng() ?? 0,
        photo_url: photoUrl,
        rating: place.rating ?? null,
        price_level: place.price_level ?? null,
        suggested_type: suggestedType,
        suggested_time: null,
        suggested_cost: place.price_level != null ? (costMap[place.price_level] ?? null) : null,
        suggested_currency: "BRL",
        opening_hours: null,
        website: null,
        phone: null,
        types,
      };
    });

    document.body.removeChild(container);
    return { suggestions };
  } catch (e) {
    console.error("Error en suggestPlace:", e);
    return { error: "Error al buscar lugares", suggestions: [] };
  }
}
