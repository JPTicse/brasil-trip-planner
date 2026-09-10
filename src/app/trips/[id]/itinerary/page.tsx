import { getActivities, getTrip, getTripMembers } from "@/lib/data";
import { ActivityForm } from "@/components/activity-form";
import { DeleteButton, EmptyState } from "@/components/ui";
import { deleteActivity } from "@/lib/actions";
import {
  ACTIVITY_TYPE_LABELS,
  type Activity,
  type ActivityType,
} from "@/lib/types";
import { formatDate, formatTime, formatCurrency, getDaysBetween } from "@/lib/format";

const TYPE_EMOJI: Record<ActivityType, string> = {
  visit: "🏛️",
  tour: "🗺️",
  meal: "🍽️",
  event: "🎉",
  free: "☕",
  transport: "🚌",
};

export default async function ItineraryPage({
  params,
}: PageProps<"/trips/[id]/itinerary">) {
  const { id } = await params;
  const [activities, trip, members] = await Promise.all([
    getActivities(id),
    getTrip(id),
    getTripMembers(id),
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

  // Generar lista de días: si hay fechas del viaje, usarlas; si no, usar las fechas de actividades
  const days =
    trip?.start_date && trip?.end_date
      ? getDaysBetween(trip.start_date, trip.end_date)
      : [...byDate.keys()].sort();

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
            description="Añade actividades, tours o visitas para cada día del viaje."
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
                    dayActivities.map((a) => <ActivityCard key={a.id} activity={a} tripId={id} />)
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

function ActivityCard({ activity, tripId }: { activity: Activity; tripId: string }) {
  return (
    <div className="rounded-lg border border-zinc-200 bg-white p-3 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span>{TYPE_EMOJI[activity.type]}</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
              {ACTIVITY_TYPE_LABELS[activity.type]}
            </span>
          </div>
          <h4 className="mt-1 font-medium text-zinc-900">{activity.title}</h4>
          {(activity.start_time || activity.end_time) && (
            <p className="mt-0.5 text-xs text-zinc-500">
              🕐 {formatTime(activity.start_time)}
              {activity.end_time && ` – ${formatTime(activity.end_time)}`}
            </p>
          )}
          {activity.location && (
            <p className="mt-0.5 text-xs text-zinc-500">📍 {activity.location}</p>
          )}
          {activity.cost !== null && (
            <p className="mt-0.5 text-xs font-medium text-emerald-700">
              💰 {formatCurrency(activity.cost, activity.currency)}
            </p>
          )}
          {activity.assignee && (
            <p className="mt-1 text-xs text-zinc-400">
              👤 {activity.assignee.name ?? "Asignado"}
            </p>
          )}
          {activity.notes && (
            <p className="mt-1.5 rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-500">
              {activity.notes}
            </p>
          )}
        </div>
        <form action={deleteActivity}>
          <input type="hidden" name="activity_id" value={activity.id} />
          <input type="hidden" name="trip_id" value={tripId} />
          <DeleteButton>Eliminar</DeleteButton>
        </form>
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
