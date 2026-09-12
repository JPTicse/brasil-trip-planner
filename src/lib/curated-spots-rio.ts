// Spots trending/instagramables curados de Río de Janeiro.
// Solo lugares icónicos que un grupo de amigos querría visitar y fotografiar.
// Las coordenadas son aproximadas y sirven para sesgar búsquedas en Google Places.

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

export const CURATED_SPOTS_RIO: CuratedSpot[] = [
  {
    name: "Cristo Redentor",
    name_en: "Christ the Redeemer",
    type: "visit",
    category: "landmark",
    description:
      "La estatua más icónica de Río y una de las 7 maravillas del mundo. Las vistas de la ciudad desde el mirador son espectaculares.",
    viral_trend: "Foto con los brazos abiertos imitando al Cristo",
    address: "Parque Nacional da Tijuca, Cosme Velho, Rio de Janeiro",
    lat: -22.9519,
    lng: -43.2105,
    search_query: "Cristo Redentor Rio de Janeiro",
    emoji: "✝️",
  },
  {
    name: "Copacabana Beach",
    name_en: "Copacabana Beach",
    type: "free",
    category: "beach",
    description:
      "La playa más famosa del mundo, con su icónico paseo de piedra portuguesa en forma de ondas. Punto de encuentro de cariocas y turistas.",
    viral_trend: "Foto tumbado en la arena con el Forte de Copacabana de fondo",
    address: "Av. Atlântica, Copacabana, Rio de Janeiro",
    lat: -22.9711,
    lng: -43.1822,
    search_query: "Copacabana Beach Rio de Janeiro",
    emoji: "🏖️",
  },
  {
    name: "Ipanema Beach",
    name_en: "Ipanema Beach",
    type: "free",
    category: "beach",
    description:
      "La playa que inspiró la canción 'Garota de Ipanema'. Sus montañas Dois Irmãos al fondo crean la postal perfecta.",
    viral_trend: "Foto en el Posto 9 con las montañas Dois Irmãos detrás",
    address: "Av. Vieira Souto, Ipanema, Rio de Janeiro",
    lat: -22.9836,
    lng: -43.2048,
    search_query: "Ipanema Beach Rio de Janeiro",
    emoji: "🌊",
  },
  {
    name: "Maracanã Stadium",
    name_en: "Maracanã Stadium",
    type: "event",
    category: "stadium",
    description:
      "El templo del fútbol brasileño. Ver un partido aquí es una experiencia que eriza la piel, con el ritmo de las torcidas.",
    viral_trend: "Foto con la camiseta de Brasil en las gradas del Maracanã",
    address: "Av. Pres. Castelo Branco, Maracanã, Rio de Janeiro",
    lat: -22.9121,
    lng: -43.2302,
    search_query: "Maracanã Stadium Rio de Janeiro",
    emoji: "⚽",
  },
  {
    name: "Escadaria Selarón",
    name_en: "Selarón Steps",
    type: "free",
    category: "street-art",
    description:
      "Escalera de 215 peldaños cubiertos con azulejos de todo el mundo, obra del artista chileno Jorge Selarón. Una de las postales más coloridas de Río.",
    viral_trend: "Foto sentado en los escalones de azulejos coloridos",
    address: "R. Joaquim Silva, Lapa, Rio de Janeiro",
    lat: -22.9136,
    lng: -43.1786,
    search_query: "Escadaria Selarón Rio de Janeiro",
    emoji: "🎨",
  },
  {
    name: "Pão de Açúcar",
    name_en: "Sugarloaf Mountain",
    type: "tour",
    category: "landmark",
    description:
      "El pan de azúcar es el mirador natural más espectacular de Río. Se sube en teleférico con vistas de 360° de la bahía y la ciudad.",
    viral_trend: "Foto en el mirador con la bahía de Guanabara al fondo",
    address: "Av. Pasteur, Urca, Rio de Janeiro",
    lat: -22.9486,
    lng: -43.1566,
    search_query: "Pão de Açúcar Sugarloaf Mountain Rio de Janeiro",
    emoji: "🍞",
  },
  {
    name: "Mirante Dona Marta",
    name_en: "Dona Marta Viewpoint",
    type: "free",
    category: "viewpoint",
    description:
      "Mirador dentro del Parque Nacional da Tijuca con la vista más completa del Cristo Redentor de frente y la bahía de Botafogo.",
    viral_trend: "Foto panorámica con el Cristo de frente y la bahía abajo",
    address: "Estr. Dona Marta, Santa Teresa, Rio de Janeiro",
    lat: -22.9683,
    lng: -43.2547,
    search_query: "Mirante Dona Marta Rio de Janeiro",
    emoji: "🔭",
  },
  {
    name: "Pedra do Telégrafo",
    name_en: "Telegraph Rock",
    type: "tour",
    category: "hiking",
    description:
      "La sendera más viral de Río. La caminata termina en un acantilado donde la perspectiva crea una ilusión óptica perfecta para Instagram.",
    viral_trend: "Ilusión de colgando del acantilado (en realidad está a 50 cm del suelo)",
    address: "Estr. do Telegrafo, Pedra de Guaratiba, Rio de Janeiro",
    lat: -23.0136,
    lng: -43.2856,
    search_query: "Pedra do Telégrafo Rio de Janeiro",
    emoji: "🧗",
  },
  {
    name: "Pedra da Gávea",
    name_en: "Gávea Rock",
    type: "tour",
    category: "hiking",
    description:
      "La montaña más imponente de Río con 842 m de altura. La subida es exigente pero la vista desde la cima abarca toda la Zona Sur.",
    viral_trend: "Foto en el borde de la roca con la ciudad y el mar de fondo",
    address: "Estr. do Sorim, Barra da Tijuca, Rio de Janeiro",
    lat: -22.9972,
    lng: -43.2856,
    search_query: "Pedra da Gávea Rio de Janeiro",
    emoji: "⛰️",
  },
  {
    name: "Arpoador",
    name_en: "Arpoador Rock",
    type: "free",
    category: "viewpoint",
    description:
      "La roca entre Copacabana e Ipanema donde los cariocas se reúnen cada atardecer para aplaudir al sol. El mejor sunset de la ciudad.",
    viral_trend: "Aplausos colectivos al atardecer cuando el sol toca el mar",
    address: "Arpoador, Rio de Janeiro",
    lat: -22.9914,
    lng: -43.1908,
    search_query: "Pedra do Arpoador Rio de Janeiro",
    emoji: "👏",
  },
  {
    name: "Morro Dois Irmãos",
    name_en: "Two Brothers Hill",
    type: "tour",
    category: "hiking",
    description:
      "Las dos montañas gemelas que dominan el skyline de Ipanema. La subida por Vidigal ofrece vistas únicas de las playas del sur.",
    viral_trend: "Foto sentado en la cima con Ipanema y Leblon a los pies",
    address: "Morro Dois Irmãos, Vidigal, Rio de Janeiro",
    lat: -23.0036,
    lng: -43.2489,
    search_query: "Morro Dois Irmãos Rio de Janeiro",
    emoji: "🏔️",
  },
  {
    name: "Jardim Botânico",
    name_en: "Rio de Janeiro Botanical Garden",
    type: "visit",
    category: "park",
    description:
      "Jardín botánico con más de 200 años, famoso por sus palmeras imperiales gigantes que forman un túnel verde espectacular.",
    viral_trend: "Foto caminando bajo el túnel de palmeras imperiales",
    address: "R. Jardim Botânico 1008, Jardim Botânico, Rio de Janeiro",
    lat: -22.9697,
    lng: -43.2256,
    search_query: "Jardim Botânico Rio de Janeiro",
    emoji: "🌴",
  },
  {
    name: "Arcos da Lapa",
    name_en: "Lapa Arches",
    type: "free",
    category: "nightlife",
    description:
      "El acueducto colonial del siglo XVIII es el símbolo de Lapa, el barrio bohemio de Río. De noche se convierte en el epicentro de la fiesta y la samba.",
    viral_trend: "Foto nocturna bajo los arcos iluminados con la calle llena de gente",
    address: "Lapa, Rio de Janeiro",
    lat: -22.9128,
    lng: -43.1797,
    search_query: "Arcos da Lapa Rio de Janeiro",
    emoji: "🎭",
  },
  {
    name: "Vista Chinesa",
    name_en: "Chinese View",
    type: "free",
    category: "viewpoint",
    description:
      "Mirador con un pagoda china dentro del Parque Nacional da Tijuca. Oferce una vista única de la Tijuca, Ipanema y el Maracanã.",
    viral_trend: "Foto junto al mirador chino con la selva y la ciudad al fondo",
    address: "Estr. da Vista Chinesa, Alto da Boa Vista, Rio de Janeiro",
    lat: -22.965,
    lng: -43.253,
    search_query: "Vista Chinesa Rio de Janeiro",
    emoji: "🏯",
  },
  {
    name: "Parque Lage",
    name_en: "Parque Lage",
    type: "free",
    category: "park",
    description:
      "Mansión colonial rodeada de jardines tropicales al pie del Corcovado. La casa principal con sus arcos es un dream para fotografía.",
    viral_trend: "Foto en el patio de la mansión con los arcos y el Corcovado al fondo",
    address: "R. Jardim Botânico 414, Jardim Botânico, Rio de Janeiro",
    lat: -22.9578,
    lng: -43.2125,
    search_query: "Parque Lage Rio de Janeiro",
    emoji: "🏛️",
  },
  {
    name: "Pedra Bonita",
    name_en: "Pedra Bonita",
    type: "tour",
    category: "hiking",
    description:
      "Caminata corta y accesible con una de las mejores vistas de São Conrado y el mar. Punto de despegue de ala delta más famoso de Río.",
    viral_trend: "Foto con los ala delta despegando al fondo",
    address: "Estr. das Canoas, São Conrado, Rio de Janeiro",
    lat: -22.9925,
    lng: -43.2722,
    search_query: "Pedra Bonita Rio de Janeiro",
    emoji: "🪂",
  },
  {
    name: "Favela Santa Marta",
    name_en: "Santa Marta Favela",
    type: "visit",
    category: "landmark",
    description:
      "La primera favela pacificada de Río, famosa por el clip de 'They Don't Care About Us' de Michael Jackson. Sus casas coloridas escalan la montaña.",
    viral_trend: "Foto en la estatua de Michael Jackson replicando sus pasos de baile",
    address: "R. São Bernardo, Botafogo, Rio de Janeiro",
    lat: -22.9444,
    lng: -43.2056,
    search_query: "Favela Santa Marta Rio de Janeiro",
    emoji: "🕺",
  },
  {
    name: "Praia de Botafogo",
    name_en: "Botafogo Beach",
    type: "free",
    category: "beach",
    description:
      "Playa urbana con la mejor vista del Pão de Açúcar y la bahía de Guanabara. Ideal para pasear y ver el atardecer con la ciudad de fondo.",
    viral_trend: "Foto con el Pão de Açúcar reflejándose en el agua al atardecer",
    address: "Av. das Nações Unidas, Botafogo, Rio de Janeiro",
    lat: -22.9456,
    lng: -43.1864,
    search_query: "Praia de Botafogo Rio de Janeiro",
    emoji: "🌅",
  },
  {
    name: "Lagoa Rodrigo de Freitas",
    name_en: "Rodrigo de Freitas Lagoon",
    type: "free",
    category: "park",
    description:
      "La laguna corazón de la Zona Sur, rodeada de montañas. Pista de 7 km para caminar, andar en bici o patinar con vistas al Corcovado.",
    viral_trend: "Foto en el paddleboard en la laguna con el Cristo al fondo",
    address: "Lagoa Rodrigo de Freitas, Rio de Janeiro",
    lat: -22.9736,
    lng: -43.2131,
    search_query: "Lagoa Rodrigo de Freitas Rio de Janeiro",
    emoji: "🚣",
  },
  {
    name: "Praia do Flamengo",
    name_en: "Flamengo Beach",
    type: "free",
    category: "beach",
    description:
      "Playa extensa bordeada por el Parque do Flamengo, con vistas al Pão de Açúcar y la bahía. Punto favorito de los cariocas para hacer ejercicio.",
    viral_trend: "Foto corriendo por la orilla con el Sugarloaf al fondo",
    address: "Av. Infante Dom Henrique, Flamengo, Rio de Janeiro",
    lat: -22.9306,
    lng: -43.1689,
    search_query: "Praia do Flamengo Rio de Janeiro",
    emoji: "🏃",
  },
  {
    name: "Igreja da Candelária",
    name_en: "Candelária Church",
    type: "visit",
    category: "landmark",
    description:
      "La iglesia más imponente del centro de Río, con su cúpula deslumbrante y fachada neoclásica. Joya arquitectónica del siglo XVIII.",
    viral_trend: "Foto del interior con la cúpula iluminada y los vitrales",
    address: "Praça Pio X, Centro, Rio de Janeiro",
    lat: -22.9006,
    lng: -43.1797,
    search_query: "Igreja da Candelária Rio de Janeiro",
    emoji: "⛪",
  },
  {
    name: "Theatro Municipal",
    name_en: "Municipal Theatre",
    type: "visit",
    category: "landmark",
    description:
      "Teatro inspirado en la Ópera de París, uno de los más bellos de Brasil. Su fachada y escalinata son un ícono del centro histórico.",
    viral_trend: "Foto en la escalinata imitando una noche de ópera",
    address: "Praça Floriano, Centro, Rio de Janeiro",
    lat: -22.9097,
    lng: -43.1764,
    search_query: "Theatro Municipal Rio de Janeiro",
    emoji: "🎭",
  },
  {
    name: "Museu do Amanhã",
    name_en: "Museum of Tomorrow",
    type: "visit",
    category: "museum",
    description:
      "Museo de ciencia futurista con una arquitectura deslumbrante a orillas de la bahía. El edificio solo ya es una obra de arte.",
    viral_trend: "Foto del exterior con el reflejo del museo en la bahía",
    address: "Praça Mauá 1, Centro, Rio de Janeiro",
    lat: -22.8947,
    lng: -43.1797,
    search_query: "Museu do Amanhã Rio de Janeiro",
    emoji: "🚀",
  },
  {
    name: "MAR - Museu de Arte do Rio",
    name_en: "Museum of Art of Rio",
    type: "visit",
    category: "museum",
    description:
      "Museo de arte con una curva ondulada icónica que conecta dos edificios históricos. Exhibe arte brasileño y exposiciones temporales.",
    viral_trend: "Foto en la azotea con vista a la bahía y el Museu do Amanhã",
    address: "Praça Mauá 5, Centro, Rio de Janeiro",
    lat: -22.8972,
    lng: -43.1797,
    search_query: "Museu de Arte do Rio MAR Rio de Janeiro",
    emoji: "🖼️",
  },
  {
    name: "Bondinho do Pão de Açúcar",
    name_en: "Sugarloaf Cable Car",
    type: "transport",
    category: "landmark",
    description:
      "El teleférico que sube al Morro da Urca y al Pão de Açúcar. El viaje en sí es parte de la experiencia, con vistas aéreas de la bahía.",
    viral_trend: "Foto dentro del teleférico de vidrio con la bahía a los pies",
    address: "Av. Pasteur 520, Urca, Rio de Janeiro",
    lat: -22.9486,
    lng: -43.1566,
    search_query: "Bondinho Pão de Açúcar Rio de Janeiro",
    emoji: "🚡",
  },
  {
    name: "Forte de Copacabana",
    name_en: "Fort Copacabana",
    type: "visit",
    category: "viewpoint",
    description:
      "Fuerte militar de 1914 en el extremo de Copacabana con mirador al mar y al Pão de Açúcar. El café del fuerte tiene la mejor vista de la playa.",
    viral_trend: "Foto en el mirador del fuerte con Copacabana y el Sugarloaf",
    address: "Praça Coronel Eugênio Franco 1, Copacabana, Rio de Janeiro",
    lat: -22.9842,
    lng: -43.1908,
    search_query: "Forte de Copacabana Rio de Janeiro",
    emoji: "🏰",
  },
  {
    name: "Pedra do Sal",
    name_en: "Pedra do Sal",
    type: "free",
    category: "nightlife",
    description:
      "Considerada la cuna de la samba en Río. Los lunes y viernes hay rodas de samba al aire libre en este callejón histórico de la Saúde.",
    viral_trend: "Video bailando samba con la banda en la calle",
    address: "R. Pedra do Sal, Saúde, Rio de Janeiro",
    lat: -22.8986,
    lng: -43.1889,
    search_query: "Pedra do Sal Rio de Janeiro",
    emoji: "🥁",
  },
  {
    name: "Praia de São Conrado",
    name_en: "São Conrado Beach",
    type: "free",
    category: "beach",
    description:
      "Playa al pie de la Pedra da Gávea, donde aterrizan los ala delta. Más tranquila que Copacabana, con arena extensa y la montaña de fondo.",
    viral_trend: "Foto con los ala delta aterrizando en la arena detrás",
    address: "Av. Niemeyer, São Conrado, Rio de Janeiro",
    lat: -22.9989,
    lng: -43.2461,
    search_query: "Praia de São Conrado Rio de Janeiro",
    emoji: "🪁",
  },
];
