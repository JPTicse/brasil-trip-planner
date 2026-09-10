"use client";

import { useActionState } from "react";
import { requestTripAccess } from "@/lib/actions";
import { SubmitButton } from "@/components/submit-button";

export function RequestAccessForm({ tripId }: { tripId: string }) {
  const [state, formAction] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await requestTripAccess(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Error al solicitar acceso";
      }
    },
    null,
  );

  return (
    <form action={formAction} className="mt-5 space-y-3">
      <input type="hidden" name="trip_id" value={tripId} />
      <textarea
        name="message"
        placeholder="Escribe un mensaje opcional para el creador del viaje..."
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        rows={2}
      />
      <SubmitButton className="w-full rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700">
        Solicitar acceso
      </SubmitButton>
      {state && (
        <p className="text-sm text-red-600">{state}</p>
      )}
    </form>
  );
}
