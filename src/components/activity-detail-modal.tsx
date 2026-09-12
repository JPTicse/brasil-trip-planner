"use client";

import { CachedImage } from "@/components/cached-image";
import { useState } from "react";
import { joinActivity, leaveActivity } from "@/lib/actions";
import { formatCurrency, formatDate, formatTime } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity, type ActivityType } from "@/lib/types";
import { Modal } from "@/components/modal";
import { SubmitButton } from "@/components/submit-button";
import { ConfirmButton } from "@/components/confirm-button";

const TYPE_BG: Record<string, string> = {
  visit: "bg-blue-600",
  tour: "bg-violet-600",
  meal: "bg-orange-600",
  event: "bg-rose-600",
  free: "bg-emerald-600",
  transport: "bg-zinc-700",
};

const ACTIVITY_TYPE_EMOJI: Record<ActivityType, string> = {
  visit: "👀",
  tour: "🚌",
  meal: "🍽️",
  event: "🎉",
  free: "🌿",
  transport: "✈️",
};

const TYPE_ICON: Record<string, string> = {
  visit: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M9 10v11M15 10v11",
  tour: "M12 2a8 8 0 100 16 8 8 0 000-16zM12 6v6l4 2",
  meal: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  event: "M12 2l2.5 5 5.5.8-4 4 1 5.5L12 15l-5 2.5 1-5.5-4-4 5.5-.8L12 2z",
  free: "M5 3v18M5 3l10 9-10 9",
  transport: "M4 16l2-6h12l2 6M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M4 16h16M18 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3",
};

// Convierte "HH:MM:SS" o "HH:MM" a minutos del día
function toMin(t: string | null | undefined): number {
  if (!t) return 0;
  const [h, m] = t.split(":").map(Number);
  return (h || 0) * 60 + (m || 0);
}

