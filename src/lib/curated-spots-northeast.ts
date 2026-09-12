export type CuratedSpot = {
  name: string;
  name_en?: string;
  type: "visit" | "tour" | "meal" | "event" | "free" | "transport";
  category:
    | "landmark"
    | "viewpoint"
    | "beach"
    | "hiking"
    | "street-art"
    | "stadium"
    | "museum"
    | "park"
    | "nightlife"
    | "food";
  description: string;
  viral_trend?: string;
  address: string;
  lat: number;
  lng: number;
  search_query: string;
  emoji: string;
};

// --- Salvador (Bahía) ---

export const CURATED_SPOTS_SALVADOR: CuratedSpot[] = [
  {
    name: "Pelourinho",
    name_en: "Pelourinho Historic Center",
    type: "visit",
    category: "landmark",
    description:
      "Centro histórico de Salvador, Patrimonio de la Humanidad por la UNESCO. Calles empedradas, iglesias coloniales coloridas y música en cada esquina.",
    viral_trend: "TikToks bailando en las escaleras coloridas del Pelô",
    address: "Pelourinho, Salvador - BA, 40026-010, Brasil",
    lat: -12.9714,
    lng: -38.5118,
    search_query: "Pelourinho Salvador Bahía Brasil",
    emoji: "🏛️",
  },
  {
    name: "Elevador Lacerda",
    name_en: "Lacerda Elevator",
    type: "transport",
    category: "viewpoint",
    description:
      "Ascensor público que conecta la Cidade Alta y la Cidade Baixa. Mirador con las mejores vistas de la Bahía de Todos-os-Santos.",
    viral_trend: "Foto del atardecer desde la cima con la bahía",
    address: "Praça Tomé de Sousa, Salvador - BA, 40020-000, Brasil",
    lat: -12.9723,
    lng: -38.5134,
    search_query: "Elevador Lacerda Salvador",
    emoji: "🏙️",
  },
  {
    name: "Farol da Barra",
    name_en: "Barra Lighthouse",
    type: "visit",
    category: "viewpoint",
    description:
      "Faro histórico en el Fuerte de Santo Antônio da Barra, el más antiguo de Brasil. Punto icónico para ver el atardecer en Salvador.",
    viral_trend: "Videos del atardecer con gente aplaudiendo al sol",
    address: "Largo do Farol da Barra, Salvador - BA, 40140-650, Brasil",
    lat: -13.0047,
    lng: -38.5278,
    search_query: "Farol da Barra Salvador",
    emoji: "🌅",
  },
  {
    name: "Farol de Itapuã",
    name_en: "Itapuã Lighthouse",
    type: "free",
    category: "viewpoint",
    description:
      "Faro pintoresco en la playa de Itapuã, inmortalizado por la canción de Dorival Caymmi. Ambiente tranquilo lejos del centro.",
    address: "Itapuã, Salvador - BA, 41610-010, Brasil",
    lat: -12.9556,
    lng: -38.3564,
    search_query: "Farol de Itapuã Salvador",
    emoji: "🗼",
  },
  {
    name: "Igreja do Bonfim",
    name_en: "Church of Bonfim",
    type: "visit",
    category: "landmark",
    description:
      "Iglesia famosa por las fitas do Bonfim, cintas que se atan con tres nudos para pedir un deseo. Símbolo religioso de Salvador.",
    viral_trend: "Atar la fita do Bonfim y pedir un deseo en video",
    address: "Largo do Bonfim, Salvador - BA, 40415-000, Brasil",
    lat: -12.9700,
    lng: -38.4922,
    search_query: "Igreja do Bonfim Salvador",
    emoji: "⛪",
  },
  {
    name: "Solar do Unhão / MAM",
    name_en: "Solar do Unhão / Museum of Modern Art",
    type: "visit",
    category: "museum",
    description:
      "Centro cultural y museo de arte moderno en un edificio colonial restaurado frente al mar. Atardeceres espectaculares en el muelle.",
    viral_trend: "Fotos en el muelle del MAM al atardecer",
    address: "Av. do Contorno, Salvador - BA, 40070-020, Brasil",
    lat: -12.9650,
    lng: -38.5100,
    search_query: "Solar do Unhão MAM Salvador",
    emoji: "🎨",
  },
  {
    name: "Mercado Modelo",
    name_en: "Modelo Market",
    type: "visit",
    category: "food",
    description:
      "Mercado artesanal en un edificio histórico junto al Elevador Lacerda. Souvenirs, artesanía y comida típica bahiana.",
    address: "Praça Visconde de Cayrú, Salvador - BA, 40015-160, Brasil",
    lat: -12.9733,
    lng: -38.5133,
    search_query: "Mercado Modelo Salvador",
    emoji: "🛍️",
  },
  {
    name: "Igreja de São Francisco",
    name_en: "Church of São Francisco",
    type: "visit",
    category: "landmark",
    description:
      "Iglesia barroca con interior totalmente revestido en oro. Considerada una de las más ricas y ornamentadas de Brasil.",
    address: "Rua da Ordem Terceira de São Francisco, Salvador - BA, 40026-010, Brasil",
    lat: -12.9728,
    lng: -38.5119,
    search_query: "Igreja de São Francisco Salvador",
    emoji: "✨",
  },
  {
    name: "Largo do Carmo",
    name_en: "Largo do Carmo Square",
    type: "free",
    category: "landmark",
    description:
      "Plaza arbolada en el Pelourinho con la Iglesia do Carmo y el convento carmelita. Lugar tranquilo para descansar y observar.",
    address: "Largo do Carmo, Salvador - BA, 40026-010, Brasil",
    lat: -12.9710,
    lng: -38.5120,
    search_query: "Largo do Carmo Salvador",
    emoji: "🌳",
  },
  {
    name: "Praça da Sé",
    name_en: "Praça da Sé Square",
    type: "free",
    category: "landmark",
    description:
      "Plaza con vista panorámica de la Cidade Baixa y el Elevador Lacerda. Ruinas de la antigua Sé y ambiente histórico.",
    address: "Praça da Sé, Salvador - BA, 40020-000, Brasil",
    lat: -12.9720,
    lng: -38.5130,
    search_query: "Praça da Sé Salvador",
    emoji: "📸",
  },
  {
    name: "Forte de São Marcelo",
    name_en: "Forte de São Marcelo",
    type: "tour",
    category: "landmark",
    description:
      "Fuerte circular sobre el mar, único en Brasil. Se accede en barco desde el puerto. Vistas de la ciudad desde el agua.",
    address: "Forte de São Marcelo, Salvador - BA, Brasil",
    lat: -12.9670,
    lng: -38.5150,
    search_query: "Forte de São Marcelo Salvador",
    emoji: "🏰",
  },
  {
    name: "Dique do Tororó",
    name_en: "Tororó Dike",
    type: "free",
    category: "park",
    description:
      "Lago urbano con estatuas de los orixás en el agua. Lugar de paseo, running y fotografía espiritual.",
    address: "Dique do Tororó, Salvador - BA, 40060-090, Brasil",
    lat: -12.9830,
    lng: -38.4840,
    search_query: "Dique do Tororó Salvador",
    emoji: "🛶",
  },
];

