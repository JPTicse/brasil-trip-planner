"use client";

import { useRef, useState, useEffect } from "react";

/**
 * Carrusel horizontal compacto de chips de días.
 * - Chips pequeños con día de la semana, número y mes
 * - Badge de cantidad en esquina superior derecha (estilo notificación)
 * - Flechas sutilmente al desplazarse
 */
export function DayChips({
  days,
  selectedDay,
  onSelect,
  getCount,
}: {
  days: string[];
  selectedDay: string;
  onSelect: (day: string) => void;
  getCount: (day: string) => number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);
  const today = new Date().toISOString().slice(0, 10);

  const update = () => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    update();
    const el = scrollRef.current;
    if (!el) return;
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [days.length]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 160, behavior: "smooth" });
  };

  if (days.length === 0) return null;

  return (
    <div className="relative">
      {/* Flecha izquierda */}
      <button
        type="button"
        onClick={() => scrollBy(-1)}
        className={`absolute -left-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 shadow-sm transition dark:bg-zinc-800 dark:text-zinc-300 ${
          canLeft ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label="Anterior"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {/* Carrusel */}
      <div
        ref={scrollRef}
        className="scrollbar-thin flex gap-2 overflow-x-auto px-1 py-1"
      >
        {days.map((day) => {
          const isActive = day === selectedDay;
          const isToday = day === today;
          const count = getCount(day);
          const d = new Date(day + "T00:00");
          const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(d);
          const dayNum = d.getDate();
          const month = new Intl.DateTimeFormat("es-ES", { month: "short" }).format(d);
          const hasCount = count > 0;

          return (
            <button
              key={day}
              onClick={() => onSelect(day)}
              className={`relative flex h-16 w-12 shrink-0 flex-col items-center justify-center rounded-xl border text-center transition active:scale-95 ${
                isActive
                  ? "border-emerald-500 bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                  : isToday
                    ? "border-emerald-400 bg-white text-emerald-600 dark:bg-zinc-800 dark:text-emerald-400"
                    : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
              }`}
            >
              {/* Punto de "hoy" */}
              {isToday && !isActive && (
                <span className="absolute left-1/2 top-1 h-1.5 w-1.5 -translate-x-1/2 rounded-full bg-emerald-500" />
              )}
              {/* Badge de cantidad esquina superior derecha */}
              {hasCount && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-emerald-500 px-1 text-[10px] font-bold leading-none text-white dark:border-zinc-900">
                  {count > 9 ? "9+" : count}
                </span>
              )}

              <span className="text-[9px] font-bold uppercase tracking-wide opacity-80">
                {weekday}
              </span>
              <span className="text-base font-extrabold leading-tight">{dayNum}</span>
              <span className="text-[9px] font-medium uppercase opacity-70">
                {month}
              </span>
            </button>
          );
        })}
      </div>

      {/* Flecha derecha */}
      <button
        type="button"
        onClick={() => scrollBy(1)}
        className={`absolute -right-2 top-1/2 z-10 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-full bg-zinc-100 text-zinc-600 shadow-sm transition dark:bg-zinc-800 dark:text-zinc-300 ${
          canRight ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        aria-label="Siguiente"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}
