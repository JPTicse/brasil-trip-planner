/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { CuratedSpot } from "@/lib/photo-types";

// --- Tipos para resultados de búsqueda de imágenes ---

export type ImageReference = {
  url: string;          // URL directa de la imagen
  source_url: string;   // Página donde aparece la imagen
  source_title: string; // Título de la página fuente
  width: number;
  height: number;
  thumbnail_url?: string;
};

type GoogleCseItem = {
  link: string;
  image?: {
    contextLink: string;
    thumbnailLink?: string;
    width?: number;
    height?: number;
  };
  title: string;
  displayLink: string;
};

/**
 * Busca imágenes reales de una pose/concepto usando Google Custom Search JSON API.
 *
 * Requiere:
 * - NEXT_PUBLIC_GOOGLE_CSE_API_KEY
 * - NEXT_PUBLIC_GOOGLE_CSE_ID
 *
 * @param query  Texto de búsqueda (ej: "Pedra do Telégrafo hanging pose")
 * @param count  Número de imágenes (máx 10)
 */
export async function searchPoseImages(
  query: string,
  count = 4,
): Promise<ImageReference[]> {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CSE_API_KEY;
  const cseId = process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;

  if (!apiKey || !cseId) {
    return [];
  }

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cseId);
    url.searchParams.set("q", query);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", String(Math.min(count, 10)));
    url.searchParams.set("safe", "active");
    url.searchParams.set("imgSize", "large");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn("Google CSE error:", res.status);
      return [];
    }

    const data = await res.json();
    const items: GoogleCseItem[] = data.items ?? [];

    return items
      .filter((item) => item.link && item.image?.contextLink)
      .map((item) => ({
        url: item.link,
        source_url: item.image!.contextLink,
        source_title: item.title,
        width: item.image?.width ?? 800,
        height: item.image?.height ?? 600,
        thumbnail_url: item.image?.thumbnailLink,
      }));
  } catch (e) {
    console.warn("searchPoseImages error:", e);
    return [];
  }
}

/**
 * Construye queries específicas para buscar fotos que muestren una pose/concepto.
 */
export function buildPoseQuery(spot: CuratedSpot, conceptTitle: string, cityHint?: string): string {
  const parts: string[] = [];
  // Nombre del spot (priorizar name_en si existe para más resultados en inglés)
  parts.push(spot.name_en ?? spot.name);
  // Título del concepto (describe la pose/trend)
  parts.push(conceptTitle.toLowerCase());
  // Ciudad como contexto
  if (cityHint) parts.push(cityHint);
  // Sufijo para favorecer fotos con personas
  parts.push("photo pose");
  return parts.join(" ");
}

/**
 * Busca imágenes de referencia para cada photo_concept de un spot.
 * Devuelve un mapa: índice del concepto → array de referencias.
 */
export async function searchSpotPoseImages(
  spot: CuratedSpot,
  cityHint?: string,
): Promise<Record<number, ImageReference[]>> {
  const result: Record<number, ImageReference[]> = {};
  if (!spot.photo_concepts || spot.photo_concepts.length === 0) return result;

  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_CSE_API_KEY;
  if (!apiKey) return result;

  // Buscar en paralelo (máx 4 imágenes por concepto)
  const concepts = spot.photo_concepts;
  const searches = concepts.map((concept, i) =>
    searchPoseImages(buildPoseQuery(spot, concept.title, cityHint), 4).then(
      (refs) => [i, refs] as const,
    ),
  );

  const settled = await Promise.allSettled(searches);
  for (const s of settled) {
    if (s.status === "fulfilled") {
      const [idx, refs] = s.value;
      if (refs.length > 0) result[idx] = refs;
    }
  }

  return result;
}
