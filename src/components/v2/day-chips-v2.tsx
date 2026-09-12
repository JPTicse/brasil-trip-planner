"use client";

import { useRef, useEffect } from "react";
import { DayChipWater1 } from "@/components/v2/day-chips-water-1";
import { DayChipWater2 } from "@/components/v2/day-chips-water-2";
import { DayChipWater3 } from "@/components/v2/day-chips-water-3";
import { type Activity } from "@/lib/types";

function timeToMinutes(t: string | null | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

/**
 * Calcula el porcentaje de horas agendadas vs 16 horas disponibles.
 */
function getFillPercent(day: string, activities: Activity[]): number {
  const dayActivities = activities.filter((a) => a.date === day);
  let totalMinutes = 0;
  for (const a of dayActivities) {
    if (!a.start_time) continue;
    const start = timeToMinutes(a.start_time);
    const end = a.end_time ? timeToMinutes(a.end_time) : start + 60;
    totalMinutes += Math.max(0, end - start);
  }
  const maxMinutes = 16 * 60; // 16 horas disponibles
  return Math.min(100, Math.round((totalMinutes / maxMinutes) * 100));
}

/**
 * Determina qué efecto de agua usar según el número del día:
 * - Múltiplo de 3 → efecto 3 (burbujas)
 * - Múltiplo de 2 (no de 3) → efecto 2 (bloques)
 * - Resto → efecto 1 (onda suave)
 */
function getEffectForDay(dayNum: number): 1 | 2 | 3 {
  if (dayNum % 3 === 0) return 3;
  if (dayNum % 2 === 0) return 2;
  return 1;
}

/**
 * Day chips v2 con efecto de "agua" que muestra cuántas horas
 * de actividades están agendadas por día.
 *
 * Cada día usa un efecto distinto para comparar:
 * - Efecto 1: onda suave (días no múltiplos de 2 ni 3)
 * - Efecto 2: bloques escalonados (días múltiplos de 2)
 * - Efecto 3: burbujas (días múltiplos de 3)
 */
export function DayChipsV2({
  days,
  selectedDay,
  onSelect,
  activities = [],
}: {
  days: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
  activities?: Activity[];
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const idx = days.indexOf(selectedDay);
    if (idx < 0) return;
    const child = el.children[idx] as HTMLElement | undefined;
    child?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [selectedDay, days]);

  if (days.length === 0) return null;

  return (
    <div
      ref={scrollRef}
      className="flex gap-2 overflow-x-auto pb-1"
      style={{ scrollbarWidth: "none" }}
    >
      {days.map((day, idx) => {
        const isActive = day === selectedDay;
        const isToday = day === today;
        const d = new Date(day + "T00:00");
        const dayNum = d.getDate();
        const fillPercent = getFillPercent(day, activities);
        const effect = getEffectForDay(dayNum);

        const chipProps = {
          day,
          dayNum,
          isSelected: isActive,
          isToday,
          fillPercent,
          onSelect: () => onSelect(day),
        };

        return (
          <div key={day} className="shrink-0">
            {effect === 1 && <DayChipWater1 {...chipProps} />}
            {effect === 2 && <DayChipWater2 {...chipProps} />}
            {effect === 3 && <DayChipWater3 {...chipProps} />}
          </div>
        );
      })}
    </div>
  );
}
