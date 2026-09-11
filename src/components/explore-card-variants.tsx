"use client";

import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { EditActivityModal } from "@/components/edit-activity-modal";
import { deleteActivity, joinActivity, leaveActivity } from "@/lib/actions";
import { formatDate, formatTime, formatCurrency } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";
import { AnimatedActionButton } from "@/components/animated-action-button";
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
  );
}

/* ============================================================
   ESTILO 1 — Split horizontal con barra inferior verde
   Datos a la izquierda (70%), imagen a la derecha (30%)
   Botón "Unirme" largo verde debajo de toda la card
   ============================================================ */
export function ExploreCardA({
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
  const isJoined = (activity.participants ?? []).some((p) => p.user_id === currentUserId);
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition active:scale-[0.98] hover:shadow-md dark:bg-zinc-900">
      <div className="flex w-full overflow-hidden">
        {/* Datos izquierda 70% */}
        <div className={`relative flex w-[70%] flex-col justify-between self-stretch ${bgColor} p-3 text-white`}>
          <span className="w-fit rounded-full bg-black/25 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ring-1 ring-white/20">
            {emoji} {ACTIVITY_TYPE_LABELS[activity.type]}
          </span>
          <div>
            <h4 className="line-clamp-1 text-base font-extrabold leading-tight">{activity.title}</h4>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-white/90">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
              {formatDate(activity.date)}
              {activity.start_time && ` · ${formatTime(activity.start_time)}`}
            </div>
            {activity.location && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
                <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="max-w-[140px] truncate">{activity.location}</span>
              </p>
            )}
            {activity.cost !== null && activity.cost > 0 && (
              <span className="mt-1 inline-block rounded bg-black/25 px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-white/20">
                {formatCurrency(activity.cost, activity.currency)}
              </span>
            )}
            <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
              <ParticipantAvatars participants={activity.participants} />
            </div>
          </div>
        </div>
        {/* Imagen derecha 30% */}
        <div className="relative aspect-[3/4] w-[30%] shrink-0 overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {activity.image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover" loading="lazy" />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl opacity-30">{emoji}</div>
          )}
        </div>
      </div>
      {/* Botón verde largo abajo */}
      <div className="p-2" onClick={(e) => e.stopPropagation()}>
        <AnimatedActionButton
          action={isJoined ? leaveActivity : joinActivity}
          variant={isJoined ? "leave" : "join"}
          label={isJoined ? "Unido — salir" : "Unirme"}
          fields={[
            { name: "activity_id", value: activity.id },
            { name: "trip_id", value: tripId },
          ]}
          className="w-full py-3"
        />
      </div>
    </div>
  );

  return (
    <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={card} myActivities={myActivities} />
  );
}

/* ============================================================
   ESTILO 2 — Imagen arriba pequeña (16:9), datos abajo en
   fondo claro/oscuro, barra de color a la izquierda
   Botón verde largo abajo
   ============================================================ */
