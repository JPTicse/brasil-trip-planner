"use client";

import { useState } from "react";
import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { EditActivityModal } from "@/components/edit-activity-modal";
import { DeleteActivityButton } from "@/components/delete-activity-button";
import { formatTime, formatDateShort, formatCurrency } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";
import { DayChips } from "@/components/day-chips";

const TYPE_BG: Record<ActivityType, string> = {
  visit: "bg-blue-500",
  tour: "bg-violet-500",
  meal: "bg-orange-500",
  event: "bg-rose-500",
  free: "bg-emerald-500",
  transport: "bg-zinc-500",
};

const TYPE_EMOJI: Record<ActivityType, string> = {
  visit: "👀",
  tour: "🚌",
  meal: "🍽️",
  event: "🎉",
  free: "🌿",
  transport: "✈️",
};

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

// Convierte "HH:MM:SS" o "HH:MM" a minutos del día
function timeToMinutes(t: string | null | undefined): number {
  if (!t) return 24 * 60; // sin hora = al final del día
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function ItineraryTimeline({
  activities,
  tripId,
  currentUserId,
  days,
  selectedDay,
  onSelectDay,
}: {
  activities: Activity[];
  tripId: string;
  currentUserId: string;
  days: string[];
  selectedDay: string;
  onSelectDay: (day: string) => void;
}) {
  // Agrupar por fecha
  const byDate = new Map<string, Activity[]>();
  for (const a of activities) {
    const list = byDate.get(a.date) ?? [];
    list.push(a);
    byDate.set(a.date, list);
  }

  const dayActivities = (byDate.get(selectedDay) ?? []).slice().sort((a, b) => {
    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  });

  // Calcular "próximo" plan: primera actividad con start_time > ahora (si el día es hoy)
  const today = new Date().toISOString().slice(0, 10);
  const isToday = selectedDay === today;
  const nowMinutes = (() => {
    const d = new Date();
    return d.getHours() * 60 + d.getMinutes();
  })();
  const nextActivityId = isToday
    ? dayActivities.find((a) => {
        if (!a.start_time) return false;
        const start = timeToMinutes(a.start_time);
        const end = a.end_time ? timeToMinutes(a.end_time) : start + 60;
        // En curso o próximo (no terminado aún)
        return end > nowMinutes;
      })?.id
    : undefined;
  // Actividades ya terminadas
  const isPast = (a: Activity) => {
    if (!isToday || !a.start_time) return false;
    const end = a.end_time ? timeToMinutes(a.end_time) : timeToMinutes(a.start_time) + 60;
    return end <= nowMinutes;
  };

  if (days.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 bg-white/50 px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No hay actividades con fechas todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Chips de días (carrusel horizontal) */}
      <DayChips
        days={days}
        selectedDay={selectedDay}
        onSelect={onSelectDay}
        getCount={(day) => (byDate.get(day) ?? []).length}
      />

      {/* Timeline del día seleccionado */}
      {dayActivities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 bg-white/50 px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            No hay planes para este día.
          </p>
        </div>
      ) : (
        <div className="relative pl-1">
          {/* Línea vertical */}
          <div className="absolute bottom-2 left-[7px] top-2 w-px bg-zinc-200 dark:bg-zinc-700" />

          <div className="space-y-3">
            {dayActivities.map((a, i) => {
              const isLast = i === dayActivities.length - 1;
              return (
                <TimelineItem
                  key={a.id}
                  activity={a}
                  tripId={tripId}
                  currentUserId={currentUserId}
                  isLast={isLast}
                  myActivities={activities}
                  isNext={nextActivityId === a.id}
                  isPastActivity={isPast(a)}
                />
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function TimelineItem({
  activity,
  tripId,
  currentUserId,
  isLast,
  myActivities,
  isNext,
  isPastActivity,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
  isLast: boolean;
  myActivities?: Activity[];
  isNext?: boolean;
  isPastActivity?: boolean;
}) {
  const participants = activity.participants ?? [];
  const isCreator = activity.created_by === currentUserId;
  const dotColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";
  const visibleAvatars = participants.slice(0, 3);
  const remaining = Math.max(0, participants.length - 3);

  const trigger = (
    <div className="group relative flex gap-3">
      {/* Hora + punto */}
      <div className="relative z-10 flex w-12 shrink-0 flex-col items-center">
        <div className={`mt-1 flex h-4 w-4 items-center justify-center rounded-full ${dotColor} ring-4 ring-white dark:ring-zinc-900`}>
          <span className="text-[8px]">{emoji}</span>
        </div>
        <span className="mt-1 text-[11px] font-bold text-zinc-700 dark:text-zinc-200">
          {activity.start_time ? formatTime(activity.start_time) : "—"}
        </span>
        {activity.end_time && (
          <span className="text-[9px] text-zinc-400 dark:text-zinc-500">
            {formatTime(activity.end_time)}
          </span>
        )}
      </div>

      {/* Card compacta */}
      <div className={`relative mb-1 flex-1 overflow-hidden rounded-xl border bg-white shadow-sm transition active:scale-[0.99] hover:shadow-md dark:bg-zinc-900 ${
        isNext
          ? "border-emerald-500 ring-1 ring-emerald-500/30"
          : "border-zinc-100 dark:border-zinc-800"
      } ${isPastActivity ? "opacity-50" : ""}`}>
        {isNext && (
          <span className="absolute right-2 top-2 z-10 rounded-full bg-emerald-500 px-2 py-0.5 text-[9px] font-bold text-white shadow-sm">
            PRÓXIMO
          </span>
        )}
        {activity.image_url ? (
          <div className="relative h-16 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />
          </div>
        ) : null}

        <div className="p-2.5">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-1 text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {activity.title}
            </h4>
            {isCreator && (
              <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                <EditActivityModal activity={activity} tripId={tripId} currentUserId={currentUserId} />
                <DeleteActivityButton
                  activity={activity}
                  tripId={tripId}
                  className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-red-500 hover:text-white active:scale-90 dark:bg-zinc-800 dark:text-zinc-400"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </DeleteActivityButton>
              </div>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">
            <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            {activity.location && (
              <span className="flex items-center gap-0.5">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="max-w-[140px] truncate">{activity.location}</span>
              </span>
            )}
            {activity.cost !== null && activity.cost > 0 && (
              <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(activity.cost, activity.currency)}
              </span>
            )}
          </div>

          {participants.length > 0 && (
            <div className="mt-1.5 flex -space-x-1.5" onClick={(e) => e.stopPropagation()}>
              {visibleAvatars.map((p, i) => {
                const name = p.profile?.name ?? "Usuario";
                return (
                  <div
                    key={p.id}
                    className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white bg-emerald-600 text-[8px] font-bold text-white shadow-sm dark:border-zinc-900"
                    style={{ zIndex: 3 - i }}
                    title={name}
                  >
                    {p.profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profile?.avatar_url} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(name)
                    )}
                  </div>
                );
              })}
              {remaining > 0 && (
                <div className="z-10 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-zinc-700 text-[8px] font-bold text-white shadow-sm dark:border-zinc-900">
                  +{remaining}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={trigger} myActivities={myActivities} />;
}
