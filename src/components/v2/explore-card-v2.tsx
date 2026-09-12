"use client";

import { ActivityDetailModalV2 as ActivityDetailModal } from "@/components/v2/activity-detail-modal-v2";
import { JoinActivityButton } from "@/components/join-activity-button";
import { formatTime, formatDateShort, formatCurrency } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";

// Colores originales por tipo (coinciden con v1).
const TYPE_DOT: Record<ActivityType, string> = {
  visit: "bg-blue-500",
  tour: "bg-violet-500",
  meal: "bg-orange-500",
  event: "bg-rose-500",
  free: "bg-emerald-500",
  transport: "bg-zinc-500",
};

// Acento de borde izquierdo por tipo para destacar el color.
const TYPE_BORDER: Record<ActivityType, string> = {
  visit: "border-l-blue-500",
  tour: "border-l-violet-500",
  meal: "border-l-orange-500",
  event: "border-l-rose-500",
  free: "border-l-emerald-500",
  transport: "border-l-zinc-500",
};

function getInitials(name: string) {
  return name.split(" ").map((w) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase();
}

export function ExploreCardV2({
  activity,
  tripId,
  currentUserId,
  myActivities,
  totalMembers,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
  myActivities?: Activity[];
  totalMembers?: number;
}) {
  const participants = activity.participants ?? [];
  const isJoined = participants.some((p) => p.user_id === currentUserId);
  const visibleAvatars = participants.slice(0, 3);
  const remaining = Math.max(0, participants.length - 3);

  // Social proof signals — subtle text labels based on participant count
  const participantCount = participants.length;
  const socialProof = (() => {
    if (totalMembers && participantCount > 0 && participantCount >= totalMembers) {
      return { text: "¡Todos van!", className: "text-emerald-600 dark:text-emerald-400 font-medium" };
    }
    if (participantCount === 0) {
      return { text: "¡Sé el primero!", className: "text-zinc-400 dark:text-zinc-500" };
    }
    if (participantCount >= 3) {
      return { text: "🔥 Popular", className: "text-amber-600 dark:text-amber-500 font-medium" };
    }
    return { text: participantCount === 1 ? "1 va" : `${participantCount} van`, className: "text-zinc-400 dark:text-zinc-500" };
  })();

  const card = (
    <div className={`overflow-hidden rounded-xl border border-zinc-200 bg-white transition active:scale-[0.99] dark:border-zinc-800 dark:bg-zinc-900 border-l-4 ${TYPE_BORDER[activity.type]}`}>
      {/* Imagen opcional */}
      {activity.image_url && (
        <div className="relative h-32 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}

      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h4 className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            {activity.title}
          </h4>
          <span className="flex shrink-0 items-center gap-1 text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
            <span className={`h-2 w-2 rounded-full ring-2 ring-white dark:ring-zinc-900 ${TYPE_DOT[activity.type]}`} />
            {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
          <span>{formatDateShort(activity.date)}</span>
          {activity.start_time && (
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
          )}
          {activity.start_time && (
            <span>{formatTime(activity.start_time)}</span>
          )}
          {activity.location && (
            <span className="text-zinc-300 dark:text-zinc-600">·</span>
          )}
          {activity.location && (
            <span className="max-w-[120px] truncate">{activity.location}</span>
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

        {/* Social proof + participant avatars */}
        <div className="mt-2 flex items-center gap-2">
          {participants.length > 0 && (
            <div className="flex -space-x-1.5" onClick={(e) => e.stopPropagation()}>
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
                      <img src={p.profile.avatar_url} alt={name} className="h-full w-full object-cover" />
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
          <span className={`text-[11px] ${socialProof.className}`}>
            {socialProof.text}
          </span>
        </div>
      </div>

      {/* Botón de unirse/salir */}
      <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
        <JoinActivityButton
          activity={activity}
          tripId={tripId}
          isJoined={isJoined}
          myActivities={myActivities}
          className="w-full py-2.5"
        />
      </div>
    </div>
  );

  return (
    <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={card} myActivities={myActivities} />
  );
}
