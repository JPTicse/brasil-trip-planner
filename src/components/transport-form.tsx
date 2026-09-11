"use client";

import { useState } from "react";
import { createTransport } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CURRENCIES, TRANSPORT_TYPE_LABELS, type Profile } from "@/lib/types";
import { FloatingActionButton } from "@/components/floating-button";
import { Modal } from "@/components/modal";

export function TransportForm({
  tripId,
  members,
}: {
  tripId: string;
  members: Profile[];
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <FloatingActionButton onClick={() => setOpen(true)} label="Añadir transporte" />
      <Modal open={open} onClose={() => setOpen(false)} zIndex={50}>
        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Añadir transporte</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 dark:text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <form action={createTransport} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-6 pt-1">
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

          <div className="sticky bottom-0 -mx-5 mt-2 flex gap-2 border-t border-zinc-100 bg-white px-5 py-3 pt-1 dark:border-zinc-800 dark:bg-zinc-900">
            <SubmitButton className="flex-1">Añadir</SubmitButton>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
