"use client";

import { useState } from "react";

const PROXIED_HOSTS = [
  "images.pexels.com",
  "live.staticflickr.com",
  "api.openverse.org",
  "upload.wikimedia.org",
  "thumb.wikimedia.org",
  "commons.wikimedia.org",
  "images.unsplash.com",
];

function getDisplayUrl(src: string): string | null {
  if (src.startsWith("/api/image-proxy")) return src;

  try {
    const url = new URL(src);
    if (url.hostname === "maps.googleapis.com") return null;
    if (PROXIED_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      return `/api/image-proxy?url=${encodeURIComponent(src)}`;
    }
    return src;
  } catch {
    return null;
  }
}

export function ActivityImage({
  src,
  alt,
  className,
  loading = "lazy",
}: {
  src: string | null | undefined;
  alt: string;
  className?: string;
  loading?: "eager" | "lazy";
}) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (!src || failedSrc === src) return null;

  const displayUrl = getDisplayUrl(src);
  if (!displayUrl) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={displayUrl}
      alt={alt}
      className={className}
      loading={loading}
      onError={() => setFailedSrc(src)}
    />
  );
}
