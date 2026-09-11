import { getActivities, getTrip, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ActivityForm } from "@/components/activity-form";
import { EmptyState } from "@/components/ui";
import { ActivityDetailModal } from "@/components/activity-detail-modal";
import { EditActivityModal } from "@/components/edit-activity-modal";
import { ExploreActivitiesModal } from "@/components/explore-activities-modal";
import { deleteActivity, joinActivity, leaveActivity } from "@/lib/actions";
import {
  ACTIVITY_TYPE_LABELS,
  type Activity,
  type ActivityType,
} from "@/lib/types";
import { formatDate, formatTime, formatCurrency, getDaysBetween } from "@/lib/format";

const TYPE_GRADIENT: Record<ActivityType, string> = {
  visit: "from-blue-500 to-cyan-400",
  tour: "from-purple-500 to-pink-400",
  meal: "from-orange-500 to-amber-400",
  event: "from-red-500 to-rose-400",
  free: "from-green-500 to-emerald-400",
  transport: "from-zinc-600 to-slate-400",
};

const TYPE_ICON: Record<ActivityType, string> = {
  visit: "M3 21h18M3 10h18M5 6l7-3 7 3M4 10v11M20 10v11M9 10v11M15 10v11",
  tour: "M12 2a8 8 0 100 16 8 8 0 000-16zM12 6v6l4 2",
  meal: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  event: "M12 2l2.5 5 5.5.8-4 4 1 5.5L12 15l-5 2.5 1-5.5-4-4 5.5-.8L12 2z",
  free: "M5 3v18M5 3l10 9-10 9",
  transport: "M4 16l2-6h12l2 6M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M4 16h16M18 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3",
};

