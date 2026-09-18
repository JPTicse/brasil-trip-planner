"use client";

import { useState } from "react";
import { parseLocalDate, formatDateShort, getDaysBetween } from "@/lib/format";
import type { Accommodation } from "@/lib/types";

// Colores para diferenciar alojamientos en la timeline
const ACCENT_COLORS = [
  { bg: "bg-emerald-500", text: "text-emerald-700", light: "bg-emerald-50", border: "border-emerald-300", dot: "bg-emerald-500" },
  { bg: "bg-blue-500", text: "text-blue-700", light: "bg-blue-50", border: "border-blue-300", dot: "bg-blue-500" },
  { bg: "bg-violet-500", text: "text-violet-700", light: "bg-violet-50", border: "border-violet-300", dot: "bg-violet-500" },
  { bg: "bg-amber-500", text: "text-amber-700", light: "bg-amber-50", border: "border-amber-300", dot: "bg-amber-500" },
  { bg: "bg-rose-500", text: "text-rose-700", light: "bg-rose-50", border: "border-rose-300", dot: "bg-rose-500" },
  { bg: "bg-cyan-500", text: "text-cyan-700", light: "bg-cyan-50", border: "border-cyan-300", dot: "bg-cyan-500" },
  { bg: "bg-indigo-500", text: "text-indigo-700", light: "bg-indigo-50", border: "border-indigo-300", dot: "bg-indigo-500" },
  { bg: "bg-teal-500", text: "text-teal-700", light: "bg-teal-50", border: "border-teal-300", dot: "bg-teal-500" },
];

function dateToIndex(date: string, allDays: string[]): number {
  return allDays.indexOf(date);
}

