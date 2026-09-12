// Unificador de spots curados por ciudad/país.
// Prioriza SIEMPRE la ciudad del viaje. El fallback por país es último recurso.

import type { CuratedSpot } from "@/lib/curated-spots-rio";
import { CURATED_SPOTS_RIO } from "@/lib/curated-spots-rio";
import { CURATED_SPOTS_SP } from "@/lib/curated-spots-sp";
import {
  CURATED_SPOTS_SALVADOR,
  CURATED_SPOTS_RECIFE,
  CURATED_SPOTS_FORTALEZA,
  CURATED_SPOTS_JERICOACOARA,
} from "@/lib/curated-spots-northeast";
import {
  CURATED_SPOTS_FLORIANOPOLIS,
  CURATED_SPOTS_BALNEARIO,
  CURATED_SPOTS_SERRA_GAUCHA,
} from "@/lib/curated-spots-south";
import {
  CURATED_SPOTS_BUENOS_AIRES,
  CURATED_SPOTS_CARTAGENA,
  CURATED_SPOTS_BOGOTA,
  CURATED_SPOTS_LIMA,
  CURATED_SPOTS_SANTIAGO,
  CURATED_SPOTS_CUSCO,
} from "@/lib/curated-spots-latam";

export type { CuratedSpot };

// Mapa: nombre de ciudad normalizado (lowercase, sin acentos) → spots curados
const CITY_MAP: Record<string, CuratedSpot[]> = {
  // Brasil — Rio
  "rio de janeiro": CURATED_SPOTS_RIO,
  rio: CURATED_SPOTS_RIO,

  // Brasil — São Paulo
  "sao paulo": CURATED_SPOTS_SP,

  // Brasil — Nordeste
  salvador: CURATED_SPOTS_SALVADOR,
  "salvador da bahia": CURATED_SPOTS_SALVADOR,
  recife: CURATED_SPOTS_RECIFE,
  fortaleza: CURATED_SPOTS_FORTALEZA,
  jericoacoara: CURATED_SPOTS_JERICOACOARA,
  jeri: CURATED_SPOTS_JERICOACOARA,

  // Brasil — Sur
  florianopolis: CURATED_SPOTS_FLORIANOPOLIS,
  floripa: CURATED_SPOTS_FLORIANOPOLIS,
  "balneario camboriu": CURATED_SPOTS_BALNEARIO,
  gramado: CURATED_SPOTS_SERRA_GAUCHA,
  canela: CURATED_SPOTS_SERRA_GAUCHA,
  "serra gaucha": CURATED_SPOTS_SERRA_GAUCHA,

  // Latinoamérica
  "buenos aires": CURATED_SPOTS_BUENOS_AIRES,
  cartagena: CURATED_SPOTS_CARTAGENA,
  bogota: CURATED_SPOTS_BOGOTA,
  lima: CURATED_SPOTS_LIMA,
  santiago: CURATED_SPOTS_SANTIAGO,
  cusco: CURATED_SPOTS_CUSCO,
  "machu picchu": CURATED_SPOTS_CUSCO,
};

// Mapa de país → spots (SOLO si la ciudad no coincide pero el país sí)
const COUNTRY_MAP: Record<string, CuratedSpot[]> = {
  brasil: CURATED_SPOTS_RIO, // Brasil → Rio como representante
  brazil: CURATED_SPOTS_RIO,
  argentina: CURATED_SPOTS_BUENOS_AIRES,
  colombia: CURATED_SPOTS_CARTAGENA,
  chile: CURATED_SPOTS_SANTIAGO,
  peru: CURATED_SPOTS_LIMA,
};

// Normaliza un nombre para buscar
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * Devuelve los spots curados para una ciudad.
 *
 * Prioridad:
 * 1. Match exacto de ciudad
 * 2. Match parcial de ciudad (la ciudad contiene una clave o viceversa)
 * 3. Match de país (solo si la ciudad no coincide)
 * 4. Fallback: Lima, Perú (destino por defecto de la app)
 */
export function getCuratedSpotsForCity(city: string): CuratedSpot[] {
  const normalized = normalize(city);

  // 1. Match exacto de ciudad
  if (CITY_MAP[normalized]) return CITY_MAP[normalized];

  // 2. Match parcial de ciudad
  for (const key of Object.keys(CITY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CITY_MAP[key];
    }
  }

  // 3. Match de país (último recurso antes del fallback)
  if (COUNTRY_MAP[normalized]) return COUNTRY_MAP[normalized];
  for (const key of Object.keys(COUNTRY_MAP)) {
    if (normalized.includes(key)) {
      return COUNTRY_MAP[key];
    }
  }

  // 4. Fallback: Lima, Perú
  return CURATED_SPOTS_LIMA;
}

// Lista de todas las ciudades soportadas
export const SUPPORTED_CITIES = Object.keys(CITY_MAP);
