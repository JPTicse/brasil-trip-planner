"use client";

import { useState } from "react";
import { joinActivity, leaveActivity } from "@/lib/actions";
import { GoogleMap, type MapMarker } from "@/components/google-map";
import { formatCurrency, formatTime } from "@/lib/format";
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

export function ActivityDetailModal({
  activity,
  tripId,
  currentUserId,
  trigger,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const participants = activity.participants ?? [];
  const isJoined = participants.some((p) => p.user_id === currentUserId);
  const isCreator = activity.created_by === currentUserId;
  const hasCoords = activity.location_lat != null && activity.location_lng != null;

  const markers: MapMarker[] | undefined = hasCoords
    ? [{
        lat: activity.location_lat!,
        lng: activity.location_lng!,
        title: activity.title,
      }]
    : undefined;

  return (
    <>
      <div onClick={() => setOpen(true)}>{trigger}</div>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h3 className="text-base font-bold text-zinc-900">Detalle de actividad</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <div className="max-h-[75vh] overflow-y-auto pb-6">
              {/* Header con gradiente por tipo */}
              <div className={`mx-5 rounded-xl bg-gradient-to-br ${TYPE_GRADIENT[activity.type] ?? TYPE_GRADIENT.visit} p-4 text-white`}>
                <div className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/20">
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                      <path d={TYPE_ICON[activity.type] ?? TYPE_ICON.visit} />
                    </svg>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="font-bold">{activity.title}</h4>
                    <p className="text-xs text-white/80">
                      {ACTIVITY_TYPE_LABELS[activity.type]}
                      {activity.creator?.name && ` · Propuesto por ${activity.creator.name}`}
                    </p>
                  </div>
                </div>
              </div>

              {/* Info compacta */}
              <div className="mx-5 mt-3 space-y-2">
                {(activity.start_time || activity.end_time) && (
                  <InfoRow
                    icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    label="Horario"
                    value={`${formatTime(activity.start_time)}${activity.end_time ? ` – ${formatTime(activity.end_time)}` : ""}`}
                  />
                )}
                {activity.location && (
                  <InfoRow
                    icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="10" r="3" /></svg>}
                    label="Ubicación"
                    value={activity.location}
                  />
                )}
                {activity.cost !== null && activity.cost > 0 && (
                  <InfoRow
                    icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    label="Coste aprox."
                    value={formatCurrency(activity.cost, activity.currency)}
                  />
                )}
                {activity.notes && (
                  <div className="rounded-lg bg-zinc-50 px-3 py-2">
                    <p className="text-xs font-medium text-zinc-500">Notas</p>
                    <p className="mt-0.5 text-sm text-zinc-700">{activity.notes}</p>
                  </div>
                )}
              </div>

              {/* Mapa */}
              {hasCoords && (
                <div className="mx-5 mt-3 overflow-hidden rounded-xl border border-zinc-200">
                  <GoogleMap
                    center={{ lat: activity.location_lat!, lng: activity.location_lng! }}
                    markers={markers}
                    height="180px"
                  />
                </div>
              )}

              {/* Participantes */}
              <div className="mx-5 mt-3">
                <p className="mb-2 text-xs font-medium text-zinc-600">
                  Participantes ({participants.length})
                </p>
                {participants.length === 0 ? (
                  <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-400">
                    Nadie se ha unido aún. ¡Sé el primero!
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {participants.map((p) => {
                      const name = p.profile?.name ?? "Usuario";
                      const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                      return (
                        <div key={p.id} className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1">
                          <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-[8px] font-semibold text-white">
                            {p.profile?.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              initials
                            )}
                          </div>
                          <span className="text-xs text-zinc-700">{name}</span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Botón unirse/salir */}
              <div className="mx-5 mt-4">
                {isJoined ? (
                  <form action={leaveActivity}>
                    <input type="hidden" name="activity_id" value={activity.id} />
                    <input type="hidden" name="trip_id" value={tripId} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-100 py-3 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-200"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Estoy unido — salir
                    </button>
                  </form>
                ) : (
                  <form action={joinActivity}>
                    <input type="hidden" name="activity_id" value={activity.id} />
                    <input type="hidden" name="trip_id" value={tripId} />
                    <button
                      type="submit"
                      className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                    >
                      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                        <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                      </svg>
                      Unirme a este plan
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 px-3 py-2">
      <span className="text-zinc-400">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">{label}</p>
        <p className="truncate text-sm text-zinc-700">{value}</p>
      </div>
    </div>
  );
}
