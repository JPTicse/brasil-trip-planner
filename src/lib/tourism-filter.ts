// Filtro algorítmico para excluir agencias de turismo, operadores de tours,
// y negocios de travel de los resultados de Google Places.
// Mantiene solo landmarks, atracciones, restaurantes, parques, playas, etc.

/**
 * isTourismBusiness — Detecta si un lugar es un negocio de turismo
 * (agencia, operador, booking) que debe EXCLUIRSE de las inspiraciones.
 *
 * @param name  - Nombre del lugar
 * @param types - Tipos de Google Places
 * @returns true = excluir (es agencia), false = mantener (es lugar real)
 */
export function isTourismBusiness(name: string, types: string[]): boolean {
  const lowerName = name.toLowerCase().trim();
  const lowerTypes = (types ?? []).map((t) => t.toLowerCase());

  const hasWord = (text: string, word: string): boolean => {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`\\b${escaped}\\b`).test(text);
  };

  const has = (text: string, term: string): boolean => text.includes(term);

  // STEP 1 — Landmark override: si el nombre contiene keywords de landmark, MANTENER
  const LANDMARK_KEYWORDS = [
    "museo", "museum", "catedral", "cathedral", "iglesia", "church",
    "basílica", "basilica", "templo", "temple", "mezquita", "mosque",
    "sinagoga", "synagogue", "abbey", "abadía", "monasterio", "monastery",
    "convento", "convent", "capilla", "chapel", "santuario", "sanctuary",
    "praça", "plaza", "piazza", "parque", "park", "jardín", "jardim",
    "garden", "botanical", "botánico", "praia", "beach", "playa",
    "mirante", "viewpoint", "mirador", "lookout", "observatory",
    "observatorio", "observatório", "estádio", "stadium", "estadio",
    "arena", "coliseo", "coliseum", "monumento", "monument", "memorial",
    "estátua", "statue", "estatua", "castelo", "castle", "castillo",
    "palácio", "palace", "palacio", "tower", "torre",
    "cachoeira", "waterfall", "cascada", "catarata", "lago", "lake",
    "lagoa", "laguna", "monte", "mountain", "morro", "hill", "serra",
    "sierra", "rio", "river", "río", "ilha", "island", "isla",
    "gruta", "cave", "caverna", "cueva", "volcán", "volcano", "vulcão",
    "desfiladero", "gorge", "cañón", "canyon", "glaciar", "glacier",
    "reserva natural", "reserva ecológica", "reserva biológica",
    "reserva florestal", "reserva forestal", "national park",
    "parque nacional", "nature reserve", "área protegida",
    "zoo", "aquário", "aquarium", "acuario", "amusement park",
    "theme park", "parque de diversões", "parque temático",
    "fortaleza", "fortress", "fort", "vineyard", "bodega", "adega",
    "vinícola", "vinicola", "quinta", "ruínas", "ruins", "ruinas",
    "archaeological site", "sitio arqueológico", "yacimiento",
    "patrimônio", "patrimonio", "heritage", "puente", "bridge", "ponte",
    "fuente", "fountain", "fonte", "chafariz", "teatro", "theatre",
    "theatro", "museu", "pinacoteca", "atalaya", "mirador",
    "estação", "estacion", "station", "bondinho", "teleférico",
    "teleferico", "cable car", "funicular", "funiculaire",
    "farol", "lighthouse", "faro", "duna", "dune", "arco", "arch",
    "arcos", "aqueduto", "aqueduct", "acueducto", "praca",
  ];

  for (const keyword of LANDMARK_KEYWORDS) {
    if (has(lowerName, keyword)) return false; // KEEP
  }

  // STEP 2 — Google Places type check: excluir tipos de turismo
  const EXCLUDE_TYPES = new Set([
    "travel_agency",
    "tour_operator",
    "tour_agency",
    "car_rental",
    "moving_company",
  ]);

  for (const t of lowerTypes) {
    if (EXCLUDE_TYPES.has(t)) return true; // EXCLUDE
  }

  // STEP 3 — Strong tourism keywords
  const STRONG_TOURISM = [
    "agencia", "agency", "operadora", "operator",
    "booking", "bookings", "reserve", "reserva", "reservation",
    "travel", "viajes", "viagem", "viagens",
    "guía", "guia", "guide", "guided",
    "paquete", "package", "packages",
    "alquiler", "rental", "rent a car", "locadora",
    "day trip", "excursión", "excursion", "excursiones",
    "escapada", "escapadas", "sightseeing",
    "hop-on-hop-off", "hop on hop off",
  ];

  for (const keyword of STRONG_TOURISM) {
    if (has(lowerName, keyword)) return true; // EXCLUDE
  }

  // STEP 4 — "tour"/"tours" context-aware (French "tour" = tower)
  const TOURISM_CONTEXT = [
    "city", "walking", "bus", "boat", "bike", "segway", "helicopter",
    "private", "guided", "group", "day", "half-day", "full-day",
    "sightseeing", "hop-on", "hop-off", "operator", "agency",
    "company", "service", "booking", "book", "reserve", "ticket",
    "ciudad", "a pie", "autobús", "autobus", "barco", "bicicleta",
    "privado", "guiado", "grupo", "día", "dia", "circuito",
    "cidade", "a pé", "ônibus", "onibus",
  ];

  if (hasWord(lowerName, "tour") || hasWord(lowerName, "tours")) {
    let hasTourismContext = false;
    for (const ctx of TOURISM_CONTEXT) {
      if (has(lowerName, ctx)) {
        hasTourismContext = true;
        break;
      }
    }
    if (hasTourismContext) return true; // EXCLUDE
    if (lowerName === "tour" || lowerName === "tours") return true; // EXCLUDE
    // "tour" sin contexto → podría ser "torre" en francés, MANTENER
  }

  // STEP 5 — "ticket"/"entradas" (venue-aware)
  const VENUE_TYPES = new Set([
    "stadium", "museum", "amusement_park", "aquarium", "zoo",
    "art_gallery", "movie_theater", "casino", "bowling_alley",
    "concert_hall", "performing_arts_theater", "convention_center",
    "event_venue", "night_club", "tourist_attraction",
  ]);

  const isVenue = lowerTypes.some((t) => VENUE_TYPES.has(t));

  if (!isVenue) {
    const TICKET_KEYWORDS = [
      "ticket", "tickets", "entradas", "bilhete", "bilhetes",
      "billete", "billetes", "boleto", "boletos",
    ];
    for (const keyword of TICKET_KEYWORDS) {
      if (has(lowerName, keyword)) return true; // EXCLUDE
    }
  }

  // STEP 6 — "transfer"/"shuttle" (transit-aware)
  const TRANSIT_TYPES = new Set([
    "transit_station", "bus_station", "train_station", "subway_station",
    "light_rail_station", "taxi_stand", "airport",
  ]);

  const isTransit = lowerTypes.some((t) => TRANSIT_TYPES.has(t));

  if (!isTransit) {
    const TRANSFER_KEYWORDS = [
      "transfer", "transfers", "shuttle", "transporte", "transport",
      "traslado", "traslados", "airport transfer", "aeroporto transfer",
    ];
    for (const keyword of TRANSFER_KEYWORDS) {
      if (has(lowerName, keyword)) return true; // EXCLUDE
    }
  }

  // STEP 7 — "cruise"/"paseo"/"passeio" (solo con contexto de travel)
  const CRUISE_KEYWORDS = [
    "cruise", "crucero", "cruceros", "paseo", "passeio", "passeios",
  ];
  const TRAVEL_CONTEXT = [
    "tour", "travel", "viaje", "viajes", "barco", "boat",
    "marítimo", "maritimo", "río", "rio", "river", "bahía", "bahia",
    "bay", "navío", "navio", "ship",
  ];

  for (const cruiseWord of CRUISE_KEYWORDS) {
    if (has(lowerName, cruiseWord)) {
      for (const travelWord of TRAVEL_CONTEXT) {
        if (has(lowerName, travelWord)) return true; // EXCLUDE
      }
    }
  }

  // STEP 8 — Additional tourism indicators
  const ADDITIONAL = [
    "excursions", "circuito turístico", "circuitos turísticos",
    "visita guiada", "visitas guiadas", "turismo receptivo",
    "operador receptivo", "receptive", "receptivo", "incoming",
    "dmc", "oficina de turismo", "visitor center",
    "centro de visitantes",
  ];

  for (const keyword of ADDITIONAL) {
    if (has(lowerName, keyword)) return true; // EXCLUDE
  }

  // DEFAULT — No detectado como turismo → MANTENER
  return false;
}
