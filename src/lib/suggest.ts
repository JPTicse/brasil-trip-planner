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

// Función cliente que usa Google Maps JS API (ya cargada en el navegador)
// Usa PlacesService + findPlaceFromQuery (no requiere API key server-side)
export async function suggestPlace(query: string, regionBias = "Brasil"): Promise<{ error?: string; suggestions?: Suggestion[] }> {
  if (!query || query.trim().length < 3) {
    return { error: "Query muy corta" };
  }

  try {
    await loadGoogleMaps();
    const google = (window as any).google;
    if (!google?.maps?.places) {
      return { error: "Google Places no disponible" };
    }

    // Crear un div oculto para PlacesService (requiere un elemento)
    const container = document.createElement("div");
    container.style.display = "none";
    document.body.appendChild(container);
    const service = new google.maps.places.PlacesService(container);

    // Buscar lugares con textSearch, sesgado a la región del viaje
    const searchQuery = regionBias ? `${query} en ${regionBias}` : query;
    const results = await new Promise<any[]>((resolve, reject) => {
      service.textSearch(
        {
          query: searchQuery,
          language: "es",
        },
        (results: any[], status: string) => {
          if (status === google.maps.places.PlacesServiceStatus.OK && results) {
            resolve(results);
          } else {
            reject(new Error(`Places status: ${status}`));
          }
        },
      );
    });

    if (!results.length) {
      document.body.removeChild(container);
      return { error: "No se encontró el lugar", suggestions: [] };
    }

    // Tomar los primeros 3 y obtener detalles
    const topResults = results.slice(0, 3);
    const suggestions: Suggestion[] = [];

    for (const place of topResults) {
      try {
        const details = await new Promise<any>((resolve, reject) => {
          service.getDetails(
            {
              placeId: place.place_id,
              fields: ["name", "formatted_address", "geometry", "photos", "opening_hours", "website", "formatted_phone_number", "price_level", "rating", "types"],
              language: "es",
            },
            (result: any, status: string) => {
              if (status === google.maps.places.PlacesServiceStatus.OK && result) {
                resolve(result);
              } else {
                resolve(null);
              }
            },
          );
        });

        if (!details) {
          // Fallback: usar datos básicos del textSearch
          suggestions.push({
            place_id: place.place_id,
            name: place.name,
            address: place.formatted_address ?? place.name,
            lat: place.geometry?.location?.lat(),
            lng: place.geometry?.location?.lng(),
            photo_url: null,
            rating: place.rating ?? null,
            price_level: null,
            suggested_type: "visit",
            suggested_time: null,
            suggested_cost: null,
            suggested_currency: "BRL",
            opening_hours: null,
            website: null,
            phone: null,
            types: place.types ?? [],
          });
          continue;
        }

        // Obtener URL de la foto
        let photoUrl: string | null = null;
        if (details.photos?.[0]?.getUrl) {
          try {
            photoUrl = details.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 });
          } catch {
            photoUrl = null;
          }
        }

        // Mapear tipos
        const types = details.types ?? [];
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

        let suggestedTime: string | null = null;
        if (details.opening_hours?.weekday_text) {
          suggestedTime = "10:00";
        }

        let suggestedCost: number | null = null;
        if (details.price_level != null) {
          const costMap = [0, 30, 80, 200, 500];
          suggestedCost = costMap[details.price_level] ?? null;
        }

        suggestions.push({
          place_id: details.place_id ?? place.place_id,
          name: details.name ?? place.name,
          address: details.formatted_address ?? place.formatted_address ?? place.name,
          lat: details.geometry?.location?.lat() ?? place.geometry?.location?.lat(),
          lng: details.geometry?.location?.lng() ?? place.geometry?.location?.lng(),
          photo_url: photoUrl,
          rating: details.rating ?? null,
          price_level: details.price_level ?? null,
          suggested_type: suggestedType,
          suggested_time: suggestedTime,
          suggested_cost: suggestedCost,
          suggested_currency: "BRL",
          opening_hours: details.opening_hours?.weekday_text?.[new Date().getDay() === 0 ? 6 : new Date().getDay() - 1] ?? null,
          website: details.website ?? null,
          phone: details.formatted_phone_number ?? null,
          types: types,
        });
      } catch {
        // Continuar con el siguiente resultado si falla
      }
    }

    document.body.removeChild(container);
    return { suggestions };
  } catch (e) {
    console.error("Error en suggestPlace:", e);
    return { error: "Error al buscar lugares", suggestions: [] };
  }
}