export default async function ItineraryPage({
  params,
}: PageProps<"/trips/[id]/itinerary">) {
  const { id } = await params;
  const [activities, trip, members, user] = await Promise.all([
    getActivities(id),
    getTrip(id),
    getTripMembers(id),
    getCurrentUser(),
  ]);

  const memberProfiles = members
    .map((m) => m.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

  const currentUserId = user?.id ?? "";

  // Separar en "mis planes" (unidos) y "explorar" (todos los demás)
  const myActivities = activities.filter((a) =>
    (a.participants ?? []).some((p) => p.user_id === currentUserId),
  );
  const exploreActivities = activities.filter((a) =>
    !(a.participants ?? []).some((p) => p.user_id === currentUserId),
  );

  // Agrupar "mis planes" por fecha
  const myByDate = new Map<string, Activity[]>();
  for (const a of myActivities) {
    const list = myByDate.get(a.date) ?? [];
    list.push(a);
    myByDate.set(a.date, list);
  }

  const days =
    trip?.start_date && trip?.end_date
      ? getDaysBetween(trip.start_date, trip.end_date)
      : [...myByDate.keys()].sort();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Itinerario</h2>
        <div className="flex items-center gap-2">
          <ExploreActivitiesModal
            activities={activities}
            tripId={id}
            currentUserId={currentUserId}
          />
          <span className="text-sm text-zinc-400">
            {myActivities.length} míos
          </span>
        </div>
      </div>

      {/* Mis planes */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
          <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Mis planes
        </h3>

        {myActivities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white/50 px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">
              No te has unido a ningún plan todavía.
              <br />
              Explora las actividades abajo y únete.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {days
              .filter((day) => (myByDate.get(day) ?? []).length > 0)
              .map((day, idx) => {
                const dayActivities = myByDate.get(day) ?? [];
                return (
                  <div key={day} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                        {idx + 1}
                      </div>
                      <h4 className="text-sm font-semibold text-zinc-700">
                        {formatDate(day)}
                      </h4>
                    </div>
                    <div className="ml-4 space-y-2 border-l-2 border-emerald-200 pl-4">
                      {dayActivities.map((a) => (
                        <ActivityCard
                          key={a.id}
                          activity={a}
                          tripId={id}
                          currentUserId={currentUserId}
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Explorar */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-700">
          <svg className="h-4 w-4 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Explorar actividades
        </h3>

        {exploreActivities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white/50 px-4 py-8 text-center">
            <p className="text-sm text-zinc-400">
              No hay actividades por explorar.
              <br />
              ¡Propón una nueva!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {exploreActivities.map((a) => (
              <ActivityCard
                key={a.id}
                activity={a}
                tripId={id}
                currentUserId={currentUserId}
              />
            ))}
          </div>
        )}
      </section>

      <ActivityForm
        tripId={id}
        tripDestination={trip?.destination ?? "Brasil"}
        tripStartDate={trip?.start_date ?? undefined}
        tripEndDate={trip?.end_date ?? undefined}
      />
    </div>
  );
}

function ActivityCard({
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

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm transition hover:shadow-md">
      {/* Banda de color por tipo */}
      <div className={`h-1 bg-gradient-to-r ${TYPE_GRADIENT[activity.type] ?? TYPE_GRADIENT.visit}`} />

      {/* Imagen de la actividad con título superpuesto */}
      {activity.image_url ? (
        <div className="relative h-36 w-full overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activity.image_url}
            alt={activity.title}
            className="h-full w-full object-cover transition duration-300 hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
          {/* Tipo badge arriba a la derecha */}
          <div className="absolute right-2 top-2">
            <span className="rounded-full bg-black/50 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
          </div>
          {/* Título + info abajo */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h4 className="text-sm font-bold text-white drop-shadow-md">{activity.title}</h4>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[10px] text-white/90">
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
                  <span className="max-w-[100px] truncate">{activity.location}</span>
                </span>
              )}
              {activity.cost !== null && activity.cost > 0 && (
                <span className="font-medium text-emerald-300">
                  {formatCurrency(activity.cost, activity.currency)}
                </span>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <div className="p-3">
        {/* Header (solo si no hay imagen) */}
        {!activity.image_url && (
          <div className="flex items-start gap-2.5">
            <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br ${TYPE_GRADIENT[activity.type] ?? TYPE_GRADIENT.visit} text-white`}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d={TYPE_ICON[activity.type] ?? TYPE_ICON.visit} />
              </svg>
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-zinc-900">{activity.title}</h4>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400">
              <span className="rounded bg-zinc-100 px-1.5 py-0.5 font-medium text-zinc-500">
                {ACTIVITY_TYPE_LABELS[activity.type]}
              </span>
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
                <span className="font-medium text-emerald-700">
                  {formatCurrency(activity.cost, activity.currency)}
                </span>
              )}
            </div>
          </div>
          </div>
        )}

        {/* Botones de editar/eliminar (siempre visibles para el creador) */}
        {isCreator && (
          <div className="flex justify-end gap-1">
            <EditActivityModal
              activity={activity}
              tripId={tripId}
              currentUserId={currentUserId}
            />
            <form action={deleteActivity}>
              <input type="hidden" name="activity_id" value={activity.id} />
              <input type="hidden" name="trip_id" value={tripId} />
              <button
                type="submit"
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-red-50 hover:text-red-500"
                title="Eliminar actividad"
              >
                <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </form>
          </div>
        )}

        {/* Notas (para tarjetas con imagen) */}
        {activity.image_url && activity.notes && (
          <p className="mt-2 rounded-lg bg-zinc-50 px-2.5 py-1.5 text-xs text-zinc-500">
            {activity.notes}
          </p>
        )}

        {/* Footer: participantes + botón */}
        <div className={`flex items-center justify-between gap-2 border-t border-zinc-100 pt-2 ${activity.image_url ? "mt-2" : "mt-2.5"}`}>
          <div className="flex min-w-0 items-center gap-1.5">
            {participantCount > 0 ? (
              <>
                <div className="flex -space-x-1.5">
                  {participants.slice(0, 5).map((p) => {
                    const name = p.profile?.name ?? "Usuario";
                    const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                    return (
                      <div
                        key={p.id}
                        className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 border-white bg-emerald-600 text-[8px] font-semibold text-white"
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
                <span className="text-[11px] text-zinc-400">
                  {participantCount} {participantCount === 1 ? "unido" : "unidos"}
                </span>
              </>
            ) : (
              <span className="text-[11px] text-zinc-400">Nadie se ha unido aún</span>
            )}
          </div>

          <div className="flex shrink-0 items-center gap-1.5">
            {/* Botón ver detalle */}
            <ActivityDetailModal
              activity={activity}
              tripId={tripId}
              currentUserId={currentUserId}
              trigger={
                <button
                  type="button"
                  className="flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white px-2.5 py-1 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-50"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" strokeLinecap="round" strokeLinejoin="round" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  Ver
                </button>
              }
            />

            {/* Botón unirse/salir */}
            {isJoined ? (
              <form action={leaveActivity}>
                <input type="hidden" name="activity_id" value={activity.id} />
                <input type="hidden" name="trip_id" value={tripId} />
                <button
                  type="submit"
                  className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-200 active:scale-95"
                >
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                    <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Unido
                </button>
              </form>
            ) : (
              <form action={joinActivity}>
                <input type="hidden" name="activity_id" value={activity.id} />
                <input type="hidden" name="trip_id" value={tripId} />
                <button
                  type="submit"
                  className="flex items-center gap-0.5 rounded-full border border-emerald-300 bg-white px-2.5 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-95"
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
    </div>
  );
}
