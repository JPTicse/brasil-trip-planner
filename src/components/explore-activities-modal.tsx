"use client";

import { useState } from "react";
import { joinActivity, leaveActivity } from "@/lib/actions";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity } from "@/lib/types";

const TYPE_GRADIENT: Record<string, string> = {
  visit: "from-blue-500 to-cyan-400",
  tour: "from-purple-500 to-pink-400",
  meal: "from-orange-500 to-amber-400",
  event: "from-red-500 to-rose-400",
  free: "from-green-500 to-emerald-400",
  transport: "from-zinc-600 to-slate-400",
};

const TYPE_ICON: Record<string, string> = {
  visit: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M9 10v11M15 10v11",
  tour: "M12 2a8 8 0 100 16 8 8 0 000-16zM12 6v6l4 2",
  meal: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  event: "M12 2l2.5 5 5.5.8-4 4 1 5.5L12 15l-5 2.5 1-5.5-4-4 5.5-.8L12 2z",
  free: "M5 3v18M5 3l10 9-10 9",
  transport: "M4 16l2-6h12l2 6M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M4 16h16M18 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3",
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

  // Solo actividades a las que NO se ha unido el usuario
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
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl">
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

            <div className="max-h-[65vh] space-y-2 overflow-y-auto px-5 pb-6">
              {exploreActivities.map((a) => {
                const participants = a.participants ?? [];
                const isJoined = participants.some((p) => p.user_id === currentUserId);
                return (
                  <div key={a.id} className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                    <div className={`h-1 bg-gradient-to-r ${TYPE_GRADIENT[a.type] ?? TYPE_GRADIENT.visit}`} />
                    {a.image_url && (
                      <div className="relative h-20 w-full overflow-hidden">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={a.image_url} alt={a.title} className="h-full w-full object-cover" loading="lazy" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
                      </div>
                    )}
                    <div className="p-3">
                      <div className="flex items-start gap-2.5">
                        <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${TYPE_GRADIENT[a.type] ?? TYPE_GRADIENT.visit} text-white`}>
                          <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                            <path d={TYPE_ICON[a.type] ?? TYPE_ICON.visit} />
                          </svg>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h4 className="text-sm font-semibold text-zinc-900">{a.title}</h4>
                          <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
                            <span>{formatDate(a.date)}</span>
                            {a.start_time && (
                              <span>· {formatTime(a.start_time)}</span>
                            )}
                            {a.location && (
                              <span className="max-w-[100px] truncate">· {a.location}</span>
                            )}
                          </div>
                          <div className="mt-1 flex items-center gap-1.5">
                            {participants.length > 0 && (
                              <div className="flex -space-x-1">
                                {participants.slice(0, 4).map((p) => {
                                  const name = p.profile?.name ?? "U";
                                  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                                  return (
                                    <div
                                      key={p.id}
                                      className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white bg-emerald-600 text-[7px] font-semibold text-white"
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
                            )}
                            <span className="text-[10px] text-zinc-400">
                              {participants.length} {participants.length === 1 ? "unido" : "unidos"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-2.5">
                        {isJoined ? (
                          <form action={leaveActivity}>
                            <input type="hidden" name="activity_id" value={a.id} />
                            <input type="hidden" name="trip_id" value={tripId} />
                            <button
                              type="submit"
                              className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-100 py-1.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-200"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Unido — salir
                            </button>
                          </form>
                        ) : (
                          <form action={joinActivity}>
                            <input type="hidden" name="activity_id" value={a.id} />
                            <input type="hidden" name="trip_id" value={tripId} />
                            <button
                              type="submit"
                              className="flex w-full items-center justify-center gap-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                                <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                              </svg>
                              Unirme
                            </button>
                          </form>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
