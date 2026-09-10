"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateActivity } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { PlacesAutocomplete, type PlaceResult } from "@/components/places-autocomplete";
import { ImageUpload } from "@/components/image-upload";
import { ACTIVITY_TYPE_LABELS, CURRENCIES, type Activity } from "@/lib/types";

export function EditActivityModal({
  activity,
  tripId,
  currentUserId,
}: {
  activity: Activity;
  tripId: string;
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);
  const isCreator = activity.created_by === currentUserId;

  if (!isCreator) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-blue-50 hover:text-blue-500"
        title="Editar actividad"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h3 className="text-base font-bold text-zinc-900">Editar actividad</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>

            <EditActivityFormInner
              activity={activity}
              tripId={tripId}
              onClose={() => setOpen(false)}
            />
          </div>
        </>
      )}
    </>
  );
}

function EditActivityFormInner({
  activity,
  tripId,
  onClose,
}: {
  activity: Activity;
  tripId: string;
  onClose: () => void;
}) {
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [place, setPlace] = useState<PlaceResult | null>(
    activity.location_lat && activity.location_lng
      ? {
          name: activity.location ?? "",
          lat: activity.location_lat,
          lng: activity.location_lng,
        }
      : null,
  );
  const [locationName, setLocationName] = useState(activity.location ?? "");
  const [title, setTitle] = useState(activity.title);
  const [imageUrl, setImageUrl] = useState<string | null>(activity.image_url ?? null);

  const [state, formAction] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await updateActivity(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Error al actualizar";
      }
    },
    null,
  );

  useEffect(() => {
    if (submitted && state === null) {
      router.refresh();
      onClose();
    }
  }, [submitted, state, onClose, router]);

  return (
    <form
      action={(formData) => {
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
      <input type="hidden" name="activity_id" value={activity.id} />
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="location_lat" value={place?.lat ?? ""} />
      <input type="hidden" name="location_lng" value={place?.lng ?? ""} />

      <Field label="Título *">
        <TextInput
          name="title"
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Fecha *">
          <TextInput name="date" type="date" required defaultValue={activity.date} />
        </Field>
        <Field label="Tipo">
          <Select name="type" defaultValue={activity.type}>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Hora inicio">
          <TextInput name="start_time" type="time" defaultValue={activity.start_time ?? ""} />
        </Field>
        <Field label="Hora fin">
          <TextInput name="end_time" type="time" defaultValue={activity.end_time ?? ""} />
        </Field>
      </div>

      <Field label="Ubicación">
        <PlacesAutocomplete
          value={locationName}
          onChange={(p, name) => {
            setPlace(p);
            setLocationName(name);
          }}
          placeholder="Busca un lugar..."
          titleHint={title}
        />
        <input type="hidden" name="location" value={locationName} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Coste aprox.">
          <TextInput
            name="cost"
            type="number"
            step="0.01"
            defaultValue={activity.cost?.toString() ?? ""}
          />
        </Field>
        <Field label="Moneda">
          <Select name="currency" defaultValue={activity.currency}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Imagen">
        <ImageUpload
          imageUrl={place?.photo_url ?? imageUrl}
          onUploaded={(url) => setImageUrl(url)}
        />
        <input type="hidden" name="image_url" value={imageUrl ?? place?.photo_url ?? ""} />
      </Field>

      <Field label="Notas">
        <TextArea name="notes" rows={2} defaultValue={activity.notes ?? ""} />
      </Field>

      {state && <p className="text-sm text-red-600">{state}</p>}

      <SubmitButton className="w-full">Guardar cambios</SubmitButton>
    </form>
  );
}
