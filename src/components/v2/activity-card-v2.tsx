"use client";

import { ActivityDetailModalV2 as ActivityDetailModal } from "@/components/v2/activity-detail-modal-v2";
import { EditActivityModal } from "@/components/edit-activity-modal";
import { DeleteActivityButton } from "@/components/delete-activity-button";
import { formatTime, formatDateShort, formatCurrency } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";

// Colored dot per type — "free" uses teal to distinguish from the emerald accent
const TYPE_DOT: Record<ActivityType, string> = {
  visit: "bg-blue-500",
  tour: "bg-violet-500",
  meal: "bg-orange-500",
  event: "bg-rose-500",
  free: "bg-teal-500",
  transport: "bg-zinc-500",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function ActivityCardV2({
  activity,
  tripId,
  currentUserId,
  myActivities,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
  myActivities?: Activity[];
}) {
  const participants = activity.participants ?? [];
  const isCreator = activity.created_by === currentUserId;
  const visibleAvatars = participants.slice(0, 3);
  const remaining = Math.max(0, participants.length - 3);

  const card = (
    <div className="group relative aspect-[16/9] overflow-hidden rounded-xl border border-stone-200 transition active:scale-[0.98] dark:border-stone-800">
      {activity.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activity.image_url}
            alt={activity.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        </>
      ) : (
        <div className="h-full w-full bg-stone-100 dark:bg-stone-800" />
      )}

      <div className="absolute inset-0 flex flex-col justify-between p-3">
        {/* Arriba: tipo y acciones */}
        <div className="flex items-start justify-between">
          <span className="flex items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-white/80">
            <span className={`h-1.5 w-1.5 rounded-full ${TYPE_DOT[activity.type]}`} />
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
          {isCreator && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <EditActivityModal activity={activity} tripId={tripId} currentUserId={currentUserId} />
              <DeleteActivityButton
                activity={activity}
                tripId={tripId}
                className="flex h-6 w-6 items-center justify-center rounded-full text-white/70 transition hover:bg-red-500 hover:text-white active:scale-90"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </DeleteActivityButton>
            </div>
          )}
        </div>

        {/* Abajo: info */}
        <div className={activity.image_url ? "text-white" : "text-stone-900 dark:text-stone-100"}>
          <h4 className="line-clamp-1 text-base font-semibold leading-tight">
            {activity.title}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs opacity-80">
            <span>{formatDateShort(activity.date)}</span>
            {(activity.start_time || activity.end_time) && (
              <span className="text-stone-300 dark:text-stone-600">
                · {formatTime(activity.start_time)}
                {activity.end_time && ` – ${formatTime(activity.end_time)}`}
              </span>
            )}
            {activity.location && (
              <span className="text-stone-300 dark:text-stone-600">·</span>
            )}
            {activity.location && (
              <span className="max-w-[140px] truncate">{activity.location}</span>
            )}
            {activity.cost !== null && activity.cost > 0 && (
              <span className="text-stone-300 dark:text-stone-600">·</span>
            )}
            {activity.cost !== null && activity.cost > 0 && (
              <span className="font-medium">{formatCurrency(activity.cost, activity.currency)}</span>
            )}
          </div>

          {participants.length > 0 && (
            <div className="mt-2 flex -space-x-1.5" onClick={(e) => e.stopPropagation()}>
              {visibleAvatars.map((p, i) => {
                const name = p.profile?.name ?? "Usuario";
                return (
                  <div
                    key={p.id}
                    className="relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border border-white bg-stone-200 text-[9px] font-bold text-stone-600 dark:border-stone-900 dark:bg-stone-700 dark:text-stone-200"
                    style={{ zIndex: 3 - i }}
                    title={name}
                  >
                    {p.profile?.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.profile.avatar_url} alt={name} className="h-full w-full object-cover" />
                    ) : (
                      getInitials(name)
                    )}
                  </div>
                );
              })}
              {remaining > 0 && (
                <div className="z-10 flex h-6 w-6 items-center justify-center rounded-full border border-white bg-stone-300 text-[9px] font-bold text-stone-600 dark:border-stone-900 dark:bg-stone-600 dark:text-stone-200">
                  +{remaining}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={card} myActivities={myActivities} />
  );
}
