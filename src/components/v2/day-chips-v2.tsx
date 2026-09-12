"use client";

import { useRef, useState, useEffect } from "react";

/**
 * Day chips minimalista v2.
 * - Sin badges de conteo
 * - Sin flechas de scroll
 * - Estado activo monocromo
 * - Punto esmeralda para "hoy"
 * - Más pequeño y limpio
 */
export function DayChipsV2({
  days,
  selectedDay,
  onSelect,
}: {
  days: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = new Date().toISOString().slice(0, 10);

  // Auto-scroll al día seleccionado
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
        const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(d);
        const dayNum = d.getDate();

        return (
          <button
            key={day}
            onClick={() => onSelect(day)}
            className={`relative flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-lg border transition active:scale-95 ${
              isActive
                ? "border-stone-900 bg-stone-900 text-white dark:border-white dark:bg-white dark:text-stone-900"
                : "border-stone-200 bg-white text-stone-600 dark:border-stone-800 dark:bg-stone-900 dark:text-stone-400"
            }`}
          >
            {isToday && !isActive && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            <span className="text-[10px] font-medium uppercase opacity-70">
              {weekday}
            </span>
            <span className="text-base font-bold leading-tight">{dayNum}</span>
          </button>
        );
      })}
    </div>
  );
}
