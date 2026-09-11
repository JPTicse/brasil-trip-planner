import { getActivities, getTrip, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ActivityForm } from "@/components/activity-form";
import { ActivityCard } from "@/components/activity-card";
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

