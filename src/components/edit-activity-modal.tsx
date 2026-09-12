"use client";

import { CachedImage } from "@/components/cached-image";
import { useActionState, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { updateActivity } from "@/lib/actions";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { ImageUpload } from "@/components/image-upload";
import { Modal } from "@/components/modal";
import { ACTIVITY_TYPE_LABELS, CURRENCIES, type Activity, type ActivityType } from "@/lib/types";

const TYPE_GRADIENT: Record<string, string> = {
  visit: "bg-sky-600",
  tour: "bg-violet-600",
  meal: "bg-amber-600",
  event: "bg-rose-600",
  free: "bg-emerald-600",
  transport: "bg-slate-600",
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
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        onPointerDown={(e) => e.stopPropagation()}
        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black/35 text-white transition hover:bg-white/30"
        title="Editar actividad"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} zIndex={60}>
        <div className="flex h-[85dvh] flex-col overflow-hidden sm:h-auto sm:max-h-[90dvh]">
          {/* Header fijo */}
          <div className="flex shrink-0 items-center justify-between px-5 pb-2">
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Editar actividad</h3>
            <button
              onClick={() => setOpen(false)}
              className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </div>

          {/* Form */}
          <EditActivityFormInner
            activity={activity}
            tripId={tripId}
            onClose={() => setOpen(false)}
          />
        </div>
      </Modal>
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

  const [title, setTitle] = useState(activity.title ?? "");
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
  const [showImagePopover, setShowImagePopover] = useState(false);

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
      className="flex min-h-0 flex-1 flex-col"
    >
      <input type="hidden" name="activity_id" value={activity.id} />
      <input type="hidden" name="trip_id" value={tripId} />

      {/* Campos scrolleables */}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto overscroll-contain px-5 pb-4 pt-4">
        {/* Header con imagen (scrollea con el contenido) */}
        <div className="relative -mx-5 -mt-4 mb-3 h-44 w-[calc(100%+2.5rem)] overflow-hidden">
          {imageUrl ? (
            <>
              <CachedImage src={imageUrl} alt={title} className="object-cover" sizes="100px" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
            </>
          ) : (
            <div className={`h-full w-full ${gradient}`} />
          )}
          <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
            <div className="flex items-center gap-2">
              <span className="text-3xl">{emoji}</span>
              <h3 className="text-xl font-extrabold drop-shadow">{title || "Editar actividad"}</h3>
            </div>
          </div>
          {/* Botón editar imagen (arriba derecha) */}
          <button
            type="button"
            onClick={() => setShowImagePopover(true)}
            className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60 active:scale-90"
            title="Editar imagen"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Popover de imagen */}
        {showImagePopover && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4" onClick={() => setShowImagePopover(false)}>
            <div
              className="w-full max-w-xs rounded-2xl bg-white p-4 shadow-2xl dark:bg-zinc-800"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-3 flex items-center justify-between">
                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Imagen del plan</h4>
                <button
                  type="button"
                  onClick={() => setShowImagePopover(false)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-700"
                >
                  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
              <ImageUpload
                imageUrl={imageUrl}
                onUploaded={(url) => {
                  setImageUrl(url);
                  if (url) setShowImagePopover(false);
                }}
              />
            </div>
          </div>
        )}

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

        <Field label="Notas">
          <TextArea name="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </Field>

        {state && <p className="text-sm text-red-600">{state}</p>}
      </div>

      {/* Botón fijo abajo */}
      <div className="shrink-0 border-t border-zinc-100 bg-white/95 px-5 py-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] dark:border-zinc-800 dark:bg-zinc-900/95">
        <SubmitButton className="w-full rounded-2xl py-3.5 text-base shadow-lg shadow-emerald-500/20">
          Guardar cambios
        </SubmitButton>
      </div>
    </form>
  );
}
