"use client";

import { loadGoogleMaps } from "@/lib/google-maps";
import { isTourismBusiness } from "@/lib/tourism-filter";
import { getCuratedSpotsForCity, type CuratedSpot } from "@/lib/curated-spots";
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

type GPlaceResult = google.maps.places.PlaceResult;

function placeToInspiration(place: GPlaceResult, curatedSpot?: CuratedSpot): Inspiration | null {
  if (!place.place_id || !place.name) return null;

  const types = place.types ?? [];
  // Usar tipo del spot curado si existe, sino mapear de Google
  const suggestedType = curatedSpot?.type ?? mapGoogleTypeToActivityType(types);

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
    address: place.formatted_address ?? place.vicinity ?? curatedSpot?.address ?? null,
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
    description: editorialSummary?.overview ?? curatedSpot?.description ?? null,
    viral_trend: curatedSpot?.viral_trend ?? null,
    category: curatedSpot?.category ?? null,
    emoji: curatedSpot?.emoji ?? null,
    photo_concepts: curatedSpot?.photo_concepts ?? [],
    instagram_score: curatedSpot?.instagram_score ?? null,
    difficulty: curatedSpot?.difficulty ?? null,
    best_time: curatedSpot?.best_time ?? null,
    opening_hours: place.opening_hours?.weekday_text ?? null,
    website: place.website ?? null,
    user_ratings_total: place.user_ratings_total ?? null,
    rating: place.rating ?? null,
    price_level: place.price_level ?? null,
    types,
    suggested_type: suggestedType,
    location: place.formatted_address ?? place.vicinity ?? curatedSpot?.address ?? null,
    lat: typeof lat === "number" ? lat : curatedSpot?.lat ?? null,
    lng: typeof lng === "number" ? lng : curatedSpot?.lng ?? null,
    cost_estimate: priceLevelToCost(place.price_level ?? null),
    currency: "BRL",
    cached_at: null,
    expires_at: null,
  } as Inspiration;
}

// Convierte un spot curado (sin Google data) en Inspiration básica
function curatedToInspiration(spot: CuratedSpot): Inspiration {
  return {
    id: `curated-${spot.name}`,
    place_id: `curated-${spot.name}`,
    trip_id: "",
    title: spot.name,
    address: spot.address,
    image_url: null,
    image_urls: [],
    description: spot.description,
    viral_trend: spot.viral_trend ?? null,
    category: spot.category,
    emoji: spot.emoji,
    photo_concepts: spot.photo_concepts ?? [],
    instagram_score: spot.instagram_score ?? null,
    difficulty: spot.difficulty ?? null,
    best_time: spot.best_time ?? null,
    opening_hours: null,
    website: null,
    user_ratings_total: null,
    rating: null,
    price_level: null,
    types: [],
    suggested_type: spot.type,
    location: spot.address,
    lat: spot.lat,
    lng: spot.lng,
    cost_estimate: null,
    currency: "BRL",
    cached_at: null,
    expires_at: null,
  } as Inspiration;
}

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

// Promisified findPlaceFromQuery
function findPlace(
  service: google.maps.places.PlacesService,
  query: string,
  locationBias?: google.maps.LatLng,
): Promise<GPlaceResult | null> {
  return new Promise((resolve) => {
    const request: google.maps.places.FindPlaceFromQueryRequest = {
      query,
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
        "opening_hours",
        "website",
        "business_status",
      ],
    };
    if (locationBias) {
      (request as any).locationBias = locationBias;
    }
    service.findPlaceFromQuery(
      request,
      (results: GPlaceResult[] | null, status: string) => {
        const okStatus = (window as any).google?.maps?.places?.PlacesServiceStatus?.OK;
        if (status === okStatus && results && results.length > 0) {
          resolve(results[0]);
        } else {
          resolve(null);
        }
      },
    );
  });
}

// Promisified getDetails
function getDetails(
  service: google.maps.places.PlacesService,
  placeId: string,
): Promise<GPlaceResult | null> {
  return new Promise((resolve) => {
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
      (place: GPlaceResult | null, status: string) => {
        const okStatus = (window as any).google?.maps?.places?.PlacesServiceStatus?.OK;
        if (status === okStatus && place) {
          resolve(place);
        } else {
          resolve(null);
        }
      },
    );
  });
}

/**
 * Busca lugares trending en la ciudad del viaje.
 *
 * Estrategia:
 * 1. Usar spots curados como base (datos propios, no dependemos de Google)
 * 2. Enriquecer cada spot curado con Google Places (findPlaceFromQuery + getDetails)
 *    para obtener fotos, rating, horarios, descripción
 * 3. Throttle las llamadas (máx 10 concurrentes, delay 200ms) para evitar OVER_QUERY_LIMIT
 * 4. Si no hay spots curados, fallback a textSearch con filtro de agencias
 * 5. Filtrar resultados que sean agencias de turismo (isTourismBusiness)
 */
