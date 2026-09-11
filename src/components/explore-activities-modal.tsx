"use client";

import { useState } from "react";
import { joinActivity, leaveActivity } from "@/lib/actions";
import { formatDate, formatTime } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity } from "@/lib/types";
import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { AnimatedActionButton } from "@/components/animated-action-button";

const TYPE_GRADIENT: Record<string, string> = {
  visit: "from-blue-600 to-cyan-500",
  tour: "from-violet-600 to-pink-500",
  meal: "from-orange-600 to-amber-500",
  event: "from-red-600 to-rose-500",
  free: "from-green-600 to-emerald-500",
  transport: "from-zinc-700 to-slate-500",
};

const TYPE_EMOJI: Record<string, string> = {
  visit: "👀",
  tour: "🚌",
  meal: "🍽️",
  event: "🎉",
  free: "🌿",
  transport: "✈️",
};

export function ExploreActivitiesModal({
  activities,
  tripId,
  currentUserId,
}: {
  activities: Activity[];
  tripId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  const exploreActivities = activities.filter(
    (a) => !(a.participants ?? []).some((p) => p.user_id === currentUserId),
  );

  if (exploreActivities.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 active:scale-95"
      >
        <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Explorar ({exploreActivities.length})
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h3 className="text-base font-bold text-zinc-900">Explorar actividades</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="grid max-h-[65vh] grid-cols-2 gap-3 overflow-y-auto px-5 pb-6">
              {exploreActivities.map((a) => (
                <ExploreCard
                  key={a.id}
                  activity={a}
                  tripId={tripId}
                  currentUserId={currentUserId}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function ExploreCard({
  activity,
  tripId,
  currentUserId,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
}) {
  const participants = activity.participants ?? [];
  const isJoined = participants.some((p) => p.user_id === currentUserId);
  const gradient = TYPE_GRADIENT[activity.type] ?? TYPE_GRADIENT.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-900 shadow-sm transition active:scale-95">
      {/* Fondo: imagen o gradiente */}
      {activity.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activity.image_url}
            alt={activity.title}
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            loading="lazy"
          />
          {/* Degradado fuerte para legibilidad */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-black/30" />
        </>
      ) : (
        <div className={`h-full w-full bg-gradient-to-br ${gradient}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-black/30" />
        </div>
      )}

      {/* Contenido */}
      <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
        {/* Arriba: emoji y tipo */}
        <div className="flex items-start justify-between">
          <span className="text-3xl drop-shadow-lg">{emoji}</span>
          <span className="rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ring-1 ring-white/30">
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
        </div>

        {/* Abajo: info */}
        <div>
          <h4 className="line-clamp-2 text-sm font-extrabold leading-tight drop-shadow-lg">
            {activity.title}
          </h4>
          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-white/90 drop-shadow">
            <span>
              {formatDate(activity.date)}
              {activity.start_time && ` · ${formatTime(activity.start_time)}`}
            </span>
            {activity.location && (
              <span className="line-clamp-1">{activity.location}</span>
            )}
          </div>

          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <AnimatedActionButton
              action={isJoined ? leaveActivity : joinActivity}
              variant={isJoined ? "leave" : "join"}
              label={isJoined ? "Unido" : "+ Unirme"}
              fields={[
                { name: "activity_id", value: activity.id },
                { name: "trip_id", value: tripId },
              ]}
              className="w-full py-1.5"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ActivityDetailModal
      activity={activity}
      tripId={tripId}
      currentUserId={currentUserId}
      trigger={card}
    />
  );
}
