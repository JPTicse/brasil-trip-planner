"use client";

import { useState } from "react";
import { addTripMember } from "@/lib/actions";
import { Field, TextInput } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";

export function AddMemberForm({ tripId }: { tripId: string }) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
      >
        <PlusIcon /> Invitar miembro
      </button>
    );
  }

  return (
    <form action={addTripMember} className="space-y-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <input type="hidden" name="trip_id" value={tripId} />
      <Field label="Email del amigo *">
        <TextInput
          name="email"
          type="email"
          required
          placeholder="amigo@gmail.com"
        />
      </Field>
      <p className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-xs text-amber-700 dark:text-amber-400">
        ⚠️ Tu amigo debe haber iniciado sesión al menos una vez en la app con su
        Google para poder añadirlo.
      </p>
      <div className="flex gap-2 pt-1">
        <SubmitButton>Invitar</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
