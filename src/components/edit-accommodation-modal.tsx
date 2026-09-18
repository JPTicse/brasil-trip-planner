"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateAccommodation } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { Modal } from "@/components/modal";
import { CURRENCIES, type Accommodation, type Profile } from "@/lib/types";

export function EditAccommodationModal({
  accommodation,
  members,
}: {
  accommodation: Accommodation;
  members: Profile[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    try {
      await updateAccommodation(formData);
      setOpen(false);
      router.refresh();
      toast.success("Alojamiento actualizado");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo actualizar");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
        title="Editar alojamiento"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} zIndex={60}>
        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Editar alojamiento</h3>
            <p className="text-[11px] text-zinc-400">Cualquier miembro del viaje puede actualizarlo.</p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <form action={handleSubmit} className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-6 pt-1">
          <input type="hidden" name="accommodation_id" value={accommodation.id} />
          <input type="hidden" name="trip_id" value={accommodation.trip_id} />

          <Field label="Nombre / Hotel *">
            <TextInput name="name" required defaultValue={accommodation.name} />
          </Field>

          <Field label="Dirección">
            <TextInput name="address" defaultValue={accommodation.address ?? ""} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Check-in *">
              <TextInput name="check_in" type="date" required defaultValue={accommodation.check_in ?? ""} />
            </Field>
            <Field label="Check-out *">
              <TextInput name="check_out" type="date" required defaultValue={accommodation.check_out ?? ""} />
            </Field>
          </div>
          <p className="-mt-1 text-[11px] text-zinc-400">
            El día del checkout marca la salida y no cuenta como noche alojada.
          </p>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Coste total">
              <TextInput name="cost" type="number" step="0.01" min="0" defaultValue={accommodation.cost ?? ""} />
            </Field>
            <Field label="Moneda">
              <Select name="currency" defaultValue={accommodation.currency || "BRL"}>
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>{currency}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="URL de reserva">
            <TextInput name="booking_url" type="url" defaultValue={accommodation.booking_url ?? ""} placeholder="https://airbnb.com/..." />
          </Field>

          <Field label="Reservado por">
            <Select name="booked_by" defaultValue={accommodation.booked_by ?? ""}>
              <option value="">Sin asignar</option>
              {members.map((member) => (
                <option key={member.id} value={member.id}>{member.name ?? "Usuario"}</option>
              ))}
            </Select>
          </Field>

          <Field label="Notas">
            <TextArea name="notes" rows={3} defaultValue={accommodation.notes ?? ""} />
          </Field>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </p>
          )}

          <div className="sticky bottom-0 -mx-5 flex gap-2 border-t border-zinc-100 bg-white px-5 py-3 dark:border-zinc-800 dark:bg-zinc-900">
            <SubmitButton pending={pending} className="flex-1">Guardar cambios</SubmitButton>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
