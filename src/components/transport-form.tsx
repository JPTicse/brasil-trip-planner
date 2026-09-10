"use client";

import { useState } from "react";
import { createTransport } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CURRENCIES, TRANSPORT_TYPE_LABELS, type Profile } from "@/lib/types";
import { FloatingActionButton } from "@/components/floating-button";

export function TransportForm({
  tripId,
  members,
}: {
  tripId: string;
  members: Profile[];
}) {
  const [open, setOpen] = useState(false);

  if (!open) {
    return <FloatingActionButton onClick={() => setOpen(true)} label="Añadir transporte" />;
  }

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>
        <div className="flex items-center justify-between px-5 pb-2">
          <h3 className="text-base font-bold text-zinc-900">Añadir transporte</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <form action={createTransport} className="max-h-[70vh] space-y-3 overflow-y-auto px-5 pb-6 pt-1">
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
            <SubmitButton className="flex-1">Añadir</SubmitButton>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
