"use client";

import { useState } from "react";
import { createExpense } from "@/lib/actions";
import { Field, TextInput, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CURRENCIES, EXPENSE_CATEGORY_LABELS, type Profile } from "@/lib/types";

export function ExpenseForm({
  tripId,
  members,
}: {
  tripId: string;
  members: Profile[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
      >
        <PlusIcon /> Añadir gasto
      </button>
    );
  }

  return (
    <form action={createExpense} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="split_mode" value="equal" />

      <Field label="Descripción *">
        <TextInput name="description" required placeholder="Ej: Cena en rodizio" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Importe *">
          <TextInput name="amount" type="number" step="0.01" required placeholder="0.00" />
        </Field>
        <Field label="Moneda">
          <Select name="currency" defaultValue="BRL">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pagado por">
          <Select name="paid_by" defaultValue="">
            <option value="">Yo</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name ?? "Usuario"}</option>
            ))}
          </Select>
        </Field>
        <Field label="Categoría">
          <Select name="category" defaultValue="other">
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Fecha">
        <TextInput name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </Field>

      <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        💡 El gasto se repartirá a partes iguales entre todos los miembros del viaje.
      </div>

      <div className="flex gap-2 pt-1">
        <SubmitButton>Añadir</SubmitButton>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
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
