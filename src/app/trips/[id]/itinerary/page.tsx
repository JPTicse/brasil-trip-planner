import { getActivities, getTrip, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ActivityForm } from "@/components/activity-form";
import { ExploreActivitiesModal } from "@/components/explore-activities-modal";
import { ExploreCardC } from "@/components/explore-card-variants";
import { ItineraryTabs } from "@/components/itinerary-tabs";
import { type Activity } from "@/lib/types";
import { getDaysBetween } from "@/lib/format";
import Link from "next/link";

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
        <h2 className="text-lg font-bold text-zinc-900 dark:text-white">Itinerario</h2>
        <div className="flex items-center gap-2">
          <Link
            href={`/trips/${id}/settings`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            aria-label="Ajustes del viaje"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <ExploreActivitiesModal
            activities={activities}
            tripId={id}
            currentUserId={currentUserId}
          />
        </div>
      </div>

      {/* Mis planes — vistas Día / Mapa / Lista */}
      <section>
        {myActivities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white/50 px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No te has unido a ningún plan todavía.
              <br />
              Explora las actividades abajo y únete.
            </p>
          </div>
        ) : (
          <ItineraryTabs
            activities={myActivities}
            tripId={id}
            currentUserId={currentUserId}
            days={days}
          />
        )}
      </section>

      {/* Explorar */}
      <section>
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-zinc-700 dark:text-zinc-200">
          <svg className="h-4 w-4 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <circle cx="11" cy="11" r="8" />
            <path d="M21 21l-4.35-4.35" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Explorar actividades
        </h3>

        {exploreActivities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-200 bg-white/50 px-4 py-8 text-center dark:border-zinc-800 dark:bg-zinc-900/50">
            <p className="text-sm text-zinc-400 dark:text-zinc-500">
              No hay actividades por explorar.
              <br />
              ¡Propón una nueva!
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {exploreActivities.map((a) => (
              <ExploreCardC
                key={a.id}
                activity={a}
                tripId={id}
                currentUserId={currentUserId}
                myActivities={myActivities}
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
