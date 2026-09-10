import { getTransports, getTripMembers } from "@/lib/data";
import { TransportForm } from "@/components/transport-form";
import { DeleteButton, EmptyState } from "@/components/ui";
import { deleteTransport } from "@/lib/actions";
import { TRANSPORT_TYPE_LABELS, type Transport, type TransportType } from "@/lib/types";
import { formatDateTime, formatCurrency } from "@/lib/format";

const TYPE_EMOJI: Record<TransportType, string> = {
  flight: "✈️",
  bus: "🚌",
  car: "🚗",
  taxi: "🚕",
  boat: "⛵",
  train: "🚆",
};

export default async function TransportPage({
  params,
}: PageProps<"/trips/[id]/transport">) {
  const { id } = await params;
  const [transports, members] = await Promise.all([
    getTransports(id),
    getTripMembers(id),
  ]);

  const memberProfiles = members
    .map((m) => m.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

  const totalCost = transports.reduce((sum, t) => sum + (t.cost ?? 0), 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Transporte</h2>
        {transports.length > 0 && (
          <span className="text-sm font-medium text-emerald-700">
            {formatCurrency(totalCost, transports[0]?.currency ?? "BRL")}
          </span>
        )}
      </div>

      {transports.length === 0 ? (
        <EmptyState
          icon={<PlaneIcon />}
          title="Sin transportes"
          description="Añade vuelos, autobuses o coches para moverse por Brasil."
        />
      ) : (
        <div className="space-y-3">
          {transports.map((t) => (
            <TransportCard key={t.id} transport={t} tripId={id} />
          ))}
        </div>
      )}

      <TransportForm tripId={id} members={memberProfiles} />
    </div>
  );
}

function TransportCard({ transport, tripId }: { transport: Transport; tripId: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">{TYPE_EMOJI[transport.type]}</span>
            <h4 className="font-semibold text-zinc-900">
              {TRANSPORT_TYPE_LABELS[transport.type]}
            </h4>
          </div>

          {(transport.from_location || transport.to_location) && (
            <p className="mt-1 text-sm text-zinc-700">
              {transport.from_location ?? "—"} → {transport.to_location ?? "—"}
            </p>
          )}

          {transport.departure_at && (
            <p className="mt-1 text-xs text-zinc-500">
              🕐 Salida: {formatDateTime(transport.departure_at)}
            </p>
          )}
          {transport.arrival_at && (
            <p className="text-xs text-zinc-500">
              🕐 Llegada: {formatDateTime(transport.arrival_at)}
            </p>
          )}

          {transport.cost !== null && (
            <p className="mt-1 text-sm font-medium text-emerald-700">
              💰 {formatCurrency(transport.cost, transport.currency)}
            </p>
          )}
          {transport.booker && (
            <p className="mt-1 text-xs text-zinc-400">
              👤 Reservado por {transport.booker.name ?? "miembro"}
            </p>
          )}
          {transport.booking_url && (
            <a
              href={transport.booking_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1.5 inline-block text-xs font-medium text-blue-600 hover:underline"
            >
              🔗 Ver reserva
            </a>
          )}
          {transport.notes && (
            <p className="mt-1.5 rounded bg-zinc-50 px-2 py-1 text-xs text-zinc-500">
              {transport.notes}
            </p>
          )}
        </div>
        <form action={deleteTransport}>
          <input type="hidden" name="transport_id" value={transport.id} />
          <input type="hidden" name="trip_id" value={tripId} />
          <DeleteButton>Eliminar</DeleteButton>
        </form>
      </div>
    </div>
  );
}

function PlaneIcon() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5-.3.7-.2 1.4.3 1.9l4.4 4.4-2.6 2.6-2.4-.6c-.5-.1-1 .1-1.2.5l-.5 1 3.4 1.8 1.8 3.4 1-.5c.4-.2.6-.7.5-1.2l-.6-2.4 2.6-2.6 4.4 4.4c.5.5 1.2.6 1.9.3.4-.2.6-.6.5-1.1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
