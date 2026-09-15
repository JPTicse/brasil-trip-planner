/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { CuratedSpot } from "@/lib/photo-types";
import { getCuratedSpotsForCity } from "@/lib/curated-spots";
import { isTourismBusiness } from "@/lib/tourism-filter";
import { getSpotImageUrls } from "@/lib/spot-images";
import { filterValidImages } from "@/lib/wikimedia-images";
import type { Inspiration } from "@/lib/types";

type GPlaceResult = google.maps.places.PlaceResult;

type ActivityType = "visit" | "tour" | "meal" | "event" | "free" | "transport";

type ServerImageResult = {
  url: string;
  source_url: string;
  source_name: string;
  license: string;
  width: number;
  height: number;
  alt?: string;
};

/**
 * Llama a nuestra API route server-side para buscar imágenes.
 * Usa Openverse + Wikimedia, 100% gratis, sin keys expuestas.
 */
async function searchImagesServerSide(
  query: string,
  type: "place" | "pose",
  count = 5,
): Promise<ServerImageResult[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      type,
      count: String(count),
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);
    const res = await fetch(`/api/pose-search?${params.toString()}`, {
      cache: "no-store",
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) return [];
    const data = await res.json();
    return data.results ?? [];
  } catch {
    return [];
  }
}

const GOOGLE_TYPES_TO_ACTIVITY: Record<string, ActivityType> = {
  tourist_attraction: "visit",
  museum: "visit",
  park: "free",
  restaurant: "meal",
  cafe: "meal",
  bar: "meal",
  lodging: "visit",
  stadium: "visit",
  shopping_mall: "visit",
  natural_feature: "free",
  point_of_interest: "visit",
  beach: "free",
  viewpoint: "visit",
  landmark: "visit",
};

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function typeToActivity(types?: string[]): ActivityType {
  if (!types) return "visit";
  for (const t of types) {
    if (GOOGLE_TYPES_TO_ACTIVITY[t]) return GOOGLE_TYPES_TO_ACTIVITY[t];
  }
  return "visit";
}

function priceLevelToCost(level: number | null): number | null {
  if (level == null) return null;
  const map: Record<number, number> = { 0: 0, 1: 20, 2: 60, 3: 120, 4: 250 };
  return map[level] ?? null;
}

