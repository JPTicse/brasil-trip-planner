"use client";

import { useRef, useState, useEffect } from "react";
import { motion } from "motion/react";
import { haptic } from "@/lib/haptics";

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
          <motion.button
            key={day}
            onClick={() => {
              haptic("light");
              onSelect(day);
            }}
            animate={{ scale: isActive ? 1.06 : 1 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: "spring", stiffness: 500, damping: 14, mass: 0.6 }}
            className={`relative flex h-12 w-11 shrink-0 flex-col items-center justify-center rounded-lg border ${
              isActive
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900"
                : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
            }`}
          >
            {isToday && !isActive && (
              <span className="absolute right-1 top-1 h-1.5 w-1.5 rounded-full bg-emerald-500" />
            )}
            <span className="text-[10px] font-medium uppercase opacity-70">
              {weekday}
            </span>
            <span className="text-base font-bold leading-tight">{dayNum}</span>
          </motion.button>
        );
      })}
    </div>
  );
}
