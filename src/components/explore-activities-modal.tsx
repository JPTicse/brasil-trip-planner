"use client";

import { CachedImage } from "@/components/cached-image";
import { useState } from "react";
import { joinActivity, leaveActivity } from "@/lib/actions";
import { formatDate, formatTime } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity } from "@/lib/types";
import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { AnimatedActionButton } from "@/components/animated-action-button";
import { Modal } from "@/components/modal";

function getInitials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

function ParticipantAvatars({ participants, max = 3 }: { participants: Activity["participants"]; max?: number }) {
  const list = (participants ?? []).filter((p) => p.profile);
  const visible = list.slice(0, max);
  const remaining = Math.max(0, list.length - max);

  if (visible.length === 0) return null;

  return (
    <div className="flex -space-x-2">
      {visible.map((p, i) => {
        const name = p.profile?.name ?? "Usuario";
        return (
          <div
            key={p.id}
            className="relative flex h-7 w-7 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-600 text-[9px] font-bold text-white shadow-md"
            style={{ zIndex: max - i }}
            title={name}
          >
            {p.profile?.avatar_url ? (
              <CachedImage src={p.profile.avatar_url} alt={name} className="object-cover" sizes="100px" />
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
  );
}

// Colores sólidos con buen contraste
const TYPE_BG: Record<string, string> = {
  visit: "bg-blue-600",
  tour: "bg-violet-600",
  meal: "bg-orange-600",
  event: "bg-rose-600",
  free: "bg-emerald-600",
  transport: "bg-zinc-700",
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

  const myActivities = activities.filter(
    (a) => (a.participants ?? []).some((p) => p.user_id === currentUserId),
  );
  const exploreActivities = activities.filter(
    (a) => !(a.participants ?? []).some((p) => p.user_id === currentUserId),
  );

  if (exploreActivities.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-emerald-700 dark:hover:bg-emerald-900/20"
      >
        <svg className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <circle cx="11" cy="11" r="8" />
          <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Explorar ({exploreActivities.length})
      </button>

      <Modal open={open} onClose={() => setOpen(false)} zIndex={50}>
        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Explorar actividades</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="grid min-h-0 flex-1 grid-cols-2 gap-3 overflow-y-auto overscroll-contain px-5 pb-6">
          {exploreActivities.map((a) => (
            <ExploreCard
              key={a.id}
              activity={a}
              tripId={tripId}
              currentUserId={currentUserId}
              myActivities={myActivities}
            />
          ))}
        </div>
      </Modal>
    </>
  );
}

function ExploreCard({
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
  const isJoined = participants.some((p) => p.user_id === currentUserId);
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="group relative aspect-square w-full overflow-hidden rounded-2xl shadow-sm transition active:scale-95">
      {/* Fondo: imagen o color sólido */}
      {activity.image_url ? (
        <>
          <CachedImage src={activity.image_url} alt={activity.title} className="object-cover transition duration-300 group-hover:scale-105" sizes="(max-width: 768px) 50vw, 200px" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
        </>
      ) : (
        <div className={`h-full w-full ${bgColor}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
        </div>
      )}

      {/* Contenido */}
      <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
        {/* Arriba: emoji y tipo */}
        <div className="flex items-start justify-between">
          <span className="text-3xl">{emoji}</span>
          <span className="rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-bold backdrop-blur-sm ring-1 ring-white/25">
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
        </div>

        {/* Abajo: info */}
        <div>
          <h4 className="line-clamp-2 text-sm font-extrabold leading-tight">
            {activity.title}
          </h4>
          <div className="mt-1 flex flex-col gap-0.5 text-[10px] text-white/90">
            <span>
              {formatDate(activity.date)}
              {activity.start_time && ` · ${formatTime(activity.start_time)}`}
            </span>
            {activity.location && (
              <span className="line-clamp-1">{activity.location}</span>
            )}
          </div>

          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
            <ParticipantAvatars participants={activity.participants} />
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
      myActivities={myActivities}
    />
  );
}
