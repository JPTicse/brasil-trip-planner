// Generador de URLs de imágenes reales para spots curados.
// Usa Unsplash Source (fotos reales por keywords) y algunas URLs fijas de Wikimedia para landmarks icónicos.
// El objetivo es que las cards se vean como ChatGPT: con fotos reales del lugar, no emojis gigantes.

import type { CuratedSpot } from "@/lib/photo-types";

// URLs fijas de alta calidad para landmarks muy reconocidos (Wikimedia Commons)
const FIXED_IMAGES: Record<string, string[]> = {
  "Cristo Redentor": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/4/47/Cristo_Redentor_Rio_de_Janeiro.jpg/800px-Cristo_Redentor_Rio_de_Janeiro.jpg",
    "https://images.unsplash.com/photo-1593995863951-57c27f47b429?w=800&q=80",
  ],
  "Pão de Açúcar": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/Sugarloaf_Mountain_Rio_de_Janeiro.jpg/800px-Sugarloaf_Mountain_Rio_de_Janeiro.jpg",
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
  ],
  "Copacabana": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/7/77/Copacabana_beach_Rio_de_Janeiro.jpg/800px-Copacabana_beach_Rio_de_Janeiro.jpg",
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
  ],
  "Ipanema": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/0/0b/Ipanema_Beach_Rio_de_Janeiro.jpg/800px-Ipanema_Beach_Rio_de_Janeiro.jpg",
    "https://images.unsplash.com/photo-1593995863951-57c27f47b429?w=800&q=80",
  ],
  "Escadaria Selarón": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/Escadaria_Selaron.jpg/800px-Escadaria_Selaron.jpg",
    "https://images.unsplash.com/photo-1593995863951-57c27f47b429?w=800&q=80",
  ],
  "Maracanã": [
    "https://upload.wikimedia.org/wikipedia/commons/thumb/6/6f/Maracana_2022.jpg/800px-Maracana_2022.jpg",
  ],
  "Parque Lage": [
    "https://images.unsplash.com/photo-1593995863951-57c27f47b429?w=800&q=80",
  ],
  "Jardim Botânico": [
    "https://images.unsplash.com/photo-1543051932-6ef9fecfbc80?w=800&q=80",
  ],
  "Mirante Dona Marta": [
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
  ],
  "Arpoador": [
    "https://images.unsplash.com/photo-1483729558449-99ef09a8c325?w=800&q=80",
  ],
};

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]/g, " ");
}

function findFixedImages(name: string): string[] | null {
  for (const [key, urls] of Object.entries(FIXED_IMAGES)) {
    const normalizedKey = normalizeKey(key);
    const normalizedName = normalizeKey(name);
    if (normalizedName.includes(normalizedKey) || normalizedKey.includes(normalizedName)) {
      return urls;
    }
  }
  return null;
}

/**
 * Devuelve URLs de imágenes reales para un spot curado.
 * Orden de preferencia:
 * 1. image_urls explícitos en el spot
 * 2. Imágenes fijas de landmarks icónicos
 */
export function getSpotImageUrls(spot: CuratedSpot, _cityHint?: string): string[] {
  if (spot.image_urls && spot.image_urls.length > 0) {
    return spot.image_urls;
  }

  const fixed = findFixedImages(spot.name);
  if (fixed && fixed.length > 0) {
    return fixed;
  }

  return [];
}

/**
 * Genera un collage de keywords para búsquedas más específicas.
 */
export function getSpotKeywords(spot: CuratedSpot, cityHint?: string): string[] {
  return Array.from(
    new Set(
      [spot.name, spot.name_en, spot.category, cityHint].filter(Boolean) as string[],
    ),
  );
}
