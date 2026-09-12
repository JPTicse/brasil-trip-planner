"use client";

import { useRef, useEffect } from "react";
import { DayChipWater1 } from "@/components/v2/day-chips-water-1";
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
 * Day chips v2 con efecto de "agua" que muestra cuántas horas
 * de actividades están agendadas por día.
 *
 * Usa el efecto 1 (onda suave) para todos los días.
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
      {days.map((day) => {
        const isActive = day === selectedDay;
        const isToday = day === today;
        const d = new Date(day + "T00:00");
        const dayNum = d.getDate();
        const fillPercent = getFillPercent(day, activities);

        return (
          <div key={day} className="shrink-0">
            <DayChipWater1
              day={day}
              dayNum={dayNum}
              isSelected={isActive}
              isToday={isToday}
              fillPercent={fillPercent}
              onSelect={() => onSelect(day)}
            />
          </div>
        );
      })}
    </div>
  );
}
