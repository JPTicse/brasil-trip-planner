"use client";

import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { EditActivityModal } from "@/components/edit-activity-modal";
import { deleteActivity } from "@/lib/actions";
import { formatTime, formatDateShort, formatCurrency } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";
import { ConfirmButton } from "@/components/confirm-button";

const TYPE_BG: Record<ActivityType, string> = {
  visit: "bg-blue-600",
  tour: "bg-violet-600",
  meal: "bg-orange-600",
  event: "bg-rose-600",
  free: "bg-emerald-600",
  transport: "bg-zinc-700",
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

export function ActivityCard({
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
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const visibleAvatars = participants.slice(0, 3);
  const remaining = Math.max(0, participants.length - 3);

  const card = (
    <div className="group relative aspect-[16/9] overflow-hidden rounded-2xl shadow-sm transition active:scale-[0.98] hover:shadow-md">
      {activity.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activity.image_url}
            alt={activity.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
        </>
      ) : (
        <div className={`h-full w-full ${bgColor}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
        {/* Arriba: tipo y acciones de creador */}
        <div className="flex items-start justify-between">
          <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ring-1 ring-white/25">
            {emoji} {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
          {isCreator && (
            <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
              <EditActivityModal activity={activity} tripId={tripId} currentUserId={currentUserId} />
              <ConfirmButton
                action={deleteActivity}
                fields={[
                  { name: "activity_id", value: activity.id },
                  { name: "trip_id", value: tripId },
                ]}
                confirmTitle="¿Eliminar actividad?"
                confirmMessage={`"${activity.title}" se eliminará permanentemente del itinerario.`}
                confirmLabel="Eliminar"
                variant="danger"
                className="flex h-6 w-6 items-center justify-center rounded-full bg-black/35 text-white/90 transition hover:bg-red-500 active:scale-90"
              >
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </ConfirmButton>
            </div>
          )}
        </div>

        {/* Abajo: info */}
        <div>
          <h4 className="line-clamp-1 text-base font-extrabold leading-tight drop-shadow-sm">{activity.title}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/95 drop-shadow-sm">
            <span className="flex items-center gap-0.5">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
              {formatDateShort(activity.date)}
              {(activity.start_time || activity.end_time) && (
                <>
                  {" · "}
                  {formatTime(activity.start_time)}
                  {activity.end_time && ` – ${formatTime(activity.end_time)}`}
                </>
              )}
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
              <span className="rounded bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-white/25">
                {formatCurrency(activity.cost, activity.currency)}
              </span>
            )}
          </div>

          {/* Avatares */}
          {participants.length > 0 && (
            <div className="mt-1.5 flex -space-x-2" onClick={(e) => e.stopPropagation()}>
              {visibleAvatars.map((p, i) => {
                const name = p.profile?.name ?? "Usuario";
                return (
                  <div
                    key={p.id}
                    className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-600 text-[9px] font-bold text-white shadow-md"
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
                <div className="z-10 flex h-7 w-7 items-center justify-center rounded-full border-2 border-white bg-black/60 text-[9px] font-bold text-white shadow-md">
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
