"use client";

import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { joinActivity, leaveActivity } from "@/lib/actions";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";
import { AnimatedActionButton } from "@/components/animated-action-button";

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

/* ============================================================
   ESTILO A — Split horizontal: datos a la izquierda (70%),
   imagen a la derecha (30%) con color sólido de tipo
   ============================================================ */
export function ExploreCardA({
  activity,
  tripId,
  currentUserId,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
}) {
  const isJoined = (activity.participants ?? []).some((p) => p.user_id === currentUserId);
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition active:scale-[0.98] hover:shadow-md dark:bg-zinc-900">
      <div className="flex w-full overflow-hidden">
        <div className={`relative flex w-[70%] flex-col justify-between self-stretch ${bgColor} p-3 text-white`}>
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ring-1 ring-white/20">
              {emoji} {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
          </div>
          <div>
            <h4 className="line-clamp-1 text-base font-extrabold leading-tight">{activity.title}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/90">
              <span>{formatDate(activity.date)}</span>
              {activity.start_time && <span>· {formatTime(activity.start_time)}</span>}
              {activity.location && <span className="max-w-[100px] truncate">· {activity.location}</span>}
            </div>
          </div>
          <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-2">
            {activity.cost !== null && activity.cost > 0 && (
              <span className="rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-white/20">
                {formatCurrency(activity.cost, activity.currency)}
              </span>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <AnimatedActionButton
                action={isJoined ? leaveActivity : joinActivity}
                variant={isJoined ? "leave" : "join"}
                label={isJoined ? "Unido" : "Unirme"}
                fields={[
                  { name: "activity_id", value: activity.id },
                  { name: "trip_id", value: tripId },
                ]}
                showIcon={false}
              />
            </div>
          </div>
        </div>
        <div className="relative aspect-[3/4] w-[30%] shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {activity.image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl opacity-30">{emoji}</div>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={card} />
  );
}

/* ============================================================
   ESTILO B — Imagen completa de fondo con overlay vertical,
   texto blanco abajo, tag arriba. Color sólido si no hay imagen.
   ============================================================ */
export function ExploreCardB({
  activity,
  tripId,
  currentUserId,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
}) {
  const isJoined = (activity.participants ?? []).some((p) => p.user_id === currentUserId);
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="group relative aspect-[4/5] overflow-hidden rounded-2xl shadow-sm transition active:scale-[0.98] hover:shadow-md">
      {activity.image_url ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/40" />
        </>
      ) : (
        <div className={`h-full w-full ${bgColor}`}>
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
      )}
      <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
        <div className="flex items-start justify-between">
          <span className="rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ring-1 ring-white/25">
            {emoji} {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
        </div>
        <div>
          <h4 className="line-clamp-2 text-base font-extrabold leading-tight">{activity.title}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/90">
            <span>{formatDate(activity.date)}</span>
            {activity.start_time && <span>· {formatTime(activity.start_time)}</span>}
          </div>
          {activity.location && <p className="mt-0.5 line-clamp-1 text-[10px] text-white/80">{activity.location}</p>}
          <div className="mt-2 flex items-center justify-between" onClick={(e) => e.stopPropagation()}>
            {activity.cost !== null && activity.cost > 0 && (
              <span className="rounded bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-white/25">
                {formatCurrency(activity.cost, activity.currency)}
              </span>
            )}
            <AnimatedActionButton
              action={isJoined ? leaveActivity : joinActivity}
              variant={isJoined ? "leave" : "join"}
              label={isJoined ? "Unido" : "+ Unirme"}
              fields={[
                { name: "activity_id", value: activity.id },
                { name: "trip_id", value: tripId },
              ]}
              className="flex-1 ml-2 py-1.5"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={card} />
  );
}

/* ============================================================
   ESTILO C — Card apilada: imagen arriba (16:9), datos abajo
   en fondo claro/oscuro con barra de color a la izquierda
   ============================================================ */
export function ExploreCardC({
  activity,
  tripId,
  currentUserId,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
}) {
  const isJoined = (activity.participants ?? []).some((p) => p.user_id === currentUserId);
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="group overflow-hidden rounded-2xl bg-white shadow-sm transition active:scale-[0.98] hover:shadow-md dark:bg-zinc-900">
      {/* Imagen arriba 16:9 */}
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {activity.image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover transition duration-300 group-hover:scale-105" loading="lazy" />
          </>
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${bgColor} text-5xl opacity-90`}>{emoji}</div>
        )}
        {/* Tag tipo sobre la imagen */}
        <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm ring-1 ring-white/25">
          {ACTIVITY_TYPE_LABELS[activity.type]}
        </span>
      </div>
      {/* Datos abajo */}
      <div className="flex">
        {/* Barra de color a la izquierda */}
        <div className={`w-1.5 shrink-0 ${bgColor}`} />
        <div className="flex-1 p-3">
          <h4 className="line-clamp-1 text-base font-extrabold leading-tight text-zinc-900 dark:text-zinc-100">{activity.title}</h4>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-zinc-500 dark:text-zinc-400">
            <span className="flex items-center gap-0.5">
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
              {formatDate(activity.date)}
              {activity.start_time && ` · ${formatTime(activity.start_time)}`}
            </span>
            {activity.location && (
              <span className="flex items-center gap-0.5">
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="max-w-[120px] truncate">{activity.location}</span>
              </span>
            )}
          </div>
          <div className="mt-2 flex items-center justify-between">
            {activity.cost !== null && activity.cost > 0 ? (
              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                {formatCurrency(activity.cost, activity.currency)}
              </span>
            ) : (
              <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500">Gratis</span>
            )}
            <div onClick={(e) => e.stopPropagation()}>
              <AnimatedActionButton
                action={isJoined ? leaveActivity : joinActivity}
                variant={isJoined ? "leave" : "join"}
                label={isJoined ? "Unido" : "Unirme"}
                fields={[
                  { name: "activity_id", value: activity.id },
                  { name: "trip_id", value: tripId },
                ]}
                showIcon={false}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={card} />
  );
}