export async function fetchInspirationsClient(
  destination: string,
  _apiKey: string,
  maxResults = 30,
): Promise<Inspiration[]> {
  await loadGoogleMaps();

  const google = (window as any).google;
  if (!google?.maps?.places) {
    throw new Error("Google Places no está disponible");
  }

  const attribDiv = document.createElement("div");
  attribDiv.style.display = "none";
  document.body.appendChild(attribDiv);
  const service = new google.maps.places.PlacesService(attribDiv);

  // STEP 1: Obtener spots curados para esta ciudad
  const curatedSpots = getCuratedSpotsForCity(destination);

  if (curatedSpots.length > 0) {
    // STEP 2: Enriquecer spots curados con Google Places (throttled)
    const results: Inspiration[] = [];
    const batchSize = 5; // throttle: 5 concurrentes, delay entre batches
    let enrichedCount = 0;

    for (let i = 0; i < curatedSpots.length; i += batchSize) {
      const batch = curatedSpots.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (spot): Promise<Inspiration> => {
          try {
            // findPlaceFromQuery con locationBias hacia las coords del spot
            const location = new google.maps.LatLng(spot.lat, spot.lng);
            const found = await findPlace(service, spot.search_query, location);

            if (found && found.place_id) {
              // FILTRAR: si Google devolvió una agencia, usar spot curado sin enriquecer
              if (isTourismBusiness(found.name ?? "", found.types ?? [])) {
                return curatedToInspiration(spot);
              }
              // getDetails para fotos completas
              const detailed = await getDetails(service, found.place_id);
              if (detailed) {
                // Filtro final en getDetails también
                if (isTourismBusiness(detailed.name ?? "", detailed.types ?? [])) {
                  return curatedToInspiration(spot);
                }
                const insp = placeToInspiration(detailed, spot);
                if (insp) {
                  // Usar nombre curado si Google devuelve algo distinto
                  insp.title = spot.name;
                  return insp;
                }
              }
              // Si getDetails falló pero findPlaceFromQuery tuvo data básica
              const insp = placeToInspiration(found, spot);
              if (insp) {
                insp.title = spot.name;
                return insp;
              }
            }
          } catch {
            // fallback al spot curado sin enriquecer
          }
          // Sin Google data → usar spot curado básico
          return curatedToInspiration(spot);
        }),
      );
      results.push(...batchResults);
      enrichedCount += batchResults.length;

      // Delay entre batches para no exceder rate limit
      if (i + batchSize < curatedSpots.length) {
        await sleep(300);
      }
    }

    // Ordenar: spots con viral_trend + foto primero, luego con foto, luego sin foto
    results.sort((a, b) => {
      // Score: viral_trend (2 pts) + tiene foto (1 pt) + rating
      const scoreA =
        (a.viral_trend ? 2 : 0) +
        (a.image_urls.length > 0 ? 1 : 0) +
        (a.rating ?? 0) / 10;
      const scoreB =
        (b.viral_trend ? 2 : 0) +
        (b.image_urls.length > 0 ? 1 : 0) +
        (b.rating ?? 0) / 10;
      return scoreB - scoreA;
    });

    attribDiv.remove();
    return results.slice(0, maxResults);
  }

  // STEP 3: Fallback — sin spots curados, usar textSearch con filtro de agencias
  const queries = [
    `most photographed places in ${destination}`,
    `iconic landmarks in ${destination}`,
    `famous viewpoints in ${destination}`,
    `best photo spots in ${destination}`,
    `instagrammable places in ${destination}`,
    `must-see places in ${destination}`,
    `famous monuments in ${destination}`,
    `hidden gems in ${destination}`,
  ];

  const allPlaces = new Map<string, GPlaceResult>();

  await Promise.allSettled(
    queries.map(
      (query) =>
        new Promise<void>((resolve) => {
          service.textSearch(
            { query, language: "es" },
            (results: GPlaceResult[] | null, status: string) => {
              const okStatus = google.maps.places.PlacesServiceStatus.OK;
              if (status === okStatus && results) {
                for (const r of results) {
                  if (r.place_id && !allPlaces.has(r.place_id)) {
                    // FILTRAR agencias de turismo
                    if (!isTourismBusiness(r.name ?? "", r.types ?? [])) {
                      allPlaces.set(r.place_id, r);
                    }
                  }
                }
              }
              resolve();
            },
          );
        }),
    ),
  );

  // getDetails throttled para los top places
  const placeIds = Array.from(allPlaces.keys()).slice(0, maxResults * 2);
  const detailedPlaces: GPlaceResult[] = [];

  // Procesar en batches de 5 con delay
  for (let i = 0; i < placeIds.length; i += 5) {
    const batch = placeIds.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map((id) => getDetails(service, id)),
    );
    for (const place of batchResults) {
      if (place && place.photos && place.photos.length > 0) {
        // Filtro final de agencias
        if (!isTourismBusiness(place.name ?? "", place.types ?? [])) {
          detailedPlaces.push(place);
        }
      }
    }
    if (i + 5 < placeIds.length) await sleep(300);
  }

  attribDiv.remove();

  const inspirations: Inspiration[] = [];
  for (const place of detailedPlaces) {
    const insp = placeToInspiration(place);
    if (insp && insp.image_urls.length > 0) {
      inspirations.push(insp);
    }
    if (inspirations.length >= maxResults) break;
  }

  inspirations.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  return inspirations;
}
