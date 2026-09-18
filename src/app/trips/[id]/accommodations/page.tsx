import { getAccommodations, getTrip, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { AccommodationForm } from "@/components/accommodation-form";
import { AccommodationTimeline } from "@/components/accommodation-timeline";
import { DeleteAccommodationButton } from "@/components/delete-accommodation-button";
import { EmptyState } from "@/components/ui";
import { formatDate, formatDateShort, formatCurrency, formatDaysBetween } from "@/lib/format";
import type { Accommodation, Profile } from "@/lib/types";

export default async function AccommodationsPage({
  params,
}: PageProps<"/trips/[id]/accommodations">) {
  const { id } = await params;
  const [accommodations, trip, members, user] = await Promise.all([
    getAccommodations(id),
    getTrip(id),
    getTripMembers(id),
    getCurrentUser(),
  ]);

  const memberProfiles = members
    .map((m) => m.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Alojamientos</h2>
        {accommodations.length > 0 && (
          <span className="text-xs text-zinc-400">
            {accommodations.length} {accommodations.length === 1 ? "alojamiento" : "alojamientos"}
          </span>
        )}
      </div>

      {accommodations.length === 0 ? (
        <EmptyState
          icon={<BedIcon />}
          title="Sin alojamientos"
          description="Añade tu Airbnb, hotel o apartamento con fechas para ver dónde estarás cada día."
        />
      ) : (
        <>
          {/* Timeline visual */}
          <AccommodationTimeline
            accommodations={accommodations}
            tripStartDate={trip?.start_date ?? null}
            tripEndDate={trip?.end_date ?? null}
          />

          {/* Tarjetas de alojamiento */}
          <div className="space-y-2">
            {accommodations.map((acc) => (
              <AccommodationCard
                key={acc.id}
                accommodation={acc}
                tripId={id}
                currentUserId={user?.id ?? ""}
              />
            ))}
          </div>
        </>
      )}

      <AccommodationForm tripId={id} members={memberProfiles} />
    </div>
  );
}

function AccommodationCard({
  accommodation: acc,
  tripId,
  currentUserId,
}: {
  accommodation: Accommodation;
  tripId: string;
  currentUserId: string;
}) {
  const hasDates = acc.check_in && acc.check_out;
  const nights = hasDates ? formatDaysBetween(acc.check_in, acc.check_out) : "";
  const costPerNight = hasDates && acc.cost ? acc.cost / (parseInt(nights) || 1) : null;
  const isBooker = acc.booked_by === currentUserId;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white shadow-sm dark:border-zinc-700 dark:bg-zinc-800/50">
      {/* Cabecera */}
      <div className="flex items-start gap-3 p-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-700/50">
          <svg className="h-5 w-5 text-zinc-500 dark:text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6M9 11h.01M15 11h.01" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <h4 className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {acc.name}
          </h4>
          {acc.address && (
            <p className="truncate text-[11px] text-zinc-400">
              {acc.address}
            </p>
          )}
        </div>

        {isBooker && (
          <DeleteAccommodationButton
            accommodationId={acc.id}
            tripId={tripId}
            accommodationName={acc.name}
          />
        )}
      </div>

      {/* Fechas */}
      {hasDates && (
        <div className="mx-3 mb-3 flex items-center gap-2 rounded-lg bg-zinc-50 px-3 py-2 dark:bg-zinc-900/30">
          <svg className="h-4 w-4 shrink-0 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
            <path d="M8 2v4M16 2v4M3 10h18M5 4h14a2 2 0 012 2v14a2 2 0 01-2 2H5a2 2 0 01-2-2V6a2 2 0 012-2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <div className="flex min-w-0 flex-1 items-center gap-1.5 text-xs">
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              {formatDateShort(acc.check_in)}
            </span>
            <svg className="h-3 w-3 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-medium text-zinc-700 dark:text-zinc-200">
              {formatDateShort(acc.check_out)}
            </span>
            {nights && (
              <span className="ml-1 rounded bg-zinc-200 px-1.5 py-0.5 text-[10px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                {nights}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Detalles: coste, reservado por, enlace */}
      <div className="flex flex-wrap items-center gap-2 border-t border-zinc-100 px-3 py-2 dark:border-zinc-700/50">
        {acc.cost != null && (
          <div className="flex items-center gap-1 text-[11px]">
            <svg className="h-3.5 w-3.5 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M12 1v22M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">
              {formatCurrency(acc.cost, acc.currency)}
            </span>
            {costPerNight && (
              <span className="text-zinc-400">
                · {formatCurrency(Math.round(costPerNight * 100) / 100, acc.currency)}/noche
              </span>
            )}
          </div>
        )}

        {acc.booker && (
          <div className="flex items-center gap-1 text-[11px] text-zinc-400">
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span>Reservado por {acc.booker.name ?? "miembro"}</span>
          </div>
        )}

        {acc.booking_url && (
          <a
            href={acc.booking_url}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/40"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Ver reserva
          </a>
        )}
      </div>

      {/* Notas */}
      {acc.notes && (
        <div className="border-t border-zinc-100 px-3 py-2 dark:border-zinc-700/50">
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400">{acc.notes}</p>
        </div>
      )}
    </div>
  );
}

function BedIcon() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M2 7v10M2 7h20M2 7a5 5 0 015-5h0M22 7v10M22 7a5 5 0 00-5-5h0M7 7h10M7 7a3 3 0 00-3 3v5M20 10v5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
