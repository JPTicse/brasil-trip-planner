"use client";

import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateActivity } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { ImageUpload } from "@/components/image-upload";
import { ACTIVITY_TYPE_LABELS, CURRENCIES, type Activity, type ActivityType } from "@/lib/types";

const TYPE_GRADIENT: Record<string, string> = {
  visit: "from-sky-400 to-blue-600",
  tour: "from-violet-400 to-purple-600",
  meal: "from-amber-300 to-orange-500",
  event: "from-rose-300 to-red-500",
  free: "from-emerald-300 to-green-600",
  transport: "from-slate-300 to-zinc-600",
};

const TYPE_EMOJI: Record<string, string> = {
  visit: "👀",
  tour: "🚌",
  meal: "🍽️",
  event: "🎉",
  free: "🌿",
  transport: "✈️",
};

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
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/20 text-white transition hover:bg-white/30"
        title="Editar actividad"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md max-h-[92dvh] rounded-t-3xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
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

  const [title, setTitle] = useState(activity.title);
  const [date, setDate] = useState(activity.date);
  const [type, setType] = useState(activity.type);
  const [startTime, setStartTime] = useState(activity.start_time ?? "");
  const [endTime, setEndTime] = useState(activity.end_time ?? "");
  const [location, setLocation] = useState(activity.location ?? "");
  const [lat, setLat] = useState<number | null>(activity.location_lat);
  const [lng, setLng] = useState<number | null>(activity.location_lng);
  const [cost, setCost] = useState(activity.cost?.toString() ?? "");
  const [currency, setCurrency] = useState(activity.currency ?? "BRL");
  const [notes, setNotes] = useState(activity.notes ?? "");
  const [imageUrl, setImageUrl] = useState<string | null>(activity.image_url ?? null);

  const gradient = TYPE_GRADIENT[type] ?? TYPE_GRADIENT.visit;
  const emoji = TYPE_EMOJI[type] ?? "👀";

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

  const handleSubmit = (formData: FormData) => {
    formData.set("location_lat", lat != null ? String(lat) : "");
    formData.set("location_lng", lng != null ? String(lng) : "");
    formData.set("location", location);
    formData.set("title", title);
    formData.set("date", date);
    formData.set("type", type);
    formData.set("start_time", startTime);
    formData.set("end_time", endTime);
    formData.set("cost", cost);
    formData.set("currency", currency);
    formData.set("notes", notes);

    let finalImage = imageUrl ?? "";
    if (!finalImage && lat != null && lng != null) {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (key) {
        finalImage = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x300&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${key}`;
      }
    }
    formData.set("image_url", finalImage);

    setSubmitted(true);
    formAction(formData);
  };

  return (
    <form
      action={handleSubmit}
      className="max-h-[85dvh] space-y-3 overflow-y-auto px-5 pb-6 pt-1"
    >
      <input type="hidden" name="activity_id" value={activity.id} />
      <input type="hidden" name="trip_id" value={tripId} />

      {/* Header con imagen */}
      <div className="relative -mx-5 -mt-1 mb-3 h-44 w-[calc(100%+2.5rem)] overflow-hidden">
        {imageUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
          </>
        ) : (
          <div className={`h-full w-full bg-gradient-to-br ${gradient}`} />
        )}
        <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
          <div className="flex items-center gap-2">
            <span className="text-3xl">{emoji}</span>
            <h3 className="text-xl font-extrabold drop-shadow">{title || "Editar actividad"}</h3>
          </div>
        </div>
      </div>

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
          <TextInput name="date" type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Tipo">
          <Select name="type" value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
            {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Hora inicio">
          <TextInput name="start_time" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </Field>
        <Field label="Hora fin">
          <TextInput name="end_time" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </Field>
      </div>

      <Field label="Ubicación">
        <LocationAutocomplete
          value={location}
          onChange={(name, newLat, newLng, photoUrl) => {
            setLocation(name);
            setLat(newLat);
            setLng(newLng);
            if (photoUrl != null) setImageUrl(photoUrl);
          }}
          placeholder="Busca un lugar..."
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Coste aprox.">
          <TextInput
            name="cost"
            type="number"
            step="0.01"
            value={cost}
            onChange={(e) => setCost(e.target.value)}
          />
        </Field>
        <Field label="Moneda">
          <Select name="currency" value={currency} onChange={(e) => setCurrency(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Imagen">
        <ImageUpload
          imageUrl={imageUrl}
          onUploaded={(url) => setImageUrl(url)}
        />
      </Field>

      <Field label="Notas">
        <TextArea name="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </Field>

      {state && <p className="text-sm text-red-600">{state}</p>}

      <SubmitButton className="w-full rounded-2xl py-3.5 text-base shadow-lg shadow-emerald-500/20">
        Guardar cambios
      </SubmitButton>
    </form>
  );
}