/** Normaliza un nombre para comparar duplicados: minúsculas, sin acentos, sin espacios extra */
function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loadGoogleMaps(): Promise<void> {
  const win = window as any;
  if (win.google?.maps?.places) return Promise.resolve();
  if (win._googleMapsLoadPromise) return win._googleMapsLoadPromise;

  win._googleMapsLoadPromise = new Promise<void>((resolve, reject) => {
    const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!key) {
      reject(new Error("Falta NEXT_PUBLIC_GOOGLE_MAPS_API_KEY"));
      return;
    }

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places&language=es&callback=__gmInit&loading=async`;
    script.async = true;
    script.defer = true;

    win.__gmInit = () => resolve();
    script.onerror = () => reject(new Error("No se pudo cargar Google Maps"));
    document.head.appendChild(script);
  });

  return win._googleMapsLoadPromise;
}

function findPlace(
  service: google.maps.places.PlacesService,
  query: string,
  location?: google.maps.LatLng,
): Promise<GPlaceResult | null> {
  return new Promise((resolve) => {
    const request: google.maps.places.FindPlaceFromQueryRequest = {
      query,
      fields: ["place_id", "name", "formatted_address", "photos", "rating", "user_ratings_total", "types", "price_level", "opening_hours"],
    };
    if (location) {
      request.locationBias = location;
    }
    service.findPlaceFromQuery(request, (results, status) => {
      const okStatus = google.maps.places.PlacesServiceStatus.OK;
      if (status === okStatus && results && results.length > 0) {
        resolve(results[0]);
      } else {
        resolve(null);
      }
    });
  });
}

function getDetails(
  service: google.maps.places.PlacesService,
  placeId: string,
): Promise<GPlaceResult | null> {
  return new Promise((resolve) => {
    service.getDetails(
      {
        placeId,
        fields: ["place_id", "name", "formatted_address", "photos", "rating", "user_ratings_total", "types", "price_level", "opening_hours", "website", "editorial_summary", "geometry"],
      },
      (place, status) => {
        const okStatus = google.maps.places.PlacesServiceStatus.OK;
        if (status === okStatus && place) {
          resolve(place);
        } else {
          resolve(null);
        }
      },
    );
  });
}

async function fillImages(
  imageUrls: string[],
  curatedSpot: CuratedSpot | undefined,
  cityHint: string | undefined,
): Promise<string[]> {
  // 1. Si ya hay fotos de Google Places, usarlas
  if (imageUrls.length > 0) return imageUrls;
  // 2. Si hay imágenes fijas curadas, usarlas
  if (curatedSpot) {
    const fixed = getSpotImageUrls(curatedSpot, cityHint);
    if (fixed.length > 0) return fixed;
  }
  // 3. Buscar via server-side API (Openverse + Wikimedia)
  if (curatedSpot) {
    const query = `${curatedSpot.name_en ?? curatedSpot.name} ${cityHint ?? ""}`;
    const results = await searchImagesServerSide(query, "place", 3);
    const urls = results.map((r) => r.url);
    if (urls.length > 0) return urls;
  }
  return [];
}

function placeToInspiration(place: GPlaceResult, curatedSpot?: CuratedSpot, cityHint?: string): Inspiration {
  const types = place.types ?? [];
  const suggestedType = curatedSpot?.type ?? typeToActivity(types);

  let imageUrls: string[] = [];
  if (place.photos) {
    for (const photo of place.photos) {
      imageUrls.push(photo.getUrl({ maxWidth: 800 }));
      if (imageUrls.length >= 10) break;
    }
  }
  if (imageUrls.length === 0 && curatedSpot) {
    imageUrls = getSpotImageUrls(curatedSpot, cityHint);
  }
  const location = place.geometry?.location;
  const lat = location?.lat();
  const lng = location?.lng();
  const editorialSummary = (place as any).editorial_summary;

  return {
    id: place.place_id ?? `google-${place.name}`,
    place_id: place.place_id ?? `google-${place.name}`,
    trip_id: "",
    title: place.name ?? curatedSpot?.name ?? "",
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

function curatedToInspiration(spot: CuratedSpot, cityHint?: string): Inspiration {
  const imageUrls = getSpotImageUrls(spot, cityHint);
  return {
    id: `curated-${spot.name}`,
    place_id: `curated-${spot.name}`,
    trip_id: "",
    title: spot.name,
    address: spot.address,
    image_url: imageUrls[0] ?? null,
    image_urls: imageUrls,
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

function textSearch(
  service: google.maps.places.PlacesService,
  query: string,
  locationBias?: google.maps.LatLngBounds,
): Promise<GPlaceResult[]> {
  return new Promise((resolve) => {
    const request: google.maps.places.TextSearchRequest = { query, language: "es" };
    if (locationBias) request.bounds = locationBias;
    service.textSearch(request, (results, status) => {
      const okStatus = google.maps.places.PlacesServiceStatus.OK;
      if (status === okStatus && results) {
        resolve(results);
      } else {
        resolve([]);
      }
    });
  });
}

function getCityBounds(city: string, spots: CuratedSpot[]): google.maps.LatLngBounds | undefined {
  if (spots.length === 0) return undefined;
  const bounds = new (window as any).google.maps.LatLngBounds();
  for (const spot of spots) {
    bounds.extend(new (window as any).google.maps.LatLng(spot.lat, spot.lng));
  }
  return bounds;
}

/**
 * Busca inspiraciones combinando:
 * 1. Spots curados (con conceptos de foto) enriquecidos con Google Places
 * 2. Lugares adicionales de Google Places textSearch (datos fiables)
 *
 * Devuelve hasta maxResults combinados, sin duplicados por place_id.
 */
export async function fetchInspirationsClient(
  destination: string,
  _apiKey: string,
  maxResults = 50,
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

  const curatedSpots = getCuratedSpotsForCity(destination);
  const resultsById = new Map<string, Inspiration>();

  // Deduplicación global: ninguna URL debe repetirse entre spots
  const usedPlaceUrls = new Set<string>();
  const usedPoseUrls = new Set<string>();

  // --- STEP 1: Enriquecer spots curados con Google Places ---
  if (curatedSpots.length > 0) {
    const batchSize = 5;

    for (let i = 0; i < curatedSpots.length; i += batchSize) {
      const batch = curatedSpots.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (spot): Promise<Inspiration> => {
          let insp: Inspiration | null = null;
          try {
            const location = new google.maps.LatLng(spot.lat, spot.lng);
            const found = await findPlace(service, spot.search_query, location);

            if (found && found.place_id) {
              if (isTourismBusiness(found.name ?? "", found.types ?? [])) {
                insp = curatedToInspiration(spot, destination);
              } else {
                const detailed = await getDetails(service, found.place_id);
                if (detailed) {
                  if (isTourismBusiness(detailed.name ?? "", detailed.types ?? [])) {
                    insp = curatedToInspiration(spot, destination);
                  } else {
                    insp = placeToInspiration(detailed, spot, destination);
                    if (insp) insp.title = spot.name;
                  }
                }
                if (!insp) {
                  const basicInsp = placeToInspiration(found, spot, destination);
                  if (basicInsp) {
                    basicInsp.title = spot.name;
                    insp = basicInsp;
                  }
                }
              }
            }
          } catch {
            // fallback al spot curado sin enriquecer
          }
          if (!insp) {
            insp = curatedToInspiration(spot, destination);
          }

          // Validar solo fotos de Google Places (pueden expirar).
          let validImages = insp.image_urls;
          if (insp.image_urls.length > 0) {
            validImages = await filterValidImages(insp.image_urls);
          }
          // Si no hay suficientes fotos del lugar, buscar via server-side
          if (validImages.length < 5) {
            try {
              // Usar nombre en portugués (mejor para Openverse/Wikimedia en Brasil)
              const placeQuery = `${spot.name} ${destination}`;
              const serverResults = await searchImagesServerSide(
                placeQuery,
                "place",
                10,
              );
              // Combinar con las que ya tenemos, deduplicando
              const newUrls = serverResults
                .map((r) => r.url)
                .filter((url) => !validImages.includes(url) && !usedPlaceUrls.has(url));
              validImages = [...validImages, ...newUrls];
            } catch {
              // sin imágenes adicionales
            }
          }
          // Deduplicar contra otros spots y registrar
          validImages = validImages.filter((url) => {
            if (usedPlaceUrls.has(url)) return false;
            usedPlaceUrls.add(url);
            return true;
          });
          insp.image_urls = validImages;
          insp.image_url = validImages[0] ?? null;

          return insp;
        }),
      );

      for (const r of batchResults) {
        resultsById.set(r.place_id, r);
      }

      if (i + batchSize < curatedSpots.length) {
        await sleep(300);
      }
    }

    // --- STEP 1.5: Buscar fotos de personas en el lugar → generar concepts desde las fotos ---
    // ENFOQUE INVERTIDO: buscar fotos primero, luego generar el detalle desde el alt text
    // NO: definir pose en español → buscar foto que coincida (nunca funciona)
    // SÍ: buscar fotos de personas → usar alt text como descripción de la pose
    const poseSearchPromises = curatedSpots.map(async (spot) => {
      if (!spot.photo_concepts?.length) return;
      try {
        const inspiration = Array.from(resultsById.values()).find(
          (item) => item.title.toLocaleLowerCase() === spot.name.toLocaleLowerCase(),
        );
        if (!inspiration) return;

        // Estrategia de queries para Pexels (indexa en inglés):
        // 1. "[name_en] people" — turistas/multitudes en el landmark
        // 2. "woman posing [destination]" — mujeres posando en la ciudad
        // 3. "man posing [destination]" — hombres posando en la ciudad
        // NO usar "tourist posing [monument]" — devuelve monumentos vacíos
        const spotNameEn = spot.name_en ?? spot.name;
        const queries = [
          `${spotNameEn} people`,
          `woman posing ${destination}`,
          `man posing ${destination}`,
        ];

        let allPoseResults: { url: string; source_url: string; alt?: string }[] = [];
        for (const query of queries) {
          const results = await searchImagesServerSide(query, "pose", 10);
          // Deduplicar dentro del pool de poses
          const uniqueResults = results.filter((r) => {
            if (usedPoseUrls.has(r.url)) return false;
            usedPoseUrls.add(r.url);
            return true;
          });
          allPoseResults.push(...uniqueResults.map((r) => ({ url: r.url, source_url: r.source_url, alt: r.alt })));
          if (allPoseResults.length >= 6) break; // suficiente con 6 fotos
        }

        // Fallback: Pollinations AI genera imágenes de personas en poses si Pexels no devuelve suficiente
        if (allPoseResults.length < 3) {
          const spotNameEn2 = spot.name_en ?? spot.name;
          const posePrompts = (spot.photo_concepts ?? []).slice(0, 3).map((c) =>
            `tourist posing with arms open at ${spotNameEn2} ${destination}, realistic photograph, golden hour, high quality, photorealistic`
          );
          for (const prompt of posePrompts) {
            const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=800&height=1200&nologo=true&model=flux`;
            if (usedPoseUrls.has(pollinationsUrl)) continue;
            usedPoseUrls.add(pollinationsUrl);
            allPoseResults.push({
              url: pollinationsUrl,
              source_url: "https://pollinations.ai",
              alt: `Pose generada por IA en ${spot.name}`,
            });
            if (allPoseResults.length >= 6) break;
          }
        }

        if (allPoseResults.length === 0) return; // fallback: mantener concepts curados sin imágenes

        // GENERAR concepts dinámicamente desde las fotos encontradas
        // Cada foto se convierte en un concept con su alt text como título
        const dynamicConcepts = allPoseResults.slice(0, 6).map((photo) => ({
          title: photo.alt || `Pose en ${spot.name}`,
          description: photo.alt || "",
          reference_image_urls: [photo.url],
          reference_source_urls: [photo.source_url],
        }));

        // Reemplazar los concepts curados con los dinámicos
        inspiration.photo_concepts = dynamicConcepts;
      } catch {
        return;
      }
    });
    await Promise.allSettled(poseSearchPromises);
  }

  // --- STEP 2: Buscar lugares adicionales en Google Maps (datos fiables para tab "Lugares") ---
  const queries = [
    `best things to do in ${destination}`,
    `top attractions in ${destination}`,
    `best places to visit in ${destination}`,
    `famous landmarks in ${destination}`,
    `popular restaurants in ${destination}`,
    `best beaches in ${destination}`,
    `best parks in ${destination}`,
    `top rated places in ${destination}`,
    `coisas para fazer em ${destination}`,
    `pontos turisticos em ${destination}`,
  ];

  const bounds = getCityBounds(destination, curatedSpots);
  const textResults = new Map<string, GPlaceResult>();

  await Promise.allSettled(
    queries.map(async (query) => {
      try {
        const items = await textSearch(service, query, bounds);
        for (const item of items) {
          if (item.place_id && !textResults.has(item.place_id)) {
            if (!isTourismBusiness(item.name ?? "", item.types ?? [])) {
              textResults.set(item.place_id, item);
            }
          }
        }
      } catch {
        // ignorar queries que fallen
      }
    }),
  );

  // Limitamos a los más prometedores para no saturar getDetails ni la API de imágenes
  const textPlaceIds = Array.from(textResults.keys()).slice(0, 15);

  for (let i = 0; i < textPlaceIds.length; i += 5) {
    const batch = textPlaceIds.slice(i, i + 5);
    const batchResults = await Promise.all(
      batch.map((id) => getDetails(service, id)),
    );

    for (const place of batchResults) {
      if (place && place.place_id) {
        if (isTourismBusiness(place.name ?? "", place.types ?? [])) continue;
        // Deduplicar contra spots curados por nombre normalizado
        const placeNameNorm = normalizeName(place.name ?? "");
        const isDuplicateOfCurated = curatedSpots.some(
          (s) => normalizeName(s.name) === placeNameNorm || normalizeName(s.name_en ?? s.name) === placeNameNorm,
        );
        if (isDuplicateOfCurated) continue;
        const insp = placeToInspiration(place, undefined, destination);
        // Validar solo fotos de Google Places; server-side se confía
        let validImages = insp.image_urls;
        if (validImages.length > 0) {
          validImages = await filterValidImages(validImages);
        }
        if (validImages.length < 5) {
          try {
            const serverResults = await searchImagesServerSide(
              `${place.name ?? ""} ${destination}`,
              "place",
              8,
            );
            const newUrls = serverResults
              .map((r) => r.url)
              .filter((url) => !validImages.includes(url) && !usedPlaceUrls.has(url));
            validImages = [...validImages, ...newUrls];
          } catch {
            // sin imágenes adicionales
          }
        }
        // Deduplicar contra otros spots
        validImages = validImages.filter((url) => {
          if (usedPlaceUrls.has(url)) return false;
          usedPlaceUrls.add(url);
          return true;
        });
        insp.image_urls = validImages;
        insp.image_url = validImages[0] ?? null;
        if (validImages.length > 0) {
          if (!resultsById.has(insp.place_id)) {
            resultsById.set(insp.place_id, insp);
          }
        }
      }
    }

    if (i + 5 < textPlaceIds.length) await sleep(300);
  }

  attribDiv.remove();

  const all = Array.from(resultsById.values());

  // Ordenar: items con photo_concepts + fotos primero, luego con foto, luego rating
  all.sort((a, b) => {
    const scoreA =
      (a.photo_concepts.length > 0 ? 4 : 0) +
      (a.image_urls.length > 0 ? 2 : 0) +
      (a.rating ?? 0) / 10 +
      (a.instagram_score ?? 0) / 10;
    const scoreB =
      (b.photo_concepts.length > 0 ? 4 : 0) +
      (b.image_urls.length > 0 ? 2 : 0) +
      (b.rating ?? 0) / 10 +
      (b.instagram_score ?? 0) / 10;
    return scoreB - scoreA;
  });

  return all.slice(0, maxResults);
}