export function ActivityDetailModal({
  activity,
  tripId,
  currentUserId,
  trigger,
  myActivities,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
  trigger: React.ReactNode;
  myActivities?: Activity[];
}) {
  const [open, setOpen] = useState(false);
  const [showConflict, setShowConflict] = useState(false);
  const [conflicts, setConflicts] = useState<Activity[]>([]);

  const participants = activity.participants ?? [];
  const isJoined = participants.some((p) => p.user_id === currentUserId);
  const hasCoords = activity.location_lat != null && activity.location_lng != null;
  const bgColor = TYPE_BG[activity.type] ?? TYPE_BG.visit;

  // Detectar actividades con las que se solapa
  const detectConflicts = (): Activity[] => {
    if (!myActivities || myActivities.length === 0) return [];
    return myActivities.filter((a) => {
      if (a.id === activity.id) return false;
      if (a.date !== activity.date) return false;
      // Sin horas -> no se puede detectar solapamiento
      if (!a.start_time && !activity.start_time) return false;
      // Convertir a minutos
      const aStart = toMin(a.start_time);
      const aEnd = a.end_time ? toMin(a.end_time) : aStart + 60;
      const bStart = toMin(activity.start_time);
      const bEnd = activity.end_time ? toMin(activity.end_time) : bStart + 60;
      // Solapamiento: aStart < bEnd && bStart < aEnd
      return aStart < bEnd && bStart < aEnd;
    });
  };

  const handleJoinClick = (e: React.MouseEvent) => {
    const found = detectConflicts();
    if (found.length > 0) {
      e.preventDefault();
      setConflicts(found);
      setShowConflict(true);
    }
  };

  return (
    <>
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button, a, [role='button'], input, select, textarea")) return;
          setOpen(true);
        }}
      >
        {trigger}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} zIndex={50}>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Detalle de actividad</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Contenido scrolleable */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pb-6">
          {/* Header con color sólido por tipo */}
          <div className={`mx-5 rounded-xl ${bgColor} p-4 text-white`}>
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

          {/* Imagen */}
          {activity.image_url && (
            <div className="relative mx-5 mt-3 h-40 overflow-hidden rounded-xl">
              <CachedImage src={activity.image_url} alt={activity.title} className="object-cover" sizes="(max-width: 768px) 100vw, 400px" />
            </div>
          )}

          {/* Info compacta */}
          <div className="mx-5 mt-3 space-y-2">
            {/* Fecha + Hora en una sola fila */}
            {(activity.date || activity.start_time || activity.end_time) && (
              <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <span className="text-zinc-400 dark:text-zinc-500">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Cuándo</p>
                  <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">
                    {activity.date && formatDate(activity.date)}
                    {(activity.start_time || activity.end_time) && activity.date && " · "}
                    {activity.start_time && formatTime(activity.start_time)}
                    {activity.end_time && ` – ${formatTime(activity.end_time)}`}
                  </p>
                </div>
              </div>
            )}

            {/* Ubicación + botón Maps compacto en una sola fila */}
            {activity.location && (
              <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <span className="text-zinc-400 dark:text-zinc-500">
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" /><circle cx="12" cy="10" r="3" /></svg>
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">Dónde</p>
                  <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">{activity.location}</p>
                </div>
                {hasCoords && (
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${activity.location_lat},${activity.location_lng}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-white shadow-md shadow-blue-600/20 transition active:scale-90 hover:bg-blue-700"
                    title="Cómo llegar"
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                      <path d="M22 12h-4l-3 9L9 3l-3 9H2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </a>
                )}
              </div>
            )}

            {activity.cost !== null && activity.cost > 0 && (
              <InfoRow
                icon={<svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                label="Coste aprox."
                value={formatCurrency(activity.cost, activity.currency)}
              />
            )}
            {activity.notes && (
              <div className="rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Notas</p>
                <p className="mt-0.5 text-sm text-zinc-700 dark:text-zinc-200">{activity.notes}</p>
              </div>
            )}
          </div>

          {/* Participantes */}
          <div className="mx-5 mt-3">
            <p className="mb-2 text-xs font-medium text-zinc-600 dark:text-zinc-300">
              Participantes ({participants.length})
            </p>
            {participants.length === 0 ? (
              <p className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                Nadie se ha unido aún. ¡Sé el primero!
              </p>
            ) : (
              <div className="flex flex-wrap gap-1.5">
                {participants.map((p) => {
                  const name = p.profile?.name ?? "Usuario";
                  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <div key={p.id} className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">
                      <div className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-[8px] font-semibold text-white">
                        {p.profile?.avatar_url ? (
                          <CachedImage src={p.profile.avatar_url} alt="" className="object-cover" sizes="100px" />
                        ) : (
                          initials
                        )}
                      </div>
                      <span className="text-xs text-zinc-700 dark:text-zinc-200">{name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Botón unirse/salir */}
          <div className="mx-5 mt-4">
            {isJoined ? (
              <ConfirmButton
                action={leaveActivity}
                fields={[
                  { name: "activity_id", value: activity.id },
                  { name: "trip_id", value: tripId },
                ]}
                confirmTitle="¿Salir de este plan?"
                confirmMessage="Ya no aparecerás como participante de esta actividad. Puedes unirte de nuevo cuando quieras."
                confirmLabel="Salir"
                variant="danger"
                className="flex w-full items-center justify-center gap-1.5 rounded-xl bg-red-50 py-3 text-sm font-semibold text-red-600 transition hover:bg-red-100 active:scale-95 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Salir
              </ConfirmButton>
            ) : (
              <>
                <form action={joinActivity} onClick={handleJoinClick}>
                  <input type="hidden" name="activity_id" value={activity.id} />
                  <input type="hidden" name="trip_id" value={tripId} />
                  <SubmitButton
                    className="w-full gap-1.5 rounded-xl py-3 text-sm font-semibold active:scale-95"
                    loadingText="Uniéndome..."
                  >
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
                    </svg>
                    Unirme a este plan
                  </SubmitButton>
                </form>

                {/* Diálogo de conflicto */}
                {showConflict && (
                  <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowConflict(false)}>
                    <div
                      className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl dark:bg-zinc-800"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="mb-3 flex items-center gap-2">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                          <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                            <path d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </div>
                        <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Se solapa con otro plan</h4>
                      </div>
                      <p className="mb-3 text-xs text-zinc-500 dark:text-zinc-400">
                        Esta actividad se cruza en horario con {conflicts.length === 1 ? "un plan al que ya estás unido" : `${conflicts.length} planes a los que ya estás unido`}:
                      </p>
                      <div className="mb-4 space-y-2">
                        {conflicts.map((c) => (
                          <div key={c.id} className="flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-700/50">
                            <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] ${bgColor} text-white`}>
                              {ACTIVITY_TYPE_EMOJI[c.type] ?? "👀"}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="line-clamp-1 text-xs font-semibold text-zinc-900 dark:text-zinc-100">{c.title}</p>
                              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">
                                {c.start_time ? formatTime(c.start_time) : ""}
                                {c.end_time ? ` – ${formatTime(c.end_time)}` : ""}
                                {c.location ? ` · ${c.location}` : ""}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShowConflict(false)}
                          className="flex-1 rounded-xl border border-zinc-200 py-2.5 text-sm font-semibold text-zinc-600 dark:border-zinc-600 dark:text-zinc-300"
                        >
                          Cancelar
                        </button>
                        <form action={joinActivity} className="flex-1">
                          <input type="hidden" name="activity_id" value={activity.id} />
                          <input type="hidden" name="trip_id" value={tripId} />
                          <SubmitButton className="w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
                            Unirme igual
                          </SubmitButton>
                        </form>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </Modal>
    </>
  );
}

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center gap-2.5 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-800">
      <span className="text-zinc-400 dark:text-zinc-500">{icon}</span>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400 dark:text-zinc-500">{label}</p>
        <p className="truncate text-sm text-zinc-700 dark:text-zinc-200">{value}</p>
      </div>
    </div>
  );
}
