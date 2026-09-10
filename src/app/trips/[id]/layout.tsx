import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrip, getTripMembers, isTripMember, getMyAccessRequest } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenu } from "@/components/user-menu";
import { Logo } from "@/components/logo";
import { RealtimeTrip } from "@/components/realtime-trip";
import { formatDateRange } from "@/lib/format";
import { RequestAccessForm } from "@/components/request-access-form";

export default async function TripLayout({
  children,
  params,
}: LayoutProps<"/trips/[id]">) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  const user = await getCurrentUser();
  const isMember = await isTripMember(id);

  // Si no es miembro, mostrar vista limitada con opción de solicitar acceso
  if (!isMember) {
    const members = await getTripMembers(id);
    const accessRequest = await getMyAccessRequest(id);

    return (
      <div className="flex min-h-dvh flex-col bg-zinc-50">
        <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-md">
          <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
            <div className="flex min-w-0 items-center gap-2">
              <Link
                href="/trips"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
              >
                <BackIcon />
              </Link>
              <Logo size="sm" href="/" />
              <div className="min-w-0">
                <h1 className="truncate text-base font-bold text-zinc-900">
                  {trip.name}
                </h1>
                {(trip.start_date || trip.end_date) && (
                  <p className="truncate text-xs text-zinc-400">
                    {formatDateRange(trip.start_date, trip.end_date)}
                  </p>
                )}
              </div>
            </div>
            <UserMenu profile={user?.profile ?? null} email={user?.email ?? ""} />
          </div>
        </header>

        <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 pb-24">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-amber-100 text-amber-600">
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-zinc-900">Viaje privado</h2>
            <p className="mt-1 text-sm text-zinc-500">
              No eres miembro de este viaje. Solicita acceso para ver el itinerario, gastos y más.
            </p>

            {trip.destination && (
              <p className="mt-4 text-sm text-zinc-600">
                <span className="font-medium">Destino:</span> {trip.destination}
              </p>
            )}
            <p className="text-sm text-zinc-600">
              <span className="font-medium">Miembros:</span> {members.length}
            </p>

            {accessRequest?.status === "pending" ? (
              <div className="mt-5 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Solicitud enviada. Esperando aprobación del creador.
              </div>
            ) : accessRequest?.status === "rejected" ? (
              <div className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
                Tu solicitud fue rechazada.
              </div>
            ) : (
              <RequestAccessForm tripId={id} />
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50">
      <RealtimeTrip tripId={id} />
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/trips"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
            >
              <BackIcon />
            </Link>
            <Logo size="sm" href="/" />
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-zinc-900">
                {trip.name}
              </h1>
              {(trip.start_date || trip.end_date) && (
                <p className="truncate text-xs text-zinc-400">
                  {formatDateRange(trip.start_date, trip.end_date)}
                </p>
              )}
            </div>
          </div>
          <UserMenu profile={user?.profile ?? null} email={user?.email ?? ""} />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 px-4 py-5 pb-24">{children}</main>

      <BottomNav tripId={id} />
    </div>
  );
}

function BackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
