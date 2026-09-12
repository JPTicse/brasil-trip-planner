// Tipos para el motor de recomendación de fotos trending.
// Inspirado en respuestas de IA tipo GPT: pose, ángulo, ropa, hora, score Instagram.

export type PhotoConcept = {
  // Título corto de la foto (ej: "Silueta al atardecer")
  title: string;
  // Descripción de la pose exacta
  pose: string;
  // Ángulo/posición de cámara (ej: "Cámara baja, a la altura de la cintura")
  camera_angle: string;
  // Mejor momento del día (ej: "Atardecer", "Blue hour", "Mañana temprano")
  best_time: string;
  // Ropa sugerida
  clothing: string;
  // Score de Instagram (1-10)
  instagram_score: number;
  // Tip de equipo (ej: "iPhone 2x zoom", "Action 4 POV", "Gran angular")
  camera_tip?: string;
  // Formato de foto (ej: "Vertical 4:5", "Horizontal", "Cuadrada")
  format?: string;
  // Nota de seguridad si aplica
  safety_note?: string;
};

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
  // NUEVO: conceptos de foto detallados (como respuesta de IA)
  photo_concepts?: PhotoConcept[];
  // NUEVO: score general de Instagram (promedio de photo_concepts)
  instagram_score?: number;
  // NUEVO: dificultad para llegar (1=fácil, 5=difícil)
  difficulty?: number;
  // NUEVO: mejor hora del día
  best_time?: string;
  address: string;
  lat: number;
  lng: number;
  search_query: string;
  emoji: string;
};
