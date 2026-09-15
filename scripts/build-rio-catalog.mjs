import fs from "node:fs";

const env = Object.fromEntries(
  fs
    .readFileSync(new URL("../.env.local", import.meta.url), "utf8")
    .split(/\r?\n/)
    .filter((line) => line && !line.startsWith("#") && line.includes("="))
    .map((line) => {
      const separator = line.indexOf("=");
      return [
        line.slice(0, separator),
        line.slice(separator + 1).trim().replace(/^['"]|['"]$/g, ""),
      ];
    }),
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = env.SUPABASE_SERVICE_ROLE_KEY;
const apiBase = process.env.CATALOG_API_BASE ?? "https://brasil-trip-planner.vercel.app";
const requestedTripId = process.argv.find((arg) => arg.startsWith("--trip-id="))?.split("=")[1];
const targetPoses = Number(process.argv.find((arg) => arg.startsWith("--target-poses="))?.split("=")[1] ?? "30");
const permanentExpiry = "2099-12-31T23:59:59.000Z";

if (!supabaseUrl || !serviceKey) {
  throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY en .env.local");
}

const additions = [
  {
    name: "Real Gabinete Português de Leitura",
    nameEn: "Royal Portuguese Reading Room",
    address: "Rua Luís de Camões, 30 - Centro, Rio de Janeiro",
    lat: -22.905,
    lng: -43.1814,
    category: "museum",
    emoji: "📚",
    description: "Biblioteca neomanuelina con estanterías monumentales y una de las salas de lectura más fotogénicas de Río.",
    viralTrend: "Encuadre simétrico desde el centro para capturar las estanterías y el lucernario.",
  },
  {
    name: "Confeitaria Colombo",
    nameEn: "Confeitaria Colombo Rio",
    address: "Rua Gonçalves Dias, 32 - Centro, Rio de Janeiro",
    lat: -22.9055,
    lng: -43.1787,
    category: "food",
    emoji: "☕",
    description: "Café histórico de 1894 con espejos belgas, vitrales y salones de estilo belle époque.",
    viralTrend: "Foto editorial junto a los espejos con café y pastel de nata en primer plano.",
  },
  {
    name: "Ilha Fiscal",
    nameEn: "Fiscal Island Rio de Janeiro",
    address: "Avenida Alfredo Agache, s/n - Centro, Rio de Janeiro",
    lat: -22.8975,
    lng: -43.1666,
    category: "landmark",
    emoji: "🏰",
    description: "Palacio neogótico sobre la bahía de Guanabara, conocido por albergar el último baile del Imperio.",
    viralTrend: "Retrato desde el embarcadero usando las torres verdes como marco de fondo.",
  },
  {
    name: "Mosteiro de São Bento",
    nameEn: "Monastery of Saint Benedict Rio",
    address: "Rua Dom Gerardo, 68 - Centro, Rio de Janeiro",
    lat: -22.897,
    lng: -43.178,
    category: "landmark",
    emoji: "⛪",
    description: "Monasterio colonial con un interior barroco cubierto de talla dorada y gran valor histórico.",
    viralTrend: "Composición respetuosa desde el pasillo central para enfatizar la profundidad del altar.",
  },
  {
    name: "Museu de Arte Moderna do Rio",
    nameEn: "Museum of Modern Art Rio de Janeiro",
    address: "Avenida Infante Dom Henrique, 85 - Parque do Flamengo",
    lat: -22.9138,
    lng: -43.1726,
    category: "museum",
    emoji: "🖼️",
    description: "Icono modernista de Affonso Eduardo Reidy rodeado por los jardines de Burle Marx.",
    viralTrend: "Pose minimalista entre los pilares de hormigón aprovechando las líneas geométricas.",
  },
  {
    name: "Museu Nacional de Belas Artes",
    nameEn: "National Museum of Fine Arts Rio",
    address: "Avenida Rio Branco, 199 - Centro, Rio de Janeiro",
    lat: -22.9083,
    lng: -43.1765,
    category: "museum",
    emoji: "🎨",
    description: "Museo de arte brasileño y europeo en un edificio ecléctico del centro histórico.",
    viralTrend: "Retrato clásico en la escalinata exterior con la fachada completa en vertical.",
  },
  {
    name: "Mural Etnias",
    nameEn: "Ethnicities Mural Rio de Janeiro",
    address: "Orla Conde - Gamboa, Rio de Janeiro",
    lat: -22.8953,
    lng: -43.1871,
    category: "street-art",
    emoji: "🎭",
    description: "Mural monumental de Eduardo Kobra que representa cinco pueblos originarios de distintos continentes.",
    viralTrend: "Usar uno de los rostros coloridos como fondo y vestir un tono que contraste.",
  },
  {
    name: "Quinta da Boa Vista",
    nameEn: "Quinta da Boa Vista Rio",
    address: "Avenida Pedro II, s/n - São Cristóvão, Rio de Janeiro",
    lat: -22.9058,
    lng: -43.223,
    category: "park",
    emoji: "🌳",
    description: "Parque histórico de los antiguos jardines imperiales, con lagos, senderos y amplias áreas verdes.",
    viralTrend: "Foto relajada junto al lago con el paisaje imperial al fondo.",
  },
  {
    name: "Cascatinha Taunay",
    nameEn: "Taunay Waterfall Tijuca Forest",
    address: "Estrada da Cascatinha - Alto da Boa Vista, Rio de Janeiro",
    lat: -22.953,
    lng: -43.2913,
    category: "hiking",
    emoji: "💧",
    description: "La cascada más conocida del Parque Nacional da Tijuca, rodeada de bosque atlántico.",
    viralTrend: "Retrato desde el área permitida usando velocidad rápida para congelar el agua.",
  },
  {
    name: "Mirante do Leblon",
    nameEn: "Leblon Viewpoint Rio",
    address: "Avenida Niemeyer - Leblon, Rio de Janeiro",
    lat: -22.9928,
    lng: -43.2334,
    category: "viewpoint",
    emoji: "🌅",
    description: "Mirador accesible sobre el extremo de Leblon con vistas de la playa, Morro Dois Irmãos y la costa.",
    viralTrend: "Silueta lateral durante la hora dorada con Dois Irmãos alineado al fondo.",
  },
  {
    name: "Praia da Joatinga",
    nameEn: "Joatinga Beach Rio de Janeiro",
    address: "Rua Sargento José da Silva - Joá, Rio de Janeiro",
    lat: -23.0162,
    lng: -43.289,
    category: "beach",
    emoji: "🏖️",
    description: "Pequeña playa entre acantilados y mansiones, visible principalmente cuando la marea está baja.",
    viralTrend: "Retrato entre las rocas con el mar turquesa, revisando antes la marea.",
  },
  {
    name: "Ilha de Paquetá",
    nameEn: "Paqueta Island Rio de Janeiro",
    address: "Ilha de Paquetá, Rio de Janeiro",
    lat: -22.7594,
    lng: -43.1088,
    category: "park",
    emoji: "🚲",
    description: "Isla tranquila de la bahía con calles sin coches, bicicletas, casas históricas y playas pequeñas.",
    viralTrend: "Foto en bicicleta bajo los flamboyanes o junto al muelle al atardecer.",
  },
];

const posePriority = [
  ["Cristo Redentor", "Christ the Redeemer"],
  ["Copacabana Beach", "Copacabana Beach"],
  ["Ipanema Beach", "Ipanema Beach"],
  ["Pão de Açúcar", "Sugarloaf Mountain"],
  ["Escadaria Selarón", "Selaron Steps"],
  ["Arpoador", "Arpoador Rio"],
  ["Mirante Dona Marta", "Dona Marta Viewpoint"],
  ["Pedra do Telégrafo", "Telegraph Rock Rio"],
  ["Parque Lage", "Parque Lage Rio"],
  ["Vista Chinesa", "Vista Chinesa Rio"],
  ["Pedra da Gávea", "Gavea Rock Rio"],
  ["Morro Dois Irmãos", "Two Brothers Mountain Rio"],
  ["Maracanã Stadium", "Maracana Stadium"],
  ["Jardim Botânico", "Rio Botanical Garden"],
  ["Mural Etnias", "Ethnicities Mural Rio"],
  ["Mirante do Leblon", "Leblon Viewpoint Rio"],
  ["Praia da Joatinga", "Joatinga Beach Rio"],
  ["Ilha Fiscal", "Fiscal Island Rio"],
  ["Real Gabinete Português de Leitura", "Royal Portuguese Reading Room"],
  ["Museu de Arte Moderna do Rio", "Museum of Modern Art Rio"],
];

const delay = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds));

async function supabase(path, init = {}) {
  const response = await fetch(supabaseUrl + "/rest/v1/" + path, {
    ...init,
    headers: {
      apikey: serviceKey,
      Authorization: "Bearer " + serviceKey,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
  if (!response.ok) throw new Error(await response.text());
  const text = await response.text();
  return text ? JSON.parse(text) : null;
}

async function searchImages(name, type, count) {
  const url = new URL("/api/pose-search", apiBase);
  url.searchParams.set("q", name);
  url.searchParams.set("type", type);
  url.searchParams.set("count", String(count));
  url.searchParams.set("destination", "Rio de Janeiro");
  const response = await fetch(url, { signal: AbortSignal.timeout(90000) });
  if (!response.ok) throw new Error("Image search failed: " + response.status);
  const payload = await response.json();
  return payload.results ?? [];
}

async function getTrip() {
  if (requestedTripId) {
    const rows = await supabase("trips?select=id,city,destination&id=eq." + encodeURIComponent(requestedTripId));
    if (rows.length !== 1) throw new Error("No se encontró el viaje solicitado");
    return rows[0];
  }
  const rows = await supabase("trips?select=id,city,destination&city=ilike.*Rio*");
  if (rows.length !== 1) throw new Error("Usa --trip-id=UUID cuando haya cero o varios viajes de Río");
  return rows[0];
}

const trip = await getTrip();
let inspirations = await supabase(
  "inspirations?select=*&trip_id=eq." + encodeURIComponent(trip.id) + "&order=rating.desc.nullslast",
);
const existingTitles = new Set(inspirations.map((row) => row.title.toLocaleLowerCase()));

for (const place of additions) {
  if (existingTitles.has(place.name.toLocaleLowerCase())) continue;
  const images = await searchImages(place.nameEn + " Rio de Janeiro", "place", 3);
  await supabase("inspirations", {
    method: "POST",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({
      trip_id: trip.id,
      place_id: "catalog-rio-" + place.nameEn.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
      title: place.name,
      address: place.address,
      location: place.address,
      image_url: images[0]?.url ?? null,
      image_urls: images.map((image) => image.url),
      description: place.description,
      viral_trend: place.viralTrend,
      category: place.category,
      emoji: place.emoji,
      types: ["tourist_attraction", "point_of_interest"],
      suggested_type: "visit",
      lat: place.lat,
      lng: place.lng,
      currency: "BRL",
      photo_concepts: [],
      expires_at: permanentExpiry,
    }),
  });
  existingTitles.add(place.name.toLocaleLowerCase());
  console.log("Lugar añadido: " + place.name);
  await delay(1100);
}

inspirations = await supabase(
  "inspirations?select=*&trip_id=eq." + encodeURIComponent(trip.id) + "&order=rating.desc.nullslast",
);
const rowsByTitle = new Map(inspirations.map((row) => [row.title.toLocaleLowerCase(), row]));
const countPoseReferences = (row) =>
  (row.photo_concepts ?? [])
    .flatMap((concept) => concept.reference_image_urls ?? [])
    .filter((url) => !url.includes("pollinations.ai")).length;
let poseCount = inspirations.reduce((total, row) => total + countPoseReferences(row), 0);

for (const [title, searchName] of posePriority) {
  if (poseCount >= targetPoses) break;
  const row = rowsByTitle.get(title.toLocaleLowerCase());
  if (!row) continue;
  const previousCount = countPoseReferences(row);
  const remaining = targetPoses - (poseCount - previousCount);
  const photos = await searchImages(searchName, "pose", Math.min(6, remaining));
  if (photos.length === 0) {
    console.log("Sin poses aprobadas: " + title);
    await delay(2500);
    continue;
  }
  const concepts = photos.map((photo) => ({
    title: photo.alt || "Pose en " + title,
    description: photo.why_it_works || photo.alt || "",
    pose: photo.pose,
    camera_angle: photo.camera_angle,
    camera_tip: photo.camera_tip,
    best_time: photo.best_time,
    reference_image_urls: [photo.url],
    reference_source_urls: [photo.source_url],
  }));
  await supabase("inspirations?id=eq." + encodeURIComponent(row.id), {
    method: "PATCH",
    headers: { Prefer: "return=minimal" },
    body: JSON.stringify({ photo_concepts: concepts, expires_at: permanentExpiry }),
  });
  poseCount = poseCount - previousCount + concepts.length;
  console.log(title + ": " + concepts.length + " poses; total=" + poseCount);
  await delay(2500);
}

await supabase("inspirations?trip_id=eq." + encodeURIComponent(trip.id), {
  method: "PATCH",
  headers: { Prefer: "return=minimal" },
  body: JSON.stringify({ expires_at: permanentExpiry }),
});

const finalRows = await supabase(
  "inspirations?select=photo_concepts&trip_id=eq." + encodeURIComponent(trip.id),
);
const finalPoseCount = finalRows.reduce(
  (total, row) => total + (row.photo_concepts ?? []).flatMap((concept) => concept.reference_image_urls ?? []).filter((url) => !url.includes("pollinations.ai")).length,
  0,
);
console.log("Catálogo terminado: " + finalRows.length + " lugares y " + finalPoseCount + " fotos de pose reales");
