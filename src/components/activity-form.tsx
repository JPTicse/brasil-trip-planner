"use client";

import { useState } from "react";
import { createActivity } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ACTIVITY_TYPE_LABELS, CURRENCIES, type Profile } from "@/lib/types";

export function ActivityForm({
  tripId,
  members,
  defaultDate,
}: {
  tripId: string;
  members: Profile[];
  defaultDate?: string;
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed border-emerald-300 bg-emerald-50/50 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50"
      >
        <PlusIcon /> Añadir actividad
      </button>
    );
  }

  return (
    <form action={createActivity} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="trip_id" value={tripId} />

      <Field label="Título *">
        <TextInput name="title" required placeholder="Ej: Visita al Cristo Redentor" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha *">
          <TextInput name="date" type="date" required defaultValue={defaultDate} />
        </Field>
        <Field label="Tipo">
          <Select name="type" defaultValue="visit">
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Hora inicio">
          <TextInput name="start_time" type="time" />
        </Field>
        <Field label="Hora fin">
          <TextInput name="end_time" type="time" />
        </Field>
      </div>

      <Field label="Ubicación">
        <TextInput name="location" placeholder="Ej: Parque Nacional da Tijuca" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Coste">
          <TextInput name="cost" type="number" step="0.01" placeholder="0.00" />
        </Field>
        <Field label="Moneda">
          <Select name="currency" defaultValue="BRL">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Responsable">
        <Select name="assigned_to" defaultValue="">
          <option value="">Sin asignar</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name ?? "Usuario"}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Notas">
        <TextArea name="notes" rows={2} placeholder="Notas, reservas, recordatorios..." />
      </Field>

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
