"use client";

import { deleteTrip } from "@/lib/actions";
import { ConfirmButton } from "@/components/confirm-button";

export function DeleteTripButton({ tripId }: { tripId: string }) {
  return (
    <ConfirmButton
      action={deleteTrip}
      fields={[{ name: "trip_id", value: tripId }]}
      confirmTitle="¿Eliminar este viaje?"
      confirmMessage="Se borrará permanentemente todo el itinerario, gastos y miembros. Esta acción no se puede deshacer."
      confirmLabel="Eliminar viaje"
      variant="danger"
      className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:bg-zinc-900 dark:text-red-400 dark:hover:bg-red-900/20"
    >
      Eliminar viaje
    </ConfirmButton>
  );
}
