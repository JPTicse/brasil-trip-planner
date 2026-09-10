import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { getTrips } from "@/lib/data";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { RealtimeTrips } from "@/components/realtime-trips";
import { formatDateRange } from "@/lib/format";

export default async function TripsPage() {
  const user = await getCurrentUser();
  const trips = await getTrips();

  const myTrips = trips.filter((t) => t.is_member);
  const otherTrips = trips.filter((t) => !t.is_member);

  return (
    <div className="min-h-dvh bg-zinc-50">
      <RealtimeTrips />
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <Logo size="sm" href="/" />
            <Link href="/" className="text-lg font-bold text-zinc-900 hover:text-emerald-600 transition">
              Viajes
            </Link>
          </div>
          <UserMenu profile={user?.profile ?? null} email={user?.email ?? ""} />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6 pb-24">
        {/* Mis viajes */}
        <section>
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
            Mis viajes
          </h2>
          {myTrips.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-zinc-300 bg-white/50 px-6 py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-600 shadow-lg">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-yellow-400">
                  <div className="h-6 w-6 rounded-full bg-blue-700" />
                </div>
              </div>
              <h3 className="text-base font-semibold text-zinc-800">
                Aún no tienes viajes
              </h3>
              <p className="mt-1 text-sm text-zinc-500">
                Crea tu primer viaje a Brasil e invita a tus amigos.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {myTrips.map((trip) => (
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
        </section>

        {/* Otros viajes (solicitud pendiente o disponible para solicitar) */}
        {otherTrips.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">
              Otros viajes
            </h2>
            <div className="space-y-3">
              {otherTrips.map((trip) => (
                <Link
                  key={trip.id}
                  href={`/trips/${trip.id}`}
                  className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition hover:border-amber-300 hover:shadow-md active:scale-[0.99]"
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
                    <span className="ml-2 shrink-0 rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-medium text-zinc-600">
                      {trip.member_count} 👥
                    </span>
                  </div>
                  {(trip.start_date || trip.end_date) && (
                    <p className="mt-2 text-xs text-zinc-400">
                      🗓 {formatDateRange(trip.start_date, trip.end_date)}
                    </p>
                  )}
                  <div className="mt-2">
                    {trip.access_request_status === "pending" ? (
                      <span className="inline-block rounded-full bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700">
                        ⏳ Solicitud pendiente
                      </span>
                    ) : trip.access_request_status === "rejected" ? (
                      <span className="inline-block rounded-full bg-red-50 px-2.5 py-1 text-xs font-medium text-red-700">
                        ✗ Solicitud rechazada
                      </span>
                    ) : (
                      <span className="inline-block rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700">
                        🔒 Solicitar acceso
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </section>
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
