import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getTrips } from "@/lib/data";
import { UserMenu } from "@/components/user-menu";
import { formatDateRange } from "@/lib/format";

export default async function TripsPage() {
  const user = await getCurrentUser();
  const trips = await getTrips();

  return (
    <div className="min-h-dvh bg-zinc-50">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <h1 className="text-lg font-bold text-zinc-900">Mis viajes</h1>
          <UserMenu profile={user?.profile ?? null} email={user?.email ?? ""} />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 pb-24">
        {trips.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/50 px-6 py-16 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 shadow-lg">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400">
                <div className="h-6 w-6 rounded-full bg-blue-700" />
              </div>
            </div>
            <h2 className="text-base font-semibold text-zinc-800">
              Aún no tienes viajes
            </h2>
            <p className="mt-1 text-sm text-zinc-500">
              Crea tu primer viaje a Brasil e invita a tus amigos.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {trips.map((trip) => (
              <Link
                key={trip.id}
                href={`/trips/${trip.id}`}
                className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-emerald-300 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate font-semibold text-zinc-900">
                      {trip.name}
                    </h3>
                    {trip.destination && (
                      <p className="mt-0.5 truncate text-sm text-zinc-500">
                        📍 {trip.destination}
                      </p>
                    )}
                  </div>
                  <span className="ml-2 shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700">
                    {trip.member_count} 👥
                  </span>
                </div>
                {(trip.start_date || trip.end_date) && (
                  <p className="mt-2 text-xs text-zinc-400">
                    🗓 {formatDateRange(trip.start_date, trip.end_date)}
                  </p>
                )}
              </Link>
            ))}
          </div>
        )}

        {/* Botón flotante para crear viaje */}
        <Link
          href="/trips/new"
          className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 font-semibold text-white shadow-lg shadow-emerald-600/30 transition hover:bg-emerald-700 active:scale-95"
        >
          <PlusIcon />
          Nuevo viaje
        </Link>
      </main>
    </div>
  );
}

function PlusIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
