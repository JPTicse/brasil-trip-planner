import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Allowlist of permitted external domains
const ALLOWED_DOMAINS = [
  "live.staticflickr.com",
  "farm1.staticflickr.com",
  "farm2.staticflickr.com",
  "farm3.staticflickr.com",
  "farm4.staticflickr.com",
  "farm5.staticflickr.com",
  "farm6.staticflickr.com",
  "farm7.staticflickr.com",
  "farm8.staticflickr.com",
  "farm9.staticflickr.com",
  "upload.wikimedia.org",
  "commons.wikimedia.org",
  "images.pexels.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
];

function isAllowedUrl(urlStr: string): boolean {
  try {
    const parsed = new URL(urlStr);
    if (!["http:", "https:"].includes(parsed.protocol)) return false;
    return ALLOWED_DOMAINS.some(
      (domain) =>
        parsed.hostname === domain ||
        parsed.hostname.endsWith("." + domain),
    );
  } catch {
    return false;
  }
}

/**
 * GET /api/image-proxy?url=...
 *
 * Proxy server-side de imágenes para evitar:
 * - Hotlinking bloqueado (403)
 * - CORS issues
 * - Referer checks
 *
 * Cachea en edge con CDN-Cache-Control.
 * 100% gratis: solo usa function invocations (1M/mes en Vercel Hobby).
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json(
      { error: "Missing url parameter" },
      { status: 400 },
    );
  }
  if (!isAllowedUrl(url)) {
    return NextResponse.json(
      { error: "Domain not allowed" },
      { status: 403 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8000);

  try {
    const response = await fetch(url, {
      redirect: "follow",
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        Referer: new URL(url).origin + "/",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status },
      );
    }

    const contentType = response.headers.get("content-type") || "image/jpeg";

    // Stream the response body (zero-copy)
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "CDN-Cache-Control":
          "public, max-age=86400, stale-while-revalidate=604800",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      return NextResponse.json({ error: "Request timeout" }, { status: 504 });
    }
    return NextResponse.json(
      { error: "Failed to proxy image" },
      { status: 500 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
