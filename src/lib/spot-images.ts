import type { CuratedSpot } from "@/lib/photo-types";

export function getSpotImageUrls(spot: CuratedSpot, _cityHint?: string): string[] {
  return spot.image_urls ?? [];
}

export function getSpotKeywords(spot: CuratedSpot, cityHint?: string): string[] {
  return Array.from(
    new Set(
      [spot.name, spot.name_en, spot.category, cityHint].filter(Boolean) as string[],
    ),
  );
}
