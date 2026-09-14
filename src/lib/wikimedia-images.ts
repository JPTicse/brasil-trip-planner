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

// Caché en memoria: query → imágenes
const imageCache = new Map<string, WikiImage[]>();

// Caché de validación: URL → boolean (si carga o no)
const validationCache = new Map<string, boolean>();

/**
 * Valida si una URL de imagen realmente carga (HEAD request).
 * Cacha el resultado para no repetir.
 */
export async function validateImageUrl(url: string, timeoutMs = 5000): Promise<boolean> {
  if (validationCache.has(url)) {
    return validationCache.get(url)!;
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    const res = await fetch(url, {
      method: "HEAD",
      signal: controller.signal,
      mode: "no-cors",
    });
    clearTimeout(timeout);
    // En mode no-cors, opaque response = 0, pero significa que cargó
    const valid = res.type === "opaque" || res.ok;
    validationCache.set(url, valid);
    return valid;
  } catch {
    validationCache.set(url, false);
    return false;
  }
}

/**
 * Filtra una lista de URLs dejando solo las que cargan.
 */
export async function filterValidImages(urls: string[]): Promise<string[]> {
  const checks = await Promise.all(urls.map((u) => validateImageUrl(u)));
  return urls.filter((_, i) => checks[i]);
}

/**
 * Busca imágenes reales de un lugar en Wikimedia Commons.
 * Es gratis, sin rate limits severos, y devuelve fotos reales del lugar.
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
    url.searchParams.set("gsrlimit", String(count + 2)); // pedir extra por si algunas fallan
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
      if (mime.includes("gif")) continue; // gifs suelen ser iconos

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
  const queryParts = [spot.name_en ?? spot.name];
  if (cityHint) queryParts.push(cityHint);

  const query = queryParts.join(" ");
  const images = await searchWikimediaImages(query, count);

  if (images.length === 0) {
    const fallbackImages = await searchWikimediaImages(spot.name, count);
    return fallbackImages.map((img) => img.thumb_url);
  }

  return images.map((img) => img.thumb_url);
}

/**
 * Construye múltiples queries para buscar fotos de personas en poses específicas.
 * Wikimedia Commons tiene fotos subidas por usuarios, así que buscamos con
 * términos que incluyan "person", "tourist", "people" para encontrar fotos
 * con gente, no solo paisajes.
 */
function buildPoseQueries(spot: CuratedSpot, conceptTitle: string, cityHint?: string): string[] {
  const spotName = spot.name_en ?? spot.name;
  const queries: string[] = [];

  // Query 1: spot + concept (ej: "Sugarloaf Mountain mirador con la bahía de fondo")
  queries.push(`${spotName} ${conceptTitle}`);

  // Query 2: spot + person/tourist (ej: "Sugarloaf Mountain tourist")
  queries.push(`${spotName} tourist person`);

  // Query 3: spot + people (ej: "Sugarloaf Mountain people photo")
  queries.push(`${spotName} people photo`);

  // Query 4: solo el spot (fallback al paisaje)
  if (cityHint) {
    queries.push(`${spotName} ${cityHint}`);
  } else {
    queries.push(spotName);
  }

  return queries;
}

/**
 * Busca imágenes de referencia de una pose específica.
 * Intenta múltiples queries para encontrar fotos con personas.
 */
export async function getPoseImagesFromWikimedia(
  spot: CuratedSpot,
  conceptTitle: string,
  cityHint?: string,
  count = 4,
): Promise<{ urls: string[]; sources: string[] }> {
  const queries = buildPoseQueries(spot, conceptTitle, cityHint);

  for (const query of queries) {
    const images = await searchWikimediaImages(query, count);
    if (images.length > 0) {
      return {
        urls: images.map((img) => img.thumb_url),
        sources: images.map((img) => img.source_url),
      };
    }
  }

  return { urls: [], sources: [] };
}

/**
 * Busca imágenes de referencia para TODOS los photo_concepts de un spot.
 * Devuelve un mapa: índice del concepto → { urls, sources }.
 */
export async function getAllPoseImagesFromWikimedia(
  spot: CuratedSpot,
  cityHint?: string,
  count = 3,
): Promise<Record<number, { urls: string[]; sources: string[] }>> {
  const result: Record<number, { urls: string[]; sources: string[] }> = {};
  if (!spot.photo_concepts || spot.photo_concepts.length === 0) return result;

  // Buscar en paralelo para todos los conceptos
  const searches = spot.photo_concepts.map(async (concept, i) => {
    const poseResult = await getPoseImagesFromWikimedia(spot, concept.title, cityHint, count);
    if (poseResult.urls.length > 0) {
      return [i, poseResult] as const;
    }
    return null;
  });

  const settled = await Promise.allSettled(searches);
  for (const s of settled) {
    if (s.status === "fulfilled" && s.value !== null) {
      const [idx, poseResult] = s.value;
      result[idx] = poseResult;
    }
  }

  return result;
}
