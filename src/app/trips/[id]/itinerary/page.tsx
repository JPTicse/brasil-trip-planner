import { getActivities, getTrip, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ActivityForm } from "@/components/activity-form";
import { EmptyState } from "@/components/ui";
import { deleteActivity, joinActivity, leaveActivity } from "@/lib/actions";
import {
  ACTIVITY_TYPE_LABELS,
  type Activity,
  type ActivityType,
} from "@/lib/types";
import { formatDate, formatTime, formatCurrency, getDaysBetween } from "@/lib/format";

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

  // Agrupar por fecha
  const byDate = new Map<string, Activity[]>();
  for (const a of activities) {
    const list = byDate.get(a.date) ?? [];
    list.push(a);
    byDate.set(a.date, list);
  }

  const days =
    trip?.start_date && trip?.end_date
      ? getDaysBetween(trip.start_date, trip.end_date)
      : [...byDate.keys()].sort();

  const currentUserId = user?.id ?? "";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Itinerario</h2>
        <span className="text-sm text-zinc-400">
          {activities.length} {activities.length === 1 ? "actividad" : "actividades"}
        </span>
      </div>

      {days.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={<CalendarIcon />}
            title="El itinerario está vacío"
            description="Propón actividades, tours o visitas para cada día del viaje. Los demás podrán unirse."
          />
          <ActivityForm tripId={id} members={memberProfiles} />
        </div>
      ) : (
        <div className="space-y-6">
          {days.map((day, idx) => {
            const dayActivities = byDate.get(day) ?? [];
            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-600 text-xs font-bold text-white">
                    {idx + 1}
                  </div>
                  <h3 className="text-sm font-semibold text-zinc-700">
                    {formatDate(day)}
                  </h3>
                </div>

                <div className="ml-4 space-y-2 border-l-2 border-zinc-200 pl-4">
                  {dayActivities.length === 0 ? (
                    <p className="py-2 text-xs text-zinc-400">Día libre</p>
                  ) : (
                    dayActivities.map((a) => (
                      <ActivityCard
                        key={a.id}
                        activity={a}
                        tripId={id}
                        currentUserId={currentUserId}
                      />
                    ))
                  )}
                </div>
              </div>
            );
          })}

          <ActivityForm tripId={id} members={memberProfiles} />
        </div>
      )}
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
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      {/* Header: icono + título + eliminar */}
      <div className="flex items-start gap-2.5 p-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
          <svg className="h-4 w-4 text-zinc-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
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
          {activity.notes && (
            <p className="mt-1.5 rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-500">
              {activity.notes}
            </p>
          )}
        </div>

        {isCreator && (
          <form action={deleteActivity}>
            <input type="hidden" name="activity_id" value={activity.id} />
            <input type="hidden" name="trip_id" value={tripId} />
            <button
              type="submit"
              className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-red-50 hover:text-red-500"
              title="Eliminar actividad"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        )}
      </div>

      {/* Footer: participantes + botón unirse/salir */}
      <div className="flex items-center justify-between gap-2 border-t border-zinc-100 px-3 py-2">
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

        {isJoined ? (
          <form action={leaveActivity}>
            <input type="hidden" name="activity_id" value={activity.id} />
            <input type="hidden" name="trip_id" value={tripId} />
            <button
              type="submit"
              className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-200 active:scale-95"
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
              className="flex shrink-0 items-center gap-1 rounded-full border border-emerald-300 bg-white px-3 py-1 text-[11px] font-semibold text-emerald-700 transition hover:bg-emerald-50 active:scale-95"
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
  );
}

function CalendarIcon() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}