export function AccommodationTimeline({
  accommodations,
  tripStartDate,
  tripEndDate,
}: {
  accommodations: Accommodation[];
  tripStartDate: string | null;
  tripEndDate: string | null;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Determinar el rango de fechas a mostrar
  // Usar las fechas del viaje si existen; si no, derivar de los alojamientos
  let rangeStart = tripStartDate;
  let rangeEnd = tripEndDate;

  const accsWithDates = accommodations.filter((a) => a.check_in || a.check_out);
  if (!rangeStart && accsWithDates.length > 0) {
    rangeStart = accsWithDates
      .map((a) => a.check_in)
      .filter(Boolean)
      .sort()[0] ?? null;
  }
  if (!rangeEnd && accsWithDates.length > 0) {
    rangeEnd = accsWithDates
      .map((a) => a.check_out)
      .filter(Boolean)
      .sort()
      .reverse()[0] ?? null;
  }

  if (!rangeStart || !rangeEnd) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white/50 px-4 py-6 text-center dark:border-zinc-600 dark:bg-zinc-800/30">
        <p className="text-xs text-zinc-400">
          Añade alojamientos con fechas para ver la línea de tiempo.
        </p>
      </div>
    );
  }

  const allDays = getDaysBetween(rangeStart, rangeEnd);
  if (allDays.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-300 bg-white/50 px-4 py-6 text-center dark:border-zinc-600 dark:bg-zinc-800/30">
        <p className="text-xs text-zinc-400">
          Las fechas del viaje no son válidas.
        </p>
      </div>
    );
  }

  // Asignar color a cada alojamiento
  const colorMap = new Map<string, typeof ACCENT_COLORS[number]>();
  accommodations.forEach((acc, i) => {
    colorMap.set(acc.id, ACCENT_COLORS[i % ACCENT_COLORS.length]);
  });

  // Detectar qué días tienen alojamiento
  const coveredDays = new Set<string>();
  for (const acc of accommodations) {
    if (!acc.check_in || !acc.check_out) continue;
    const days = getDaysBetween(acc.check_in, acc.check_out);
    for (const d of days) coveredDays.add(d);
  }

  const gapDays = allDays.filter((d) => !coveredDays.has(d));
  const hasGaps = gapDays.length > 0;

  // Agrupar días consecutivos sin alojamiento para mostrar como rangos
  const gapRanges: { start: string; end: string; count: number }[] = [];
  let currentGap: string[] = [];
  for (const day of allDays) {
    if (!coveredDays.has(day)) {
      currentGap.push(day);
    } else if (currentGap.length > 0) {
      gapRanges.push({
        start: currentGap[0],
        end: currentGap[currentGap.length - 1],
        count: currentGap.length,
      });
      currentGap = [];
    }
  }
  if (currentGap.length > 0) {
    gapRanges.push({
      start: currentGap[0],
      end: currentGap[currentGap.length - 1],
      count: currentGap.length,
    });
  }

  return (
    <div className="space-y-3">
      {/* Timeline visual horizontal */}
      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Línea de tiempo
          </h3>
          <span className="text-[11px] text-zinc-400">
            {allDays.length} {allDays.length === 1 ? "día" : "días"}
            {hasGaps && (
              <span className="ml-2 text-amber-600 dark:text-amber-400">
                · {gapDays.length} sin alojamiento
              </span>
            )}
          </span>
        </div>

        {/* Barra de días */}
        <div className="flex gap-px overflow-x-auto pb-1">
          {allDays.map((day, i) => {
            const isCovered = coveredDays.has(day);
            const isFirst = i === 0;
            const isLast = i === allDays.length - 1;
            return (
              <div
                key={day}
                className={`flex h-8 min-w-[28px] flex-1 items-center justify-center rounded-sm text-[9px] font-medium ${
                  isCovered
                    ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                    : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                } ${isFirst ? "rounded-l-md" : ""} ${isLast ? "rounded-r-md" : ""}`}
                title={formatDateShort(day)}
              >
                {parseLocalDate(day)?.getDate()}
              </div>
            );
          })}
        </div>

        {/* Etiquetas de fecha inicial y final */}
        <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
          <span>{formatDateShort(rangeStart)}</span>
          <span>{formatDateShort(rangeEnd)}</span>
        </div>

        {/* Barras de cada alojamiento */}
        <div className="mt-4 space-y-2">
          {accommodations
            .filter((acc) => acc.check_in && acc.check_out)
            .map((acc) => {
              const color = colorMap.get(acc.id)!;
              const startIndex = dateToIndex(acc.check_in!, allDays);
              const endIndex = dateToIndex(acc.check_out!, allDays);
              if (startIndex < 0 || endIndex < 0) return null;

              // Calcular posición y anchura como porcentajes
              const totalDays = allDays.length;
              const leftPercent = (startIndex / totalDays) * 100;
              const widthPercent = ((endIndex - startIndex + 1) / totalDays) * 100;
              const isSelected = selectedId === acc.id;

              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedId(isSelected ? null : acc.id)}
                  className={`group relative block w-full text-left transition ${isSelected ? "opacity-100" : "opacity-80 hover:opacity-100"}`}
                >
                  <div className="relative h-6 w-full rounded bg-zinc-100 dark:bg-zinc-700/50">
                    <div
                      className={`absolute top-0 h-6 rounded ${color.bg} flex items-center justify-center overflow-hidden px-1 transition ${
                        isSelected ? "ring-2 ring-offset-1 ring-zinc-400 dark:ring-offset-zinc-800" : ""
                      }`}
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        minWidth: "20px",
                      }}
                    >
                      <span className="truncate text-[9px] font-semibold text-white">
                        {acc.name}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
        </div>

        {/* Huecos detectados */}
        {hasGaps && (
          <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 dark:bg-amber-900/20">
            <div className="flex items-center gap-1.5">
              <svg className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 9v4M12 17h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[11px] font-medium text-amber-700 dark:text-amber-400">
                {gapRanges.length} {gapRanges.length === 1 ? "hueco" : "huecos"} sin alojamiento:
              </p>
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {gapRanges.map((gap, i) => (
                <span
                  key={i}
                  className="rounded bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                >
                  {gap.start === gap.end
                    ? formatDateShort(gap.start)
                    : `${formatDateShort(gap.start)} → ${formatDateShort(gap.end)}`}
                  <span className="ml-1 opacity-60">({gap.count}d)</span>
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Leyenda */}
      {accommodations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {accommodations.map((acc) => {
            const color = colorMap.get(acc.id)!;
            return (
              <button
                key={acc.id}
                onClick={() => setSelectedId(selectedId === acc.id ? null : acc.id)}
                className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium transition ${
                  selectedId === acc.id
                    ? `${color.light} ${color.border} ${color.text}`
                    : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${color.dot}`} />
                <span className="max-w-[120px] truncate">{acc.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
