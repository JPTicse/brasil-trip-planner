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
  const arrivalsByDay = new Map<string, Accommodation[]>();
  const departuresByDay = new Map<string, Accommodation[]>();
  for (const acc of accommodations) {
    if (!acc.check_in || !acc.check_out || acc.check_out <= acc.check_in) continue;
    for (const day of allDays) {
      if (day >= acc.check_in && day < acc.check_out) coveredDays.add(day);
    }
    arrivalsByDay.set(acc.check_in, [...(arrivalsByDay.get(acc.check_in) ?? []), acc]);
    departuresByDay.set(acc.check_out, [...(departuresByDay.get(acc.check_out) ?? []), acc]);
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
                · {gapDays.length} {gapDays.length === 1 ? "noche" : "noches"} sin alojamiento
              </span>
            )}
          </span>
        </div>

        {/* Barra de días */}
        <div className="flex gap-px overflow-x-auto pb-1">
          {allDays.map((day, i) => {
            const isCovered = coveredDays.has(day);
            const hasArrival = arrivalsByDay.has(day);
            const hasDeparture = departuresByDay.has(day);
            const isTransfer = hasArrival && hasDeparture;
            const isFirst = i === 0;
            const isLast = i === allDays.length - 1;
            const eventLabel = isTransfer
              ? "traslado: salida y entrada"
              : hasDeparture
                ? "checkout: sin alojamiento para esta noche"
                : hasArrival
                  ? "check-in"
                  : isCovered
                    ? "alojamiento confirmado"
                    : "sin alojamiento";
            return (
              <div
                key={day}
                className={`relative flex h-9 min-w-[31px] flex-1 items-center justify-center rounded-sm text-[9px] font-medium ${
                  isTransfer
                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                    : isCovered
                      ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                      : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                } ${isFirst ? "rounded-l-md" : ""} ${isLast ? "rounded-r-md" : ""}`}
                title={`${formatDateShort(day)} · ${eventLabel}`}
              >
                <span>{parseLocalDate(day)?.getDate()}</span>
                {(hasArrival || hasDeparture) && (
                  <span className="absolute bottom-0.5 flex items-center gap-0.5">
                    {hasDeparture && <span className="h-1 w-1 rounded-full bg-rose-500" />}
                    {hasArrival && <span className="h-1 w-1 rounded-full bg-blue-500" />}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Etiquetas de fecha inicial y final */}
        <div className="mt-1 flex justify-between text-[10px] text-zinc-400">
          <span>{formatDateShort(rangeStart)}</span>
          <span>{formatDateShort(rangeEnd)}</span>
        </div>

        {allDays.some((day) => departuresByDay.has(day)) && (
          <div className="mt-3 space-y-1.5">
            {allDays
              .filter((day) => departuresByDay.has(day))
              .map((day) => {
                const departures = departuresByDay.get(day) ?? [];
                const arrivals = arrivalsByDay.get(day) ?? [];
                return (
                  <div
                    key={day}
                    className={`flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-[10px] ${
                      arrivals.length > 0
                        ? "bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300"
                        : coveredDays.has(day)
                          ? "bg-zinc-50 text-zinc-600 dark:bg-zinc-700/40 dark:text-zinc-300"
                          : "bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-300"
                    }`}
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-rose-500" />
                    <span className="font-semibold">{formatDateShort(day)}</span>
                    <span className="truncate">
                      {arrivals.length > 0
                        ? `Traslado: ${departures.map((acc) => acc.name).join(", ")} → ${arrivals.map((acc) => acc.name).join(", ")}`
                        : coveredDays.has(day)
                          ? `Checkout de ${departures.map((acc) => acc.name).join(", ")}`
                          : `Checkout de ${departures.map((acc) => acc.name).join(", ")} · noche sin reservar`}
                    </span>
                  </div>
                );
              })}
          </div>
        )}

        {/* Barras de cada alojamiento */}
        <div className="relative mt-4 h-8 w-full rounded-md bg-zinc-100 dark:bg-zinc-700/50">
          {accommodations
            .filter((acc) => acc.check_in && acc.check_out)
            .map((acc) => {
              const color = colorMap.get(acc.id)!;
              const startIndex = dateToIndex(acc.check_in!, allDays);
              const endIndex = dateToIndex(acc.check_out!, allDays);
              if (startIndex < 0 || endIndex <= startIndex) return null;

              // Calcular posición y anchura como porcentajes
              const totalDays = allDays.length;
              const leftPercent = (startIndex / totalDays) * 100;
              const widthPercent = ((endIndex - startIndex) / totalDays) * 100;
              const isSelected = selectedId === acc.id;

              return (
                <div
                  key={acc.id}
                  className="absolute top-0 h-8"
                  style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}
                >
                  <button
                    onClick={() => setSelectedId(isSelected ? null : acc.id)}
                    className={`relative flex h-full w-full items-center justify-center overflow-hidden rounded px-1 text-left transition ${color.bg} ${
                      isSelected
                        ? "z-10 opacity-100 ring-2 ring-zinc-400 ring-offset-1 dark:ring-offset-zinc-800"
                        : "opacity-80 hover:opacity-100"
                    }`}
                    title={`${acc.name} · ${formatDateShort(acc.check_in)} → ${formatDateShort(acc.check_out)}`}
                  >
                    <span className="truncate text-[9px] font-semibold text-white">
                      {acc.name}
                    </span>
                  </button>
                  <span
                    className="pointer-events-none absolute right-0 top-1/2 z-20 h-3 w-3 translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-rose-500 shadow-sm dark:border-zinc-700"
                    title={`Checkout · ${formatDateShort(acc.check_out)}`}
                  />
                </div>
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
                {gapRanges.length} {gapRanges.length === 1 ? "periodo" : "periodos"} con noches sin alojamiento:
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
