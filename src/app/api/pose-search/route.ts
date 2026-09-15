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
  pose?: string;
  camera_angle?: string;
  camera_tip?: string;
  best_time?: string;
  why_it_works?: string;
  analysis_url?: string;
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
        analysis_url: r.thumbnail,
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
  if (!apiKey) {
    console.error("[pose-search] PEXELS_API_KEY no configurada");
    return [];
  }

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
    const timeout = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url.toString(), {
      headers: {
        Authorization: apiKey,
        Accept: "application/json",
      },
      cache: "no-store",
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!res.ok) {
      console.error(`[pose-search] Pexels API error: ${res.status} ${res.statusText} for query: "${query}"`);
      return [];
    }

    const data = await res.json();
    const results: ImageResult[] = [];

    // Términos que indican que la foto tiene personas (no solo paisaje/monumento)
    // Usar \b(person|people|woman|man|tourist|posing|crowd|selfie|smiling|standing|wearing|portrait)\b
    // Nota: \btourist\b NO matchea "tourists" (plural) — usar \b(tourist|tourists)\b o simplemente tourist sin \b final
    const PEOPLE_TERMS = /\b(person|people|woman|women|man|men|tourist|tourists|posing|crowd|crowds|selfie|smiling|standing|wearing|portrait)\b/i;

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
        analysis_url: photo.src?.medium ?? photo.src?.small ?? imgUrl,
      });
    }

    console.log(`[pose-search] Pexels query "${query}" returned ${results.length} results (after people filter)`);
    return results;
  } catch (err) {
    console.error(`[pose-search] Pexels fetch failed for query "${query}":`, err instanceof Error ? err.message : err);
    return [];
  }
}

async function searchGoogleImages(query: string, count: number): Promise<ImageResult[]> {
  const apiKey =
    process.env.GOOGLE_CSE_API_KEY ??
    process.env.NEXT_PUBLIC_GOOGLE_CSE_API_KEY;
  const cseId = process.env.GOOGLE_CSE_ID ?? process.env.NEXT_PUBLIC_GOOGLE_CSE_ID;
  if (!apiKey || !cseId) return [];

  try {
    const url = new URL("https://www.googleapis.com/customsearch/v1");
    url.searchParams.set("key", apiKey);
    url.searchParams.set("cx", cseId);
    url.searchParams.set("q", `"${query}" tourist posing travel photo`);
    url.searchParams.set("searchType", "image");
    url.searchParams.set("num", String(Math.min(count, 10)));
    url.searchParams.set("safe", "active");
    url.searchParams.set("imgType", "photo");
    url.searchParams.set("imgSize", "large");

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(10000),
    });
    if (!response.ok) {
      console.error(`[pose-search] Google CSE error: ${response.status} ${response.statusText}`);
      return [];
    }

    const payload = await response.json();
    return (payload.items ?? [])
      .filter((item: { image?: { thumbnailLink?: string; contextLink?: string } }) =>
        Boolean(item.image?.thumbnailLink && item.image?.contextLink),
      )
      .map((item: {
        title?: string;
        displayLink?: string;
        image: {
          thumbnailLink: string;
          contextLink: string;
          width?: number;
          height?: number;
        };
      }) => ({
        url: item.image.thumbnailLink,
        source_url: item.image.contextLink,
        source_name: item.displayLink ?? "google",
        license: "source",
        width: item.image.width ?? 800,
        height: item.image.height ?? 600,
        alt: item.title ?? "",
        analysis_url: item.image.thumbnailLink,
      }));
  } catch (error) {
    console.error("[pose-search] Google CSE search failed:", error instanceof Error ? error.message : error);
    return [];
  }
}

type VisionScore = {
  index: number;
  score: number;
  person_visible: boolean;
  deliberate_pose: boolean;
  landmark_visible: boolean;
  real_photo: boolean;
  recommended_pose_reference: boolean;
  person_prominence: number;
  pose_reproducibility: number;
  landmark_confidence: number;
  visual_quality: number;
  description: string;
  pose_instruction: string;
  camera_angle: string;
  camera_tip: string;
  best_time: string;
  why_it_works: string;
};

