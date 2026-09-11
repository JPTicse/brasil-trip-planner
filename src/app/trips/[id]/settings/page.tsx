import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrip } from "@/lib/data";
import { isTripOwner } from "@/lib/data";
import { EditTripForm } from "@/components/edit-trip-form";

export default async function TripSettingsPage({
  params,
}: {
  params: Promise<{ id: string }> | { id: string };
}) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  const owner = await isTripOwner(id);
  if (!owner) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center px-4 text-center">
        <h1 className="text-lg font-bold text-zinc-900">Solo el creador puede editar</h1>
        <Link href={`/trips/${id}`} className="mt-4 text-emerald-600 underline">
          Volver al viaje
        </Link>
      </div>
    );
  }

  // Parsear destination como "Ciudad, País"
  const parts = (trip.destination ?? "").split(",").map((s) => s.trim());
  const city = parts[0] ?? "";
  const country = parts[1] ?? "";

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href={`/trips/${id}`}
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
          >
            <BackIcon />
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">Editar viaje</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        <EditTripForm
          tripId={id}
          defaultName={trip.name}
          defaultCountry={country}
          defaultCity={city}
          defaultStartDate={trip.start_date ?? ""}
          defaultEndDate={trip.end_date ?? ""}
          defaultDescription={trip.description ?? ""}
        />
      </main>
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
