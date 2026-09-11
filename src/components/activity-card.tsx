"use client";

import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { EditActivityModal } from "@/components/edit-activity-modal";
import { joinActivity, leaveActivity, deleteActivity } from "@/lib/actions";
import { formatTime, formatCurrency } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";

const TYPE_GRADIENT: Record<ActivityType, string> = {
  visit: "from-blue-500 to-cyan-400",
  tour: "from-purple-500 to-pink-400",
  meal: "from-orange-500 to-amber-400",
  event: "from-red-500 to-rose-400",
  free: "from-green-500 to-emerald-400",
  transport: "from-zinc-600 to-slate-400",
};

const TYPE_ICON: Record<ActivityType, string> = {
  visit: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 7.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  tour: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M18.001 17H19.4a.6.6 0 00.6-.6V16M12 3v12m0 0a2 2 0 104 0 2 2 0 00-4 0",
  meal: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  event: "M12 2l2.5 5 5.5.8-4 4 1 5.5L12 15l-5 2.5 1-5.5-4-4 5.5-.8L12 2z",
  free: "M5 3v18M5 3l10 9-10 9",
  transport: "M4 16l2-6h12l2 6M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M4 16h16M18 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3",
};

export function ActivityCard({
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
  const isCreator = activity.created_by === currentUserId;
  const participantCount = participants.length;
  const gradient = TYPE_GRADIENT[activity.type] ?? TYPE_GRADIENT.visit;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white shadow-sm transition hover:shadow-md">
      {/* Contenedor 16:9 */}
      <div className="flex aspect-[16/9] w-full overflow-hidden">
        {/* Lado izquierdo: datos con gradiente */}
        <div
          className={`relative flex w-[72%] flex-col justify-between bg-gradient-to-br ${gradient} p-3 text-white`}
        >
          {/* Badge tipo */}
          <div className="flex items-start justify-between">
            <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold backdrop-blur-sm">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
            {isCreator && (
              <div className="flex gap-1">
                <EditActivityModal activity={activity} tripId={tripId} currentUserId={currentUserId} />
                <form action={deleteActivity}>
                  <input type="hidden" name="activity_id" value={activity.id} />
                  <input type="hidden" name="trip_id" value={tripId} />
                  <button
                    type="submit"
                    className="flex h-6 w-6 items-center justify-center rounded-full bg-white/20 text-white/80 transition hover:bg-white/30 hover:text-white"
                  >
                    <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Título y datos principales */}
          <div>
            <h4 className="line-clamp-1 text-base font-extrabold leading-tight drop-shadow">{activity.title}</h4>
            <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[10px] text-white/90">
              {(activity.start_time || activity.end_time) && (
                <span className="flex items-center gap-0.5">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {formatTime(activity.start_time)}
                  {activity.end_time && ` – ${formatTime(activity.end_time)}`}
                </span>
              )}
              {activity.location && (
                <span className="flex items-center gap-0.5">
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  <span className="max-w-[120px] truncate">{activity.location}</span>
                </span>
              )}
              {activity.cost !== null && activity.cost > 0 && (
                <span className="font-semibold text-emerald-100">
                  {formatCurrency(activity.cost, activity.currency)}
                </span>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="mt-2 flex items-center justify-between border-t border-white/20 pt-2">
            <div className="flex min-w-0 items-center gap-1.5">
              {participantCount > 0 ? (
                <>
                  <div className="flex -space-x-1">
                    {participants.slice(0, 4).map((p) => {
                      const name = p.profile?.name ?? "Usuario";
                      const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                      return (
                        <div
                          key={p.id}
                          className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white/50 bg-white/20 text-[7px] font-semibold text-white"
                          title={name}
                        >
                          {p.profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={p.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                          ) : (
                            initials
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <span className="text-[10px] text-white/80">
                    {participantCount} {participantCount === 1 ? "unido" : "unidos"}
                  </span>
                </>
              ) : (
                <span className="text-[10px] text-white/70">Nadie se ha unido aún</span>
              )}
            </div>

            <div className="flex shrink-0 items-center gap-1.5">
              <ActivityDetailModal
                activity={activity}
                tripId={tripId}
                currentUserId={currentUserId}
                trigger={
                  <button
                    type="button"
                    className="flex items-center gap-0.5 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm transition hover:bg-white/30"
                  >
                    Ver
                  </button>
                }
              />

              {isJoined ? (
                <form action={leaveActivity}>
                  <input type="hidden" name="activity_id" value={activity.id} />
                  <input type="hidden" name="trip_id" value={tripId} />
                  <button
                    type="submit"
                    className="flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 transition hover:bg-white"
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
                    className="flex items-center gap-0.5 rounded-full border border-white/50 bg-white/10 px-2 py-0.5 text-[10px] font-semibold text-white transition hover:bg-white/20"
                  >
                    Unirme
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* Lado derecho: imagen */}
        <div className="relative w-[28%] overflow-hidden bg-zinc-100">
          {activity.image_url ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activity.image_url}
                alt={activity.title}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-black/10" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-zinc-100 text-zinc-300">
              <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.2}>
                <path d={TYPE_ICON[activity.type] ?? TYPE_ICON.visit} />
              </svg>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
