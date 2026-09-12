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

// "Lo mejor de Brasil" — top spots de varias ciudades brasileñas
const BEST_OF_BRAZIL: CuratedSpot[] = [
  // Top 10 de Rio
  ...CURATED_SPOTS_RIO.slice(0, 10),
  // Top 5 de SP
  ...CURATED_SPOTS_SP.slice(0, 5),
  // Top 3 de Salvador
  ...CURATED_SPOTS_SALVADOR.slice(0, 3),
  // Top 3 de Florianópolis
  ...CURATED_SPOTS_FLORIANOPOLIS.slice(0, 3),
  // Top 3 de Jericoacoara
  ...CURATED_SPOTS_JERICOACOARA.slice(0, 3),
];

// "Lo mejor de Latinoamérica" — top spots de varias ciudades
const BEST_OF_LATAM: CuratedSpot[] = [
  ...CURATED_SPOTS_BUENOS_AIRES.slice(0, 4),
  ...CURATED_SPOTS_CARTAGENA.slice(0, 4),
  ...CURATED_SPOTS_BOGOTA.slice(0, 3),
  ...CURATED_SPOTS_LIMA.slice(0, 3),
  ...CURATED_SPOTS_SANTIAGO.slice(0, 3),
  ...CURATED_SPOTS_CUSCO.slice(0, 3),
];

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

// Mapa de país → spots (para cuando la ciudad no coincide pero el país sí)
const COUNTRY_MAP: Record<string, CuratedSpot[]> = {
  brasil: BEST_OF_BRAZIL,
  brazil: BEST_OF_BRAZIL,
  "brasil ": BEST_OF_BRAZIL,
  argentina: BEST_OF_LATAM,
  colombia: BEST_OF_LATAM,
  peru: BEST_OF_LATAM,
  chile: BEST_OF_LATAM,
};

// Normaliza un nombre para buscar
function normalize(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

// Devuelve los spots curados para una ciudad o país, o "lo mejor" si no hay match
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

  // 3. Match de país
  if (COUNTRY_MAP[normalized]) return COUNTRY_MAP[normalized];

  // 4. Si el texto contiene un nombre de país
  for (const key of Object.keys(COUNTRY_MAP)) {
    if (normalized.includes(key)) {
      return COUNTRY_MAP[key];
    }
  }

  // 5. Fallback: lo mejor de Brasil (destino principal de la app)
  return BEST_OF_BRAZIL;
}

// Lista de todas las ciudades soportadas
export const SUPPORTED_CITIES = Object.keys(CITY_MAP);
