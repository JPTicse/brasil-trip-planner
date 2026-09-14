/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import type { CuratedSpot } from "@/lib/photo-types";

// --- Tipos ---

type WikiImage = {
  url: string;
  thumb_url: string;
  title: string;
  source_url: string;
  width: number;
  height: number;
};

// Caché en memoria: nombre del spot → imágenes
const imageCache = new Map<string, WikiImage[]>();

/**
 * Busca imágenes reales de un lugar en Wikimedia Commons.
 * Es gratis, sin rate limits severos, y devuelve fotos reales del lugar.
 *
 * @param query   Texto de búsqueda (ej: "Cristo Redentor Rio")
 * @param count   Número de imágenes (máx 5)
 */
export async function searchWikimediaImages(
  query: string,
  count = 3,
): Promise<WikiImage[]> {
  const cacheKey = `${query}:${count}`;
  if (imageCache.has(cacheKey)) {
    return imageCache.get(cacheKey)!;
  }

  try {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", `${query}`);
    url.searchParams.set("gsrnamespace", "6"); // File namespace
    url.searchParams.set("gsrlimit", String(count));
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|mime|size");
    url.searchParams.set("iiurlwidth", "800");

    const res = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
    });

    if (!res.ok) {
      console.warn("Wikimedia API error:", res.status);
      return [];
    }

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) {
      imageCache.set(cacheKey, []);
      return [];
    }

    const images: WikiImage[] = [];
    for (const page of Object.values<any>(pages)) {
      const info = page.imageinfo?.[0];
      if (!info) continue;

      // Solo imágenes (no PDFs, SVGs, etc.)
      const mime = info.mime ?? "";
      if (!mime.startsWith("image/")) continue;
      if (mime.includes("svg")) continue;

      const thumbUrl = info.thumburl ?? info.url;
      if (!thumbUrl) continue;

      images.push({
        url: info.url,
        thumb_url: thumbUrl,
        title: page.title ?? "",
        source_url: info.descriptionurl ?? "",
        width: info.thumbwidth ?? info.width ?? 800,
        height: info.thumbheight ?? info.height ?? 600,
      });
    }

    // Ordenar: preferir JPEGs (suelen ser fotos, no diagramas)
    images.sort((a, b) => {
      // No tenemos mime aquí, pero los JPEGs suelen tener .jpg en el título
      const aJpg = a.title.toLowerCase().match(/\.(jpg|jpeg|png)/) ? 1 : 0;
      const bJpg = b.title.toLowerCase().match(/\.(jpg|jpeg|png)/) ? 1 : 0;
      return bJpg - aJpg;
    });

    const result = images.slice(0, count);
    imageCache.set(cacheKey, result);
    return result;
  } catch (e) {
    console.warn("searchWikimediaImages error:", e);
    return [];
  }
}

/**
 * Busca imágenes de un spot curado en Wikimedia Commons.
 * Usa el nombre del spot + ciudad como query.
 */
export async function getSpotImagesFromWikimedia(
  spot: CuratedSpot,
  cityHint?: string,
  count = 3,
): Promise<string[]> {
  // Construir query: priorizar name_en si existe
  const queryParts = [spot.name_en ?? spot.name];
  if (cityHint) queryParts.push(cityHint);

  const query = queryParts.join(" ");
  const images = await searchWikimediaImages(query, count);

  // Si no hay resultados, intentar con solo el nombre
  if (images.length === 0) {
    const fallbackImages = await searchWikimediaImages(spot.name, count);
    return fallbackImages.map((img) => img.thumb_url);
  }

  return images.map((img) => img.thumb_url);
}

/**
 * Busca imágenes de referencia de una pose específica.
 * Usa el nombre del spot + título del concepto como query.
 */
export async function getPoseImagesFromWikimedia(
  spot: CuratedSpot,
  conceptTitle: string,
  cityHint?: string,
  count = 4,
): Promise<{ urls: string[]; sources: string[] }> {
  const queryParts = [spot.name_en ?? spot.name, conceptTitle];
  if (cityHint) queryParts.push(cityHint);

  const query = queryParts.join(" ");
  const images = await searchWikimediaImages(query, count);

  return {
    urls: images.map((img) => img.thumb_url),
    sources: images.map((img) => img.source_url),
  };
}