// --- Recife (Pernambuco) ---

export const CURATED_SPOTS_RECIFE: CuratedSpot[] = [
  {
    name: "Praça do Marco Zero",
    name_en: "Marco Zero Square",
    type: "free",
    category: "landmark",
    description:
      "Punto cero de Recife, en el Recife Antigo. Plaza colorida con el pórtico do Marco Zero y vista del río Capibaribe.",
    viral_trend: "Foto bajo el pórtico del Marco Zero",
    address: "Praça do Marco Zero, Recife - PE, 50030-000, Brasil",
    lat: -8.0631,
    lng: -34.8711,
    search_query: "Praça do Marco Zero Recife",
    emoji: "📍",
  },
  {
    name: "Praia de Boa Viagem",
    name_en: "Boa Viagem Beach",
    type: "free",
    category: "beach",
    description:
      "Playa urbana más famosa de Recife, con 7 km de arena, piscinas naturales en marea baja. Atención: presencia de tiburones, no bañarse lejos de la orilla.",
    viral_trend: "Videos de las piscinas naturales en marea baja",
    address: "Boa Viagem, Recife - PE, 51011-000, Brasil",
    lat: -8.1200,
    lng: -34.9000,
    search_query: "Praia de Boa Viagem Recife",
    emoji: "🏖️",
  },
  {
    name: "Instituto Ricardo Brennand",
    name_en: "Ricardo Brennand Institute",
    type: "visit",
    category: "museum",
    description:
      "Castillo medieval en medio de Recife con colección de armas, armaduras y arte. Jardines y arquitectura imponente.",
    address: "Alameda Antônio Brennand, Recife - PE, 52051-180, Brasil",
    lat: -8.0720,
    lng: -34.8850,
    search_query: "Instituto Ricardo Brennand Recife",
    emoji: "🏰",
  },
  {
    name: "Oficina Cerâmica Francisco Brennand",
    name_en: "Francisco Brennand Ceramic Workshop",
    type: "visit",
    category: "museum",
    description:
      "Espacio surrealista del artista Francisco Brennand, lleno de esculturas de cerámica en medio de la vegetación. Obra de arte total.",
    viral_trend: "Fotos entre las esculturas oníricas",
    address: "Propriedade Santos Cosme e Damião, Recife - PE, 52051-180, Brasil",
    lat: -8.0800,
    lng: -34.8900,
    search_query: "Oficina Cerâmica Francisco Brennand Recife",
    emoji: "🏺",
  },
  {
    name: "Cais do Porto",
    name_en: "Port Quay",
    type: "free",
    category: "landmark",
    description:
      "Muelles históricos del Recife Antigo, hoy zona de paseo con bares, museos y vista de los puentes de la ciudad.",
    address: "Cais do Porto, Recife - PE, 50030-000, Brasil",
    lat: -8.0700,
    lng: -34.8800,
    search_query: "Cais do Porto Recife Antigo",
    emoji: "⚓",
  },
  {
    name: "Sinagoga Kahal Zur Israel",
    name_en: "Kahal Zur Israel Synagogue",
    type: "visit",
    category: "museum",
    description:
      "Primera sinagoga de las Américas (1636), restaurada como museo de la historia judía en Recife. Recife Antigo.",
    address: "Rua do Bom Jesus, 197, Recife - PE, 50030-000, Brasil",
    lat: -8.0640,
    lng: -34.8710,
    search_query: "Sinagoga Kahal Zur Israel Recife",
    emoji: "🕍",
  },
  {
    name: "Paço do Frevo",
    name_en: "Paço do Frevo",
    type: "visit",
    category: "museum",
    description:
      "Centro cultural dedicado al frevo, ritmo y danza símbolo de Pernambuco. Exposiciones, clases y presentaciones.",
    address: "Praça do Arsenal da Marinha, Recife - PE, 50030-000, Brasil",
    lat: -8.0640,
    lng: -34.8705,
    search_query: "Paço do Frevo Recife",
    emoji: "💃",
  },
  {
    name: "Praia de Boa Viagem (Piscinas Naturais)",
    name_en: "Boa Viagem Natural Pools",
    type: "tour",
    category: "beach",
    description:
      "Piscinas naturales que se forman en la playa de Boa Viagem durante la marea baja. Paseo en jangada desde la orilla.",
    address: "Boa Viagem, Recife - PE, 51011-000, Brasil",
    lat: -8.1180,
    lng: -34.8980,
    search_query: "Piscinas naturais Boa Viagem Recife",
    emoji: "🐠",
  },
];

