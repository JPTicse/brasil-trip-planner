import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type ImageResult = {
  url: string;
  source_url: string;
  source_name: string;
  license: string;
  width: number;
  height: number;
  alt?: string; // descripción de la foto (alt text de Pexels, title de Openverse)
};

/**
 * Busca imágenes en Openverse (Creative Commons, Flickr, Wikimedia, etc.).
 * No requiere API key. 100% gratis.
 *
 * Usa boolean queries de Elasticsearch:
 *   | = OR, + = AND (URL-encoded %2B), - = NOT, "" = exact phrase
 * Filtros: category=photograph, source=flickr, aspect_ratio=tall
 */
async function searchOpenverse(
  query: string,
  count: number,
  options: { peopleFocus?: boolean; source?: string } = {},
): Promise<ImageResult[]> {
  try {
    const url = new URL("https://api.openverse.org/v1/images/");
    url.searchParams.set("q", query);
    url.searchParams.set("page_size", String(Math.min(count, 20)));
    url.searchParams.set("license_type", "all");
    url.searchParams.set("mature", "false");
    url.searchParams.set("category", "photograph");
    url.searchParams.set("filter_dead", "true");

    if (options.source) {
      url.searchParams.set("source", options.source);
    }

    // Para poses: preferir fotos portrait (más likely de contener personas)
    if (options.peopleFocus) {
      url.searchParams.set("aspect_ratio", "tall,square");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    const results: ImageResult[] = [];

    for (const r of (data.results ?? []) as any[]) {
      // Usar SOLO thumbnail (hosteado por Openverse, diseñado para hotlinking)
      // Si no hay thumbnail, skip — los URLs directos de providers (Wikimedia/Flickr)
      // suelen estar rotos o bloquean hotlinking
      const imgUrl = r.thumbnail;
      if (!imgUrl) continue;
      results.push({
        url: imgUrl,
        source_url: r.foreign_landing_url ?? "",
        source_name: r.source ?? r.provider ?? "openverse",
        license: r.license ?? "unknown",
        width: r.width ?? 800,
        height: r.height ?? 600,
        alt: r.title ?? "", // título de la foto en Openverse
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Busca imágenes en Pexels (gratis, requiere API key opcional).
 * Si no hay key, se salta silenciosamente.
 */
async function searchPexels(query: string, count: number, peopleFocus = false): Promise<ImageResult[]> {
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return [];

  try {
    const url = new URL("https://api.pexels.com/v1/search");
    url.searchParams.set("query", query);
    url.searchParams.set("per_page", String(Math.min(count, 80)));
    url.searchParams.set("locale", "en-US");
    // Para poses: orientación portrait (las fotos de personas suelen ser verticales)
    if (peopleFocus) {
      url.searchParams.set("orientation", "portrait");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    const results: ImageResult[] = [];

    // Términos que indican que la foto tiene personas (no solo paisaje/monumento)
    const PEOPLE_TERMS = /\b(person|people|woman|man|tourist|posing|crowd|selfie|smiling|standing|wearing|portrait)\b/i;

    for (const photo of (data.photos ?? []) as any[]) {
      // Para poses: usar portrait (800x1200); para places: large (940x650)
      const imgUrl = peopleFocus ? (photo.src?.portrait ?? photo.src?.large) : (photo.src?.large ?? photo.src?.portrait);
      if (!imgUrl) continue;

      const alt = photo.alt ?? "";

      // Para poses: filtrar fotos que no mencionan personas en el alt text
      // Esto evita que fotos de monumentos vacíos aparezcan como referencias de pose
      if (peopleFocus && alt && !PEOPLE_TERMS.test(alt)) continue;

      results.push({
        url: imgUrl,
        source_url: photo.url ?? "",
        source_name: "pexels",
        license: "pexels",
        width: photo.width ?? 800,
        height: photo.height ?? 600,
        alt: alt, // descripción de la foto generada por Pexels
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * Busca imágenes en Wikimedia Commons.
 * No requiere API key. 100% gratis.
 */
async function searchWikimedia(query: string, count: number): Promise<ImageResult[]> {
  try {
    const url = new URL("https://commons.wikimedia.org/w/api.php");
    url.searchParams.set("action", "query");
    url.searchParams.set("format", "json");
    url.searchParams.set("origin", "*");
    url.searchParams.set("generator", "search");
    url.searchParams.set("gsrsearch", query);
    url.searchParams.set("gsrnamespace", "6");
    url.searchParams.set("gsrlimit", String(count));
    url.searchParams.set("prop", "imageinfo");
    url.searchParams.set("iiprop", "url|mime|size");
    url.searchParams.set("iiurlwidth", "800");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) return [];

    const data = await res.json();
    const pages = data.query?.pages;
    if (!pages) return [];

    const results: ImageResult[] = [];
    for (const page of Object.values<any>(pages)) {
      const info = page.imageinfo?.[0];
      if (!info) continue;
      const mime = info.mime ?? "";
      if (!mime.startsWith("image/")) continue;
      if (mime.includes("svg") || mime.includes("gif")) continue;

      results.push({
        url: info.thumburl ?? info.url,
        source_url: info.descriptionurl ?? "",
        source_name: "wikimedia",
        license: "cc",
        width: info.thumbwidth ?? info.width ?? 800,
        height: info.thumbheight ?? info.height ?? 600,
      });
    }

    return results;
  } catch {
    return [];
  }
}

/**
 * GET /api/pose-search?q=...&type=place|pose&count=...
 *
 * type=place: busca fotos del LUGAR (paisajes, arquitectura, sin foco en personas)
 * type=pose: busca fotos de PERSONAS en poses (turistas, viajeros, gente posando)
 *
 * Fuentes (100% gratis):
 * - Openverse: sin key, boolean queries, category=photograph
 * - Pexels: opcional con PEXELS_API_KEY (gratis, 200 req/hr)
 * - Wikimedia: sin key
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") ?? "place";
  const count = Math.min(Number(searchParams.get("count") ?? "5"), 15);

  if (!query) {
    return NextResponse.json({ results: [], cached: false });
  }

  const isPose = type === "pose";

  // Construir queries optimizadas según el tipo
  // Openverse usa Elasticsearch simple_query_string:
  //   | = OR, + = AND (%2B), - = NOT, "" = exact phrase
  let openverseQuery: string;
  let pexelsQuery: string;
  let wikiQuery: string;

  if (isPose) {
    // POSE: buscar fotos con personas en el lugar
    // Pexels: "[name_en] people" — "people" es tag común en Pexels, devuelve fotos con personas
    // NO usar "tourist posing" — demasiado específico, devuelve monumentos vacíos
    // NO usar nombre en portugués — Pexels indexa en inglés
    pexelsQuery = `${query} people`;
    // Openverse: NO usar para poses — devuelve paisajes sin personas
    // Openverse no tiene fotos tagged con "people/tourist"
    openverseQuery = "";
  } else {
    // PLACE: buscar fotos del lugar (paisaje, arquitectura)
    openverseQuery = query;
    pexelsQuery = query;
  }

  // Buscar en Openverse y Pexels.
  // IMPORTANTE: Openverse anónimo tiene rate limit de 1 req/sec.
  // Hacemos los requests Openverse SECUENCIALMENTE (no paralelos) para evitar 429.
  // Pexels sí va en paralelo con el segundo request Openverse.
  const pexelsPromise = searchPexels(pexelsQuery, count, isPose);

  let ovFlickr: ImageResult[] = [];
  let ovAll: ImageResult[] = [];

  if (openverseQuery) {
    // Primer request Openverse: Flickr (para poses) o sin filtro (para places)
    ovFlickr = await searchOpenverse(openverseQuery, count, {
      peopleFocus: isPose,
      source: isPose ? "flickr" : undefined,
    });

    // Segundo request Openverse: sin filtro de source (incluye Wikimedia via aggregator)
    // Va en paralelo con Pexels (que ya está corriendo)
    [ovAll] = await Promise.all([
      searchOpenverse(openverseQuery, count, { peopleFocus: isPose }),
      pexelsPromise,
    ]);
  }

  const pexelsResults = openverseQuery ? (await pexelsPromise) : (await pexelsPromise);

  // Combinar resultados, deduplicar por URL
  // Orden de prioridad: Pexels (curated) > Flickr (Openverse) > Openverse all
  const seen = new Set<string>();
  const combined: ImageResult[] = [];

  const allResults = [...pexelsResults, ...ovFlickr, ...ovAll];

  for (const r of allResults) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    combined.push(r);
    if (combined.length >= count) break;
  }

  // Si no hay suficientes resultados de Pexels, NO usar Openverse como fallback para poses
  // (Openverse devuelve paisajes sin personas, que no sirven como referencias de pose)
  // El fallback de Pollinations AI se maneja en places-client.ts

  return NextResponse.json({
    results: combined.slice(0, count),
    cached: false,
  });
}