function heuristicRank(candidates: ImageResult[], landmark: string, count: number): ImageResult[] {
  const poseTerms = /\b(posing|pose|selfie|smiling|standing|sitting|leaning|arms?|portrait)\b/i;
  const crowdTerms = /\b(crowd|crowds|onlookers|gathered|bustling)\b/i;
  const personTerms = /\b(person|people|woman|women|man|men|tourist|tourists|traveler|traveller)\b/i;
  const landmarkTerms = landmark.toLowerCase().split(/\s+/).filter((term) => term.length > 3);

  return candidates
    .map((candidate) => {
      const alt = candidate.alt ?? "";
      const matches = landmarkTerms.filter((term) => alt.toLowerCase().includes(term)).length;
      const score =
        (personTerms.test(alt) ? 30 : 0) +
        (poseTerms.test(alt) ? 35 : 0) +
        (crowdTerms.test(alt) ? -35 : 0) +
        Math.min(matches * 10, 30) +
        (candidate.height >= candidate.width ? 5 : 0);
      return { candidate, score };
    })
    .filter(({ score }) => score >= 50)
    .sort((a, b) => b.score - a.score)
    .slice(0, count)
    .map(({ candidate }) => candidate);
}

async function rankPoseImages(
  candidates: ImageResult[],
  landmark: string,
  destination: string,
  count: number,
): Promise<ImageResult[]> {
  const apiKey = process.env.GEMINI_API_KEY;
  const fallback = () => heuristicRank(candidates, landmark, count);
  if (!apiKey) return fallback();
  if (candidates.length === 0) return [];

  const selected = candidates.slice(0, 12);
  const imageParts = await Promise.all(
    selected.map(async (candidate, index) => {
      try {
        const response = await fetch(candidate.analysis_url ?? candidate.url, {
          cache: "no-store",
          signal: AbortSignal.timeout(6000),
        });
        const mimeType = response.headers.get("content-type")?.split(";")[0] ?? "";
        if (!response.ok || !mimeType.startsWith("image/")) return null;
        const bytes = Buffer.from(await response.arrayBuffer());
        if (bytes.length > 2_500_000) return null;
        return [
          { text: `IMAGE ${index}` },
          { inlineData: { mimeType, data: bytes.toString("base64") } },
        ];
      } catch {
        return null;
      }
    }),
  );

  const parts = imageParts.flatMap((part) => part ?? []);
  if (parts.length === 0) return [];

  const prompt = [
    `Evaluate these real internet photos as pose references for ${landmark}${destination ? ` in ${destination}` : ""}.`,
    "Score each IMAGE from 0 to 100 and be extremely strict.",
    "A valid reference must be a real photograph, show one person or a small group clearly as the main subject, show an intentional staged pose that another traveler can reproduce, and visibly show the requested landmark.",
    "Walking, sightseeing, sitting casually, sports, vendors, distant silhouettes, ordinary beach scenes, benches, and crowds are not deliberate poses.",
    "recommended_pose_reference must be true only for an attractive, safe, social-media-ready pose that a traveler could intentionally recreate from public visitor areas.",
    "Set recommended_pose_reference to false for insects, gimmicks, people on or inside monuments, close-up hands, casual walking or sitting, crowds, dangerous access, or unclear compositions.",
    "Reject architecture-only photos, distant crowds, unrelated city photos, AI-generated images, and photos where either the person or landmark is unclear.",
    "person_prominence measures how clearly the posing person dominates the composition. pose_reproducibility measures how useful and intentional the pose is. landmark_confidence measures certainty that the requested landmark is visible. visual_quality measures sharpness and composition.",
    "For valid references, write concise Spanish guidance: pose_instruction, camera_angle, camera_tip, best_time, and why_it_works. Base every detail on what is visible; do not invent hidden details.",
    "Return a JSON array only with every requested field and a short factual Spanish description of what is visibly happening.",
  ].join(" ");

  try {
    const model = process.env.GEMINI_VISION_MODEL ?? "gemini-3.5-flash-lite";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(apiKey)}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }, ...parts] }],
          generationConfig: {
            temperature: 0,
            responseMimeType: "application/json",
            responseSchema: {
              type: "ARRAY",
              items: {
                type: "OBJECT",
                properties: {
                  index: { type: "INTEGER" },
                  score: { type: "INTEGER" },
                  person_visible: { type: "BOOLEAN" },
                  deliberate_pose: { type: "BOOLEAN" },
                  landmark_visible: { type: "BOOLEAN" },
                  real_photo: { type: "BOOLEAN" },
                  recommended_pose_reference: { type: "BOOLEAN" },
                  person_prominence: { type: "INTEGER" },
                  pose_reproducibility: { type: "INTEGER" },
                  landmark_confidence: { type: "INTEGER" },
                  visual_quality: { type: "INTEGER" },
                  description: { type: "STRING" },
                  pose_instruction: { type: "STRING" },
                  camera_angle: { type: "STRING" },
                  camera_tip: { type: "STRING" },
                  best_time: { type: "STRING" },
                  why_it_works: { type: "STRING" },
                },
                required: [
                  "index",
                  "score",
                  "person_visible",
                  "deliberate_pose",
                  "landmark_visible",
                  "real_photo",
                  "recommended_pose_reference",
                  "person_prominence",
                  "pose_reproducibility",
                  "landmark_confidence",
                  "visual_quality",
                  "description",
                  "pose_instruction",
                  "camera_angle",
                  "camera_tip",
                  "best_time",
                  "why_it_works",
                ],
              },
            },
          },
        }),
        cache: "no-store",
        signal: AbortSignal.timeout(30000),
      },
    );
    if (!response.ok) {
      console.error(`[pose-search] Gemini vision error: ${response.status} ${response.statusText}`);
      return [];
    }

    const payload = await response.json();
    const text = payload.candidates?.[0]?.content?.parts?.find((part: { text?: string }) => part.text)?.text;
    if (!text) return [];

    const scores = JSON.parse(text) as VisionScore[];
    return scores
      .filter(
        (item) =>
          Number.isInteger(item.index) &&
          item.index >= 0 &&
          item.index < selected.length &&
          item.score >= 40 &&
          item.person_visible &&
          item.deliberate_pose &&
          item.landmark_visible &&
          item.real_photo,
      )
      .sort((a, b) => b.score - a.score)
      .slice(0, count)
      .map((item) => ({
        ...selected[item.index],
        alt: item.description || selected[item.index].alt,
        pose: item.pose_instruction,
        camera_angle: item.camera_angle,
        camera_tip: item.camera_tip,
        best_time: item.best_time,
        why_it_works: item.why_it_works,
        analysis_url: undefined,
      }));
  } catch (error) {
    console.error("[pose-search] Gemini vision ranking failed:", error instanceof Error ? error.message : error);
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
  const destination = searchParams.get("destination") ?? "";

  // Construir queries optimizadas según el tipo
  // Openverse usa Elasticsearch simple_query_string:
  //   | = OR, + = AND (%2B), - = NOT, "" = exact phrase
  if (isPose) {
    const [googleImages, pexelsWomen, pexelsMen, pexelsTourists, pexelsPeople, openverse] = await Promise.all([
      searchGoogleImages(query, 10),
      searchPexels(`woman posing ${query}`, 20, true),
      searchPexels(`man posing ${query}`, 20, true),
      searchPexels(`tourist posing ${query}`, 20, true),
      searchPexels(`${query} people`, 20, true),
      searchOpenverse(query, 20, { peopleFocus: true, source: "flickr" }),
    ]);
    const seen = new Set<string>();
    const candidates = Array.from(
      {
        length: Math.max(
          googleImages.length,
          pexelsWomen.length,
          pexelsMen.length,
          pexelsTourists.length,
          pexelsPeople.length,
          openverse.length,
        ),
      },
      (_, index) => [
        googleImages[index],
        pexelsWomen[index],
        pexelsMen[index],
        pexelsTourists[index],
        pexelsPeople[index],
        openverse[index],
      ],
    )
      .flat()
      .filter((candidate): candidate is ImageResult => Boolean(candidate))
      .filter((candidate) => {
        if (seen.has(candidate.url)) return false;
        seen.add(candidate.url);
        return true;
      });
    const results = await rankPoseImages(candidates, query, destination, count);
    return NextResponse.json({
      results: results.map((result) => ({ ...result, analysis_url: undefined })),
      cached: false,
      ranked_by_vision: Boolean(process.env.GEMINI_API_KEY),
    });
  }

  // Buscar en Openverse y Pexels.
  // IMPORTANTE: Openverse anónimo tiene rate limit de 1 req/sec.
  // Hacemos los requests Openverse SECUENCIALMENTE (no paralelos) para evitar 429.
  // Pexels sí va en paralelo con el segundo request Openverse.
  const pexelsPromise = searchPexels(query, count);

  // Primer request Openverse: Flickr (para poses) o sin filtro (para places)
  const ovFlickr = await searchOpenverse(query, count);

  // Segundo request Openverse: sin filtro de source (incluye Wikimedia via aggregator)
  // Va en paralelo con Pexels (que ya está corriendo)
  const [ovAll, pexelsResults] = await Promise.all([
    searchOpenverse(query, count),
    pexelsPromise,
  ]);

  // Combinar resultados, deduplicar por URL
  // Orden de prioridad: Pexels (curated) > Flickr (Openverse) > Openverse all
  const seen = new Set<string>();
  const combined: ImageResult[] = [];

  const allResults = [...pexelsResults, ...ovFlickr, ...ovAll];

  for (const result of allResults) {
    if (seen.has(result.url)) continue;
    seen.add(result.url);
    combined.push({ ...result, analysis_url: undefined });
    if (combined.length >= count) break;
  }

  return NextResponse.json({
    results: combined.slice(0, count),
    cached: false,
  });
}
