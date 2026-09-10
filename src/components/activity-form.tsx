"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PlacesAutocomplete, type PlaceResult } from "@/components/places-autocomplete";
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

  const handleSuccess = useCallback(() => {
    setOpen(false);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98]"
      >
        <PlusIcon /> Proponer actividad
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl">
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>
        <div className="flex items-center justify-between px-5 pb-2">
          <h3 className="text-base font-bold text-zinc-900">Proponer actividad</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ActivityFormInner
          tripId={tripId}
          defaultDate={defaultDate}
          onSuccess={handleSuccess}
        />
      </div>
    </>
  );
}

function ActivityFormInner({
  tripId,
  defaultDate,
  onSuccess,
}: {
  tripId: string;
  defaultDate?: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [place, setPlace] = useState<PlaceResult | null>(null);
  const [locationName, setLocationName] = useState("");

  const [state, formAction] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await createActivity(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Error al crear actividad";
      }
    },
    null,
  );

  useEffect(() => {
    if (submitted && state === null) {
      router.refresh();
      onSuccess();
    }
  }, [submitted, state, onSuccess, router]);

  return (
    <form
      action={(formData) => {
        // Inyectar coordenadas del lugar seleccionado
        if (place) {
          formData.set("location_lat", String(place.lat));
          formData.set("location_lng", String(place.lng));
          if (!formData.get("location")) {
            formData.set("location", place.name);
          }
        }
        setSubmitted(true);
        formAction(formData);
      }}
      className="max-h-[70vh] space-y-3 overflow-y-auto px-5 pb-6 pt-1"
    >
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="location_lat" value={place?.lat ?? ""} />
      <input type="hidden" name="location_lng" value={place?.lng ?? ""} />

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
        <PlacesAutocomplete
          value={locationName}
          onChange={(p, name) => {
            setPlace(p);
            setLocationName(name);
          }}
          placeholder="Busca un lugar en el mapa..."
        />
        <input type="hidden" name="location" value={locationName} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Coste aprox.">
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

      <Field label="Notas">
        <TextArea name="notes" rows={2} placeholder="Notas, reservas, recordatorios..." />
      </Field>

      {state && (
        <p className="text-sm text-red-600">{state}</p>
      )}

      <SubmitButton className="w-full">Proponer actividad</SubmitButton>
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
