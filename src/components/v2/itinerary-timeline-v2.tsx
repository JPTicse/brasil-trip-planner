"use client";

import { motion } from "motion/react";
import { ActivityDetailModalV2 as ActivityDetailModal } from "@/components/v2/activity-detail-modal-v2";
import { EditActivityModal } from "@/components/edit-activity-modal";
import { DeleteActivityButton } from "@/components/delete-activity-button";
import { formatTime, formatCurrency } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";

const TYPE_DOT: Record<ActivityType, string> = {
  visit: "bg-blue-500",
  tour: "bg-violet-500",
  meal: "bg-orange-500",
  event: "bg-rose-500",
  free: "bg-emerald-500",
  transport: "bg-zinc-500",
};

const TYPE_BORDER: Record<ActivityType, string> = {
  visit: "border-l-blue-500",
  tour: "border-l-violet-500",
  meal: "border-l-orange-500",
  event: "border-l-rose-500",
  free: "border-l-emerald-500",
  transport: "border-l-zinc-500",
};
import { haptic } from "@/lib/haptics";
import { DayChipsV2 } from "@/components/v2/day-chips-v2";

// Variantes para la entrada escalonada de las tarjetas del timeline.
const containerVariants = {
  hidden: {},
  show: {
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 8 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: "easeOut" as const },
  },
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

function timeToMinutes(t: string | null | undefined): number {
  if (!t) return 24 * 60;
  const [h, m] = t.split(":").map(Number);
  return h * 60 + (m || 0);
}

export function ItineraryTimelineV2({
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
  const byDate = new Map<string, Activity[]>();
  for (const a of activities) {
    const list = byDate.get(a.date) ?? [];
    list.push(a);
    byDate.set(a.date, list);
  }

  const dayActivities = (byDate.get(selectedDay) ?? []).slice().sort((a, b) => {
    return timeToMinutes(a.start_time) - timeToMinutes(b.start_time);
  });

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
        return end > nowMinutes;
      })?.id
    : undefined;
  const isPast = (a: Activity) => {
    if (!isToday || !a.start_time) return false;
    const end = a.end_time ? timeToMinutes(a.end_time) : timeToMinutes(a.start_time) + 60;
    return end <= nowMinutes;
  };

  if (days.length === 0) {
    return (
      <div className="py-16 text-center">
        <p className="text-sm text-zinc-400 dark:text-zinc-500">
          No hay actividades con fechas todavía.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <DayChipsV2 days={days} selectedDay={selectedDay} onSelect={onSelectDay} activities={activities} />

      {dayActivities.length === 0 ? (
        <div className="py-16 text-center">
          <p className="text-sm text-zinc-400 dark:text-zinc-500">
            No hay planes para este día.
          </p>
        </div>
      ) : (
        <div className="relative pl-1">
          {/* Línea vertical fina */}
          <div className="absolute bottom-2 left-[5px] top-2 w-px bg-zinc-200 dark:bg-zinc-800" />

          <motion.div
            key={selectedDay}
            className="space-y-4"
            variants={containerVariants}
            initial="hidden"
            animate="show"
          >
            {dayActivities.map((a, i) => {
              const isLast = i === dayActivities.length - 1;
              return (
                <motion.div key={a.id} variants={itemVariants}>
                  <TimelineItemV2
                    activity={a}
                    tripId={tripId}
                    currentUserId={currentUserId}
                    isLast={isLast}
                    myActivities={activities}
                    isNext={nextActivityId === a.id}
                    isPastActivity={isPast(a)}
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>
      )}
    </div>
  );
}

function TimelineItemV2({
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
  const visibleAvatars = participants.slice(0, 3);
  const remaining = Math.max(0, participants.length - 3);

  const trigger = (
    <div
      className="group relative flex gap-3"
      onClick={() => haptic("light")}
    >
      {/* Hora + punto (sin emoji, sin color de tipo) */}
      <div className="relative z-10 flex w-10 shrink-0 flex-col items-center">
        <div
          className={`mt-1 h-2.5 w-2.5 rounded-full ring-4 ring-white dark:ring-zinc-950 ${
            isNext ? "bg-emerald-500" : TYPE_DOT[activity.type]
          }`}
        />
        <span className="mt-1.5 text-xs font-medium text-zinc-600 dark:text-zinc-400">
          {activity.start_time ? formatTime(activity.start_time) : "—"}
        </span>
      </div>

      {/* Card minimalista: sin sombra, borde sutil */}
      <div
        className={`relative mb-1 flex-1 overflow-hidden rounded-xl border bg-white transition active:scale-[0.99] dark:bg-zinc-900 ${
          isNext
            ? "border-emerald-500"
            : "border-zinc-200 dark:border-zinc-800 border-l-4 " + TYPE_BORDER[activity.type]
        } ${isPastActivity ? "opacity-40" : ""}`}
      >
        {isNext && (
          <motion.span
            className="absolute right-2 top-2 z-10 text-[10px] font-medium text-emerald-600 dark:text-emerald-400"
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: [0.6, 1.2, 1], opacity: 1 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          >
            Próximo
          </motion.span>
        )}
        {activity.image_url ? (
          <div className="relative h-14 w-full overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-transparent" />
          </div>
        ) : null}

        <div className="p-3">
          <div className="flex items-start justify-between gap-2">
            <h4 className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {activity.title}
            </h4>
            {isCreator && (
              <div className="flex shrink-0 gap-1" onClick={(e) => e.stopPropagation()}>
                <EditActivityModal activity={activity} tripId={tripId} currentUserId={currentUserId} />
                <DeleteActivityButton
                  activity={activity}
                  tripId={tripId}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-zinc-400 transition hover:bg-red-500 hover:text-white active:scale-90 dark:text-zinc-500"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </DeleteActivityButton>
              </div>
            )}
          </div>

          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-1 font-medium">
              <span className={`h-2 w-2 rounded-full ${TYPE_DOT[activity.type]}`} />
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            {activity.location && (
              <span className="flex items-center gap-0.5">
                <span className="text-zinc-300 dark:text-zinc-600">·</span>
                <span className="max-w-[140px] truncate">{activity.location}</span>
              </span>
            )}
            {activity.cost !== null && activity.cost > 0 && (
              <span className="text-zinc-300 dark:text-zinc-600">·</span>
            )}
            {activity.cost !== null && activity.cost > 0 && (
              <span className="font-medium text-zinc-700 dark:text-zinc-300">
                {formatCurrency(activity.cost, activity.currency)}
              </span>
            )}
          </div>

          {participants.length > 0 && (
            <div className="mt-2 flex -space-x-1.5" onClick={(e) => e.stopPropagation()}>
              {visibleAvatars.map((p, i) => {
                const name = p.profile?.name ?? "Usuario";
                return (
                  <div
                    key={p.id}
                    className="relative flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white bg-zinc-200 text-[8px] font-bold text-zinc-600 dark:border-zinc-900 dark:bg-zinc-700 dark:text-zinc-200"
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
                <div className="z-10 flex h-5 w-5 items-center justify-center rounded-full border border-white bg-zinc-300 text-[8px] font-bold text-zinc-600 dark:border-zinc-900 dark:bg-zinc-600 dark:text-zinc-200">
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
