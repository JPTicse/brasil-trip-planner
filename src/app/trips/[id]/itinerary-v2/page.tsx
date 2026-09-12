import { getActivities, getTrip, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ActivityForm } from "@/components/activity-form";
import { ExploreActivitiesModal } from "@/components/explore-activities-modal";
import { ExploreCardV2 } from "@/components/v2/explore-card-v2";
import { ItineraryTabsV2 } from "@/components/v2/itinerary-tabs-v2";
import { type Activity, type Trip } from "@/lib/types";
import { formatDate, getDaysBetween } from "@/lib/format";

// Banner contextual de estado del viaje (server component).
// Muestra cuenta atrás (próximo), día actual (en curso) o completado (pasado).
function TripStatusBanner({ trip }: { trip: Trip }) {
  const { start_date, end_date } = trip;
  if (!start_date || !end_date) return null;

  const today = new Date().toISOString().slice(0, 10);

  // UPCOMING: hoy anterior a la fecha de inicio
  if (today < start_date) {
    const daysUntil = Math.max(getDaysBetween(today, start_date).length - 1, 0);
    return (
      <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm dark:border-amber-900/40 dark:bg-amber-950/40">
        <svg
          className="h-4 w-4 shrink-0 text-amber-500"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-medium text-amber-800 dark:text-amber-200">
          Tu viaje empieza en {daysUntil} {daysUntil === 1 ? "día" : "días"}
        </span>
        <span className="text-amber-600/80 dark:text-amber-300/70">
          · {formatDate(start_date)}
        </span>
      </div>
    );
  }

  // PAST: hoy posterior a la fecha de fin
  if (today > end_date) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-100 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-900">
        <svg
          className="h-4 w-4 shrink-0 text-zinc-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            d="M5 13l4 4L19 7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span className="font-medium text-zinc-600 dark:text-zinc-300">
          Viaje completado
        </span>
        <span className="text-zinc-400 dark:text-zinc-500">
          · ¿Quieres ver el recap?
        </span>
      </div>
    );
  }

  // ACTIVE: hoy dentro del rango del viaje
  const totalDays = getDaysBetween(start_date, end_date).length;
  const currentDay = getDaysBetween(start_date, today).length;
  return (
    <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm dark:border-emerald-900/40 dark:bg-emerald-950/40">
      <span className="relative flex h-2 w-2 shrink-0">
        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      <span className="font-medium text-emerald-800 dark:text-emerald-200">
        Día {currentDay} de {totalDays}
      </span>
      <span className="text-emerald-600/80 dark:text-emerald-300/70">
        · en curso
      </span>
    </div>
  );
}

export default async function ItineraryV2Page({
  params,
}: PageProps<"/trips/[id]/itinerary-v2">) {
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
        <ExploreActivitiesModal
          activities={activities}
          tripId={id}
          currentUserId={currentUserId}
        />
      </div>

      {/* Banner contextual de estado del viaje */}
      {trip && <TripStatusBanner trip={trip} />}

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
