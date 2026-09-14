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
};

/**
 * Busca imágenes en Openverse (Creative Commons, Flickr, Wikimedia, etc.).
 * No requiere API key. 100% gratis.
 */
async function searchOpenverse(query: string, count: number): Promise<ImageResult[]> {
  try {
    const url = new URL("https://api.openverse.org/v1/images/");
    url.searchParams.set("q", query);
    url.searchParams.set("page_size", String(count));
    url.searchParams.set("license_type", "all");
    url.searchParams.set("mature", "false");

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

    if (!res.ok) return [];

    const data = await res.json();
    const results: ImageResult[] = [];

    for (const r of (data.results ?? []) as any[]) {
      if (!r.url) continue;
      results.push({
        url: r.url,
        source_url: r.foreign_landing_url ?? "",
        source_name: r.source ?? r.provider ?? "openverse",
        license: r.license ?? "unknown",
        width: r.width ?? 800,
        height: r.height ?? 600,
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

    const res = await fetch(url.toString(), {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });

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
 * Busca imágenes reales usando Openverse + Wikimedia.
 * Server-side: sin CORS, sin hotlinking, sin exponer keys.
 * 100% gratis: Openverse no requiere key, Wikimedia no requiere key.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");
  const type = searchParams.get("type") ?? "place"; // "place" o "pose"
  const count = Math.min(Number(searchParams.get("count") ?? "5"), 10);

  if (!query) {
    return NextResponse.json({ results: [], cached: false });
  }

  // Construir múltiples queries para maximizar resultados
  const queries: string[] = [query];

  if (type === "pose") {
    // Para poses: añadir términos que favorezcan fotos con personas
    queries.push(`${query} person tourist`);
    queries.push(`${query} people photo`);
  } else {
    // Para lugares: queries más amplias
    queries.push(`${query} photo`);
    queries.push(`${query} travel`);
  }

  // Buscar en paralelo en ambas fuentes con la primera query
  const [openverseResults, wikiResults] = await Promise.all([
    searchOpenverse(queries[0], count),
    searchWikimedia(queries[0], count),
  ]);

  // Combinar resultados, deduplicar por URL
  const seen = new Set<string>();
  const combined: ImageResult[] = [];

  for (const r of [...openverseResults, ...wikiResults]) {
    if (seen.has(r.url)) continue;
    seen.add(r.url);
    combined.push(r);
    if (combined.length >= count) break;
  }

  // Si no hay suficientes, intentar con queries alternativas
  if (combined.length < count) {
    for (const altQuery of queries.slice(1)) {
      if (combined.length >= count) break;
      const [altOv, altWiki] = await Promise.all([
        searchOpenverse(altQuery, count - combined.length),
        searchWikimedia(altQuery, count - combined.length),
      ]);
      for (const r of [...altOv, ...altWiki]) {
        if (seen.has(r.url)) continue;
        seen.add(r.url);
        combined.push(r);
        if (combined.length >= count) break;
      }
    }
  }

  return NextResponse.json({
    results: combined.slice(0, count),
    cached: false,
  });
}
