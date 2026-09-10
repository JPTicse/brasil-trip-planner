"use client";

import { useState } from "react";
import { createTransport } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CURRENCIES, TRANSPORT_TYPE_LABELS, type Profile } from "@/lib/types";

export function TransportForm({
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
        <PlusIcon /> Añadir transporte
      </button>
    );
  }

  return (
    <form action={createTransport} className="space-y-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <input type="hidden" name="trip_id" value={tripId} />

      <Field label="Tipo *">
        <Select name="type" defaultValue="flight">
          {Object.entries(TRANSPORT_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </Select>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Desde">
          <TextInput name="from_location" placeholder="Ej: Madrid" />
        </Field>
        <Field label="Hasta">
          <TextInput name="to_location" placeholder="Ej: Río de Janeiro" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Salida">
          <TextInput name="departure_at" type="datetime-local" />
        </Field>
        <Field label="Llegada">
          <TextInput name="arrival_at" type="datetime-local" />
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Coste">
          <TextInput name="cost" type="number" step="0.01" placeholder="0.00" />
        </Field>
        <Field label="Moneda">
          <Select name="currency" defaultValue="BRL">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="URL de reserva">
        <TextInput name="booking_url" type="url" placeholder="https://..." />
      </Field>

      <Field label="Reservado por">
        <Select name="booked_by" defaultValue="">
          <option value="">Sin asignar</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>{m.name ?? "Usuario"}</option>
          ))}
        </Select>
      </Field>

      <Field label="Notas">
        <TextArea name="notes" rows={2} placeholder="Número de vuelo, terminal, equipaje..." />
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