// --- Fortaleza (Ceará) ---

export const CURATED_SPOTS_FORTALEZA: CuratedSpot[] = [
  {
    name: "Avenida Beira-Mar",
    name_en: "Beira-Mar Avenue",
    type: "free",
    category: "park",
    description:
      "Paseo marítimo de 5 km junto a la playa de Iracema y Meireles. Ciclovía, quioscos de comida y carruajes turísticos.",
    viral_trend: "Videos patinando o corriendo al atardecer",
    address: "Av. Beira Mar, Fortaleza - CE, 60165-081, Brasil",
    lat: -3.7300,
    lng: -38.4900,
    search_query: "Avenida Beira-Mar Fortaleza",
    emoji: "🚲",
  },
  {
    name: "Praia do Futuro",
    name_en: "Futuro Beach",
    type: "free",
    category: "beach",
    description:
      "Playa más popular de Fortaleza, con barracas de playa (carpas) que sirven comida cearense. Mar abierto, oleaje fuerte.",
    viral_trend: "Comiendo peixada na barraca en TikTok",
    address: "Praia do Futuro, Fortaleza - CE, 60182-000, Brasil",
    lat: -3.7500,
    lng: -38.4700,
    search_query: "Praia do Futuro Fortaleza",
    emoji: "🌊",
  },
  {
    name: "Mercado Central",
    name_en: "Central Market",
    type: "visit",
    category: "food",
    description:
      "Mercado de artesanía de 5 pisos en el centro. Souvenirs, encajes de bilro, cerámica y comida regional.",
    address: "Rua Conde d'Eu, 199, Fortaleza - CE, 60060-120, Brasil",
    lat: -3.7170,
    lng: -38.5300,
    search_query: "Mercado Central Fortaleza",
    emoji: "🛍️",
  },
  {
    name: "Theatro José de Alencar",
    name_en: "José de Alencar Theater",
    type: "visit",
    category: "landmark",
    description:
      "Teatro histórico de 1910 con fachada art-nouveau y estructura metálica importada de Escocia. Jardines diseñados por Burle Marx.",
    address: "Rua Conde d'Eu, 221, Fortaleza - CE, 60060-120, Brasil",
    lat: -3.7180,
    lng: -38.5300,
    search_query: "Theatro José de Alencar Fortaleza",
    emoji: "🎭",
  },
  {
    name: "Catedral Metropolitana",
    name_en: "Metropolitan Cathedral",
    type: "visit",
    category: "landmark",
    description:
      "Catedral neogótica con vitrales franceses, la tercera más grande de Brasil. Stained glass impresionante al entrar.",
    address: "Rua Pedro I, 46, Fortaleza - CE, 60060-050, Brasil",
    lat: -3.7170,
    lng: -38.5310,
    search_query: "Catedral Metropolitana Fortaleza",
    emoji: "⛪",
  },
  {
    name: "Museu Cearense",
    name_en: "Ceará Museum",
    type: "visit",
    category: "museum",
    description:
      "Museo de historia y cultura cearense dentro del Fuerte de Nossa Senhora da Assunção. Piezas indígenas y coloniales.",
    address: "Forte de Nossa Senhora da Assunção, Fortaleza - CE, 60060-070, Brasil",
    lat: -3.7170,
    lng: -38.5310,
    search_query: "Museu Cearense Fortaleza",
    emoji: "🏛️",
  },
  {
    name: "Forte de Nossa Senhora da Assunção",
    name_en: "Forte de Nossa Senhora da Assunção",
    type: "visit",
    category: "landmark",
    description:
      "Fuerte holandés-portugués del siglo XVII, origen de la ciudad de Fortaleza. Base militar activa con visitas guiadas.",
    address: "Praça do Forte, Fortaleza - CE, 60060-070, Brasil",
    lat: -3.7170,
    lng: -38.5310,
    search_query: "Forte de Nossa Senhora da Assunção Fortaleza",
    emoji: "🏰",
  },
  {
    name: "Praia de Iracema",
    name_en: "Iracema Beach",
    type: "free",
    category: "beach",
    description:
      "Playa urbana bohemia con el puente dos Ingleses y la estatua de Iracema. Zona de bares y vida nocturna.",
    address: "Praia de Iracema, Fortaleza - CE, 60060-000, Brasil",
    lat: -3.7200,
    lng: -38.5100,
    search_query: "Praia de Iracema Fortaleza",
    emoji: "🏖️",
  },
  {
    name: "Centro Dragão do Mar",
    name_en: "Dragão do Mar Center of Art and Culture",
    type: "visit",
    category: "museum",
    description:
      "Complejo cultural con museos, cines, planetario y bares. Centro de la escena artística y nocturna de Fortaleza.",
    address: "Rua Dragão do Mar, 81, Fortaleza - CE, 60060-390, Brasil",
    lat: -3.7190,
    lng: -38.5400,
    search_query: "Centro Dragão do Mar Fortaleza",
    emoji: "🐉",
  },
];

