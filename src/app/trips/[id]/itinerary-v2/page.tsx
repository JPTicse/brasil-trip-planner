import { getActivities, getTrip, getTripMembers, getInspirations } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ActivityForm } from "@/components/activity-form";
import { ExploreActivitiesModal } from "@/components/explore-activities-modal";
import { ExploreCardV2 } from "@/components/v2/explore-card-v2";
import { ItineraryTabsV2 } from "@/components/v2/itinerary-tabs-v2";
import { InspireButton } from "@/components/v2/inspire-button";
import { type Activity } from "@/lib/types";
import { getDaysBetween } from "@/lib/format";

export default async function ItineraryV2Page({
  params,
}: PageProps<"/trips/[id]/itinerary-v2">) {
  const { id } = await params;
  const [activities, trip, members, user, inspirations] = await Promise.all([
    getActivities(id),
    getTrip(id),
    getTripMembers(id),
    getCurrentUser(),
    getInspirations(id),
  ]);

  const memberProfiles = members
    .map((m) => m.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

  const currentUserId = user?.id ?? "";

  const myActivities = activities.filter((a) =>
    (a.participants ?? []).some((p) => p.user_id === currentUserId),
  );
  const exploreActivities = activities.filter((a) =>
    !(a.participants ?? []).some((p) => p.user_id === currentUserId),
  );

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
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-50">
            Itinerario
          </h2>
          <span className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
            v2 beta
          </span>
        </div>
        <div className="flex items-center gap-2">
          <InspireButton
            inspirations={inspirations}
            tripId={id}
            tripDestination={trip?.city ?? trip?.destination ?? "Brasil"}
            tripStartDate={trip?.start_date ?? undefined}
            tripEndDate={trip?.end_date ?? undefined}
          />
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
          <div className="py-16 text-center">
            <p className="text-sm text-stone-400 dark:text-stone-500">
              No te has unido a ningún plan todavía.
            </p>
            <p className="mt-1 text-sm text-stone-400 dark:text-stone-500">
              Explora las actividades abajo y únete.
            </p>
          </div>
        ) : (
          <ItineraryTabsV2
            activities={myActivities}
            tripId={id}
            currentUserId={currentUserId}
            days={days}
          />
        )}
      </section>

      {/* Explorar */}
      <section>
        <h3 className="mb-4 text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
          Explorar actividades
        </h3>

        {exploreActivities.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-sm text-stone-400 dark:text-stone-500">
              No hay actividades por explorar. ¡Propón una nueva!
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {exploreActivities.map((a) => (
              <ExploreCardV2
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
