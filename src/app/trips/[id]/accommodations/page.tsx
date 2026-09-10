import { getAccommodations, getTripMembers } from "@/lib/data";
import { AccommodationForm } from "@/components/accommodation-form";
import { DeleteButton, EmptyState } from "@/components/ui";
import { deleteAccommodation } from "@/lib/actions";
import type { Accommodation } from "@/lib/types";
import { formatDate, formatCurrency, formatDaysBetween } from "@/lib/format";

export default async function AccommodationsPage({
  params,
}: PageProps<"/trips/[id]/accommodations">) {
  const { id } = await params;
  const [accommodations, members] = await Promise.all([
    getAccommodations(id),
    getTripMembers(id),
  ]);

  const memberProfiles = members
    .map((m) => m.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

  const totalCost = accommodations.reduce((sum, a) => sum + (a.cost ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Hoteles</h2>
        {accommodations.length > 0 && (
          <span className="text-sm font-medium text-emerald-700">
            {formatCurrency(totalCost, accommodations[0]?.currency ?? "BRL")}
          </span>
        )}
      </div>

      {accommodations.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            icon={<BedIcon />}
            title="Sin alojamientos"
            description="Añade los hoteles o apartamentos del viaje y quién los reserva."
          />
        </div>
      ) : (
        <div className="space-y-3">
          {accommodations.map((acc) => (
            <AccommodationCard key={acc.id} acc={acc} tripId={id} />
          ))}
        </div>
      )}

      <AccommodationForm tripId={id} members={memberProfiles} />
    </div>
  );
}

function AccommodationCard({ acc, tripId }: { acc: Accommodation; tripId: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-zinc-900">🏨 {acc.name}</h4>
          {acc.address && (
            <p className="mt-0.5 text-xs text-zinc-500">📍 {acc.address}</p>
          )}
          {(acc.check_in || acc.check_out) && (
            <p className="mt-1 text-xs text-zinc-600">
              🗓 {formatDate(acc.check_in)} → {formatDate(acc.check_out)}
              {acc.check_in && acc.check_out && (
                <span className="ml-1 text-zinc-400">
                  ({formatDaysBetween(acc.check_in, acc.check_out)})
                </span>
              )}
            </p>
          )}
          {acc.cost !== null && (
            <p className="mt-1 text-sm font-medium text-emerald-700">
              💰 {formatCurrency(acc.cost, acc.currency)}
            </p>
          )}
          {acc.booker && (
            <p className="mt-1 text-xs text-zinc-400">
              👤 Reservado por {acc.booker.name ?? "miembro"}
            </p>
          )}
          {acc.booking_url && (
            <a
              href={acc.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              🔗 Ver reserva
            </a>
          )}
          {acc.notes && (
            <p className="mt-1.5 rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-500">
              {acc.notes}
            </p>
          )}
        </div>
        <form action={deleteAccommodation}>
          <input type="hidden" name="accommodation_id" value={acc.id} />
          <input type="hidden" name="trip_id" value={tripId} />
          <DeleteButton>Eliminar</DeleteButton>
        </form>
      </div>
    </div>
  );
}

function BedIcon() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2H6z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