export function ExploreCardB({
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
  const isJoined = (activity.participants ?? []).some((p) => p.user_id === currentUserId);
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition active:scale-[0.98] hover:shadow-md dark:bg-zinc-900">
      {/* Imagen arriba 16:9 */}
      <div className="relative aspect-[16/9] overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {activity.image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover" loading="lazy" />
          </>
        ) : (
          <div className={`flex h-full w-full items-center justify-center ${bgColor} text-5xl`}>{emoji}</div>
        )}
        <span className="absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-sm ring-1 ring-white/25">
          {emoji} {ACTIVITY_TYPE_LABELS[activity.type]}
        </span>
      </div>
      {/* Datos abajo */}
      <div className="flex">
        <div className={`w-1.5 shrink-0 ${bgColor}`} />
        <div className="flex-1 p-3">
          <h4 className="line-clamp-1 text-base font-extrabold leading-tight text-zinc-900 dark:text-zinc-100">{activity.title}</h4>
          <div className="mt-1 flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
            <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
            </svg>
            {formatDate(activity.date)}
            {activity.start_time && ` · ${formatTime(activity.start_time)}`}
          </div>
          {activity.location && (
            <p className="mt-0.5 flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              <span className="max-w-[200px] truncate">{activity.location}</span>
            </p>
          )}
          {activity.cost !== null && activity.cost > 0 && (
            <span className="mt-1 inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {formatCurrency(activity.cost, activity.currency)}
            </span>
          )}
          <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
            <ParticipantAvatars participants={activity.participants} />
          </div>
        </div>
      </div>
      {/* Botón verde largo abajo */}
      <div className="px-3 pb-3" onClick={(e) => e.stopPropagation()}>
        <AnimatedActionButton
          action={isJoined ? leaveActivity : joinActivity}
          variant={isJoined ? "leave" : "join"}
          label={isJoined ? "Unido — salir" : "Unirme"}
          fields={[
            { name: "activity_id", value: activity.id },
            { name: "trip_id", value: tripId },
          ]}
          className="w-full py-3"
        />
      </div>
    </div>
  );

  return (
    <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={card} myActivities={myActivities} />
  );
}

/* ============================================================
   ESTILO 3 — Imagen de fondo completa con overlay,
   todo el texto blanco sobre la imagen
   Botón verde largo abajo fuera del overlay
   ============================================================ */
export function ExploreCardC({
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
  const isJoined = (activity.participants ?? []).some((p) => p.user_id === currentUserId);
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;
  const emoji = TYPE_EMOJI[activity.type] ?? "👀";

  const card = (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm transition active:scale-[0.98] hover:shadow-md dark:bg-zinc-900">
      {/* Imagen de fondo con overlay */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {activity.image_url ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={activity.image_url} alt={activity.title} className="h-full w-full object-cover" loading="lazy" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/40" />
          </>
        ) : (
          <div className={`h-full w-full ${bgColor}`}>
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>
        )}
        <div className="absolute inset-0 flex flex-col justify-between p-3 text-white">
          <div className="flex items-start justify-between" onClick={(e) => e.stopPropagation()}>
            <span className="w-fit rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm ring-1 ring-white/25">
              {emoji} {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            {activity.created_by === currentUserId && (
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
          <div>
            <h4 className="line-clamp-2 text-base font-extrabold leading-tight">{activity.title}</h4>
            <div className="mt-1 flex items-center gap-1 text-[11px] text-white/90">
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <rect x="3" y="4" width="18" height="18" rx="2" />
                <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
              </svg>
              {formatDate(activity.date)}
              {activity.start_time && ` · ${formatTime(activity.start_time)}`}
            </div>
            {activity.location && (
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-white/80">
                <svg className="h-3 w-3 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="10" r="3" />
                </svg>
                <span className="max-w-[200px] truncate">{activity.location}</span>
              </p>
            )}
            {activity.cost !== null && activity.cost > 0 && (
              <span className="mt-1 inline-block rounded bg-black/35 px-1.5 py-0.5 text-[10px] font-semibold ring-1 ring-white/25">
                {formatCurrency(activity.cost, activity.currency)}
              </span>
            )}
            <div className="mt-1.5" onClick={(e) => e.stopPropagation()}>
              <ParticipantAvatars participants={activity.participants} />
            </div>
          </div>
        </div>
      </div>
      {/* Botón verde largo abajo */}
      <div className="p-2" onClick={(e) => e.stopPropagation()}>
        <AnimatedActionButton
          action={isJoined ? leaveActivity : joinActivity}
          variant={isJoined ? "leave" : "join"}
          label={isJoined ? "Unido — salir" : "Unirme"}
          fields={[
            { name: "activity_id", value: activity.id },
            { name: "trip_id", value: tripId },
          ]}
          className="w-full py-3"
        />
      </div>
    </div>
  );

  return (
    <ActivityDetailModal activity={activity} tripId={tripId} currentUserId={currentUserId} trigger={card} myActivities={myActivities} />
  );
}
