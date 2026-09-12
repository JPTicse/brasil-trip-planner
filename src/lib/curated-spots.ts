// Unificador de spots curados por ciudad/país.
// Importa los arrays de cada archivo y los mapea a nombres de ciudad normalizados.

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

// Normaliza un nombre de ciudad para buscar en el mapa
function normalizeCity(city: string): string {
  return city
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Devuelve los spots curados para una ciudad, o array vacío si no hay
export function getCuratedSpotsForCity(city: string): CuratedSpot[] {
  const normalized = normalizeCity(city);

  // Buscar match exacto
  if (CITY_MAP[normalized]) return CITY_MAP[normalized];

  // Buscar match parcial (la ciudad contiene una clave o viceversa)
  for (const key of Object.keys(CITY_MAP)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return CITY_MAP[key];
    }
  }

  return [];
}

// Lista de todas las ciudades soportadas (para debugging/UI)
export const SUPPORTED_CITIES = Object.keys(CITY_MAP);
