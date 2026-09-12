import type { Activity } from "@/lib/types";

// Convierte "HH:MM:SS" o "HH:MM" a minutos del día
function toMin(t: string | null | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

/**
 * Detecta actividades del usuario que se solapan en horario con la actividad dada.
 * Solo compara actividades de la misma fecha y que tengan hora de inicio.
 */
export function detectConflicts(
  activity: Activity,
  myActivities: Activity[],
): Activity[] {
  if (!myActivities || myActivities.length === 0) return [];
  return myActivities.filter((a) => {
    if (a.id === activity.id) return false;
    if (a.date !== activity.date) return false;
    // Sin horas -> no se puede detectar solapamiento
    if (!a.start_time && !activity.start_time) return false;
    const aStart = toMin(a.start_time);
    const aEnd = a.end_time ? toMin(a.end_time) : aStart + 60;
    const bStart = toMin(activity.start_time);
    const bEnd = activity.end_time ? toMin(activity.end_time) : bStart + 60;
    // Solapamiento: aStart < bEnd && bStart < aEnd
    return aStart < bEnd && bStart < aEnd;
  });
}