// --- Jericoacoara / Nordeste ---

export const CURATED_SPOTS_JERICOACOARA: CuratedSpot[] = [
  {
    name: "Duna do Pôr do Sol",
    name_en: "Sunset Dune",
    type: "free",
    category: "viewpoint",
    description:
      "Duna principal de Jericoacoara, punto de encuentro para ver el atardecer. Subida de 5 minutos, vista 360° del mar y las dunas.",
    viral_trend: "Videos del aplauso colectivo al sol esconderse",
    address: "Duna do Pôr do Sol, Jijoca de Jericoacoara - CE, Brasil",
    lat: -2.7900,
    lng: -41.6900,
    search_query: "Duna do Pôr do Sol Jericoacoara",
    emoji: "🌅",
  },
  {
    name: "Pedra Furada",
    name_en: "Pedra Furada",
    type: "tour",
    category: "landmark",
    description:
      "Arco de roca sobre el mar, símbolo de Jericoacoara. Caminata de 40 min por la playa en marea baja. Mejor en la mañana.",
    viral_trend: "Foto en el arco con el mar de fondo",
    address: "Pedra Furada, Jijoca de Jericoacoara - CE, Brasil",
    lat: -2.7800,
    lng: -41.7000,
    search_query: "Pedra Furada Jericoacoara",
    emoji: "🪨",
  },
  {
    name: "Lagoa do Paraíso",
    name_en: "Paradise Lagoon",
    type: "free",
    category: "beach",
    description:
      "Laguna de agua dulce cristalina con redes sobre el agua. El spot más fotografiado de Jeri. Hammocks y kioscos.",
    viral_trend: "Tumbado en la red sobre el agua turquesa",
    address: "Lagoa do Paraíso, Jijoca de Jericoacoara - CE, Brasil",
    lat: -2.8200,
    lng: -41.6800,
    search_query: "Lagoa do Paraíso Jericoacoara",
    emoji: "🛟",
  },
  {
    name: "Lagoa Azul",
    name_en: "Blue Lagoon",
    type: "free",
    category: "beach",
    description:
      "Laguna de aguas azules rodeada de dunas y manglares. Más tranquila que Paraíso, ideal para nadar y remar.",
    address: "Lagoa Azul, Jijoca de Jericoacoara - CE, Brasil",
    lat: -2.8100,
    lng: -41.6700,
    search_query: "Lagoa Azul Jericoacoara",
    emoji: "💧",
  },
  {
    name: "Praia de Jericoacoara",
    name_en: "Jericoacoara Beach",
    type: "free",
    category: "beach",
    description:
      "Playa principal del pueblo, arena firme ideal para kitesurf y windsurf. El pueblo es cerrado a vehículos, todo se camina.",
    address: "Praia de Jericoacoara, Jijoca de Jericoacoara - CE, Brasil",
    lat: -2.7900,
    lng: -41.6900,
    search_query: "Praia de Jericoacoara",
    emoji: "🏖️",
  },
  {
    name: "Praia da Lagoinha (Ceará)",
    name_en: "Lagoinha Beach",
    type: "free",
    category: "beach",
    description:
      "Playa de arena roja entre acantilados, a 120 km de Fortaleza. Fondo de palmeras y dunas, paisaje de postal.",
    address: "Praia da Lagoinha, Paraipaba - CE, 62680-000, Brasil",
    lat: -2.8300,
    lng: -41.6900,
    search_query: "Praia da Lagoinha Ceará",
    emoji: "🌴",
  },
  {
    name: "Canoa Quebrada",
    name_en: "Canoa Quebrada",
    type: "free",
    category: "beach",
    description:
      "Pueblo de pescadores con dunas coloradas y la famosa meia-lua (media luna) y estrella esculpida en el acantilado. Ambiente hippie-chic.",
    viral_trend: "Foto en el acantilado con la media luna y la estrella",
    address: "Canoa Quebrada, Aracati - CE, 62800-000, Brasil",
    lat: -4.5000,
    lng: -37.2500,
    search_query: "Canoa Quebrada Ceará",
    emoji: "🌙",
  },
  {
    name: "Praia do Forte (Bahía)",
    name_en: "Praia do Forte Beach",
    type: "free",
    category: "beach",
    description:
      "Pueblo costero al norte de Salvador con playas, piscinas naturales y el Projeto Tamar (tortugas marinas). Eco-reserva y resort.",
    address: "Praia do Forte, Mata de São João - BA, 48280-000, Brasil",
    lat: -12.5700,
    lng: -38.0000,
    search_query: "Praia do Forte Bahía",
    emoji: "🐢",
  },
  {
    name: "Morro do Pai Inácio (Chapada Diamantina)",
    name_en: "Pai Inácio Hill",
    type: "tour",
    category: "viewpoint",
    description:
      "Mirador icónico de la Chapada Diamantina, subida corta y panorámica de 360°. Leyenda del Pai Inácio y vista de la meseta.",
    viral_trend: "Foto sentado en el borde con las montañas",
    address: "Morro do Pai Inácio, Palmeiras - BA, 46930-000, Brasil",
    lat: -12.4500,
    lng: -41.4700,
    search_query: "Morro do Pai Inácio Chapada Diamantina",
    emoji: "⛰️",
  },
  {
    name: "Lençóis Maranhenses",
    name_en: "Lençóis Maranhenses National Park",
    type: "tour",
    category: "viewpoint",
    description:
      "Parque nacional de dunas blancas y lagunas de agua dulce que se forman en la estación lluviosa. Paisaje único en el mundo, safari en 4x4.",
    viral_trend: "Videos zambulléndose en las lagunas entre dunas",
    address: "Parque Nacional dos Lençóis Maranhenses, Barreirinhas - MA, 65760-000, Brasil",
    lat: -2.5000,
    lng: -42.8000,
    search_query: "Lençóis Maranhenses Parque Nacional",
    emoji: "🏜️",
  },
];
