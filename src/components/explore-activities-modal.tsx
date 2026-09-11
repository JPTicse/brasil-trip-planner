"use client";

import { useState } from "react";
import { joinActivity, leaveActivity } from "@/lib/actions";
import { formatDate, formatTime } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity } from "@/lib/types";
import { ActivityDetailModal } from "@/components/activity-detail-modal";

const TYPE_GRADIENT: Record<string, string> = {
  visit: "from-blue-500 to-cyan-400",
  tour: "from-violet-500 to-pink-400",
  meal: "from-orange-500 to-amber-400",
  event: "from-red-500 to-rose-400",
  free: "from-green-500 to-emerald-400",
  transport: "from-zinc-600 to-slate-400",
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
  const gradient = TYPE_GRADIENT[activity.type] ?? TYPE_GRADIENT.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="group relative aspect-square w-full overflow-hidden rounded-2xl bg-zinc-100 shadow-sm transition active:scale-95">
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
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </>
      ) : (
        <div className={`h-full w-full bg-gradient-to-br ${gradient} p-4`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>
      )}

      {/* Contenido */}
      <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
        {/* Arriba: emoji y tipo */}
        <div className="flex items-start justify-between">
          <span className="text-3xl drop-shadow">{emoji}</span>
          <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm">
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
        </div>

        {/* Abajo: info */}
        <div>
          <h4 className="line-clamp-2 text-sm font-extrabold leading-tight drop-shadow">
            {activity.title}
          </h4>
          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-white/80">
            <span>
              {formatDate(activity.date)}
              {activity.start_time && ` · ${formatTime(activity.start_time)}`}
            </span>
            {activity.location && (
              <span className="line-clamp-1">{activity.location}</span>
            )}
            <span>{participants.length} {participants.length === 1 ? "unido" : "unidos"}</span>
          </div>

          <div className="mt-2" onClick={(e) => e.stopPropagation()}>
            <JoinButton activity={activity} tripId={tripId} currentUserId={currentUserId} />
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

function JoinButton({
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

  return isJoined ? (
    <form action={leaveActivity}>
      <input type="hidden" name="activity_id" value={activity.id} />
      <input type="hidden" name="trip_id" value={tripId} />
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-1 rounded-xl bg-white/90 py-1.5 text-[10px] font-bold text-emerald-700 transition hover:bg-white"
      >
        Unido
      </button>
    </form>
  ) : (
    <form action={joinActivity}>
      <input type="hidden" name="activity_id" value={activity.id} />
      <input type="hidden" name="trip_id" value={tripId} />
      <button
        type="submit"
        className="flex w-full items-center justify-center gap-1 rounded-xl bg-emerald-500 py-1.5 text-[10px] font-bold text-white transition hover:bg-emerald-600"
      >
        + Unirme
      </button>
    </form>
  );
}
