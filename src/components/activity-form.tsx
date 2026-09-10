"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "@/lib/actions";
import { suggestPlace } from "@/lib/suggest";
import { Field, TextInput, TextArea, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { ACTIVITY_TYPE_LABELS, CURRENCIES, type Profile, type ActivityType } from "@/lib/types";
import { FloatingActionButton } from "@/components/floating-button";

type Suggestion = {
  place_id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  photo_url: string | null;
  rating: number | null;
  price_level: number | null;
  suggested_type: string;
  suggested_time: string | null;
  suggested_cost: number | null;
  suggested_currency: string;
  opening_hours: string | null;
  website: string | null;
  phone: string | null;
  types: string[];
};

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

  return (
    <>
      <FloatingActionButton
        onClick={() => setOpen(true)}
        label="Proponer actividad"
      />

      {open && (
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

            <Wizard
              tripId={tripId}
              defaultDate={defaultDate}
              onSuccess={handleSuccess}
            />
          </div>
        </>
      )}
    </>
  );
}

const STEPS = ["Título", "Lugar", "Detalles", "Revisar"] as const;

function Wizard({
  tripId,
  defaultDate,
  onSuccess,
}: {
  tripId: string;
  defaultDate?: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Datos finales del formulario
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(defaultDate ?? "");
  const [type, setType] = useState<ActivityType>("visit");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [location, setLocation] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [cost, setCost] = useState<string>("");
  const [currency, setCurrency] = useState("BRL");
  const [notes, setNotes] = useState("");
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Paso 1: Buscar sugerencias cuando se avanza
  const searchSuggestions = async (query: string) => {
    if (query.trim().length < 3) return;
    setLoading(true);
    setError(null);
    try {
      const data = await suggestPlace(query);
      if (data.error) {
        setError(data.error);
      } else if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
        selectSuggestion(data.suggestions[0]);
      } else {
        setError("No se encontraron lugares. Puedes continuar manualmente.");
      }
    } catch {
      setError("Error al buscar. Puedes continuar manualmente.");
    } finally {
      setLoading(false);
    }
  };

  const selectSuggestion = (s: Suggestion) => {
    setSelectedSuggestion(s);
    setLocation(s.address || s.name);
    setLat(s.lat);
    setLng(s.lng);
    if (s.photo_url) setImageUrl(s.photo_url);
    if (s.suggested_type) setType(s.suggested_type as ActivityType);
    if (s.suggested_time) setStartTime(s.suggested_time);
    if (s.suggested_cost != null) setCost(String(s.suggested_cost));
    if (s.suggested_currency) setCurrency(s.suggested_currency);
  };

  const next = () => {
    if (step === 0 && title.trim().length >= 3) {
      // Buscar sugerencias al avanzar del paso 1
      searchSuggestions(title);
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (formData: FormData) => {
    // El formulario ya tiene todos los campos hidden
    try {
      await createActivity(formData);
      router.refresh();
      onSuccess();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al crear");
    }
  };

  return (
    <div className="max-h-[75vh] overflow-y-auto px-5 pb-6 pt-1">
      {/* Indicador de pasos */}
      <div className="mb-4 flex items-center justify-between">
        {STEPS.map((label, i) => (
          <div key={label} className="flex flex-1 flex-col items-center">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition ${
                i < step
                  ? "bg-emerald-600 text-white"
                  : i === step
                    ? "bg-emerald-600 text-white ring-4 ring-emerald-100"
                    : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {i < step ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`mt-1.5 text-[10px] ${i <= step ? "font-semibold text-zinc-700" : "text-zinc-400"}`}>
              {label}
            </span>
          </div>
        ))}
      </div>

      {/* Paso 0: Título */}
      {step === 0 && (
        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">
              ¿Qué quieres proponer?
            </label>
            <TextInput
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Visita al Cristo Redentor"
              required
            />
            <p className="mt-1.5 text-[11px] text-zinc-400">
              Escribe el nombre del lugar o actividad. Buscaremos sugerencias automáticamente.
            </p>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-zinc-600">Fecha *</label>
            <TextInput
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <button
            onClick={next}
            disabled={title.trim().length < 3}
            className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
          >
            Buscar sugerencias
          </button>
        </div>
      )}

      {/* Paso 1: Elegir lugar */}
      {step === 1 && (
        <div className="space-y-3">
          {loading && (
            <div className="flex flex-col items-center justify-center py-8">
              <svg className="h-8 w-8 animate-spin text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="mt-2 text-sm text-zinc-500">Buscando lugares para "{title}"...</p>
            </div>
          )}

          {!loading && suggestions.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-zinc-600">
                Encontramos {suggestions.length} sugerencias. Toca para elegir:
              </p>
              {suggestions.map((s, i) => (
                <button
                  key={s.place_id}
                  onClick={() => selectSuggestion(s)}
                  className={`flex w-full items-start gap-2.5 rounded-xl border p-2.5 text-left transition ${
                    selectedSuggestion?.place_id === s.place_id
                      ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
                      : "border-zinc-200 bg-white hover:border-emerald-300"
                  }`}
                >
                  {s.photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.photo_url} alt="" className="h-14 w-14 shrink-0 rounded-lg object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-zinc-100">
                      <svg className="h-5 w-5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                        <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="12" cy="10" r="3" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-zinc-900">{s.name}</p>
                    <p className="truncate text-[11px] text-zinc-400">{s.address}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-1.5">
                      {s.rating && (
                        <span className="flex items-center gap-0.5 text-[10px] text-amber-600">
                          <svg className="h-3 w-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                          {s.rating}
                        </span>
                      )}
                      {s.suggested_type && (
                        <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] text-zinc-500">
                          {ACTIVITY_TYPE_LABELS[s.suggested_type as ActivityType] ?? s.suggested_type}
                        </span>
                      )}
                      {s.suggested_cost != null && s.suggested_cost > 0 && (
                        <span className="text-[10px] text-emerald-600">~{s.suggested_cost} {s.suggested_currency}</span>
                      )}
                    </div>
                  </div>
                  {selectedSuggestion?.place_id === s.place_id && (
                    <svg className="h-4 w-4 shrink-0 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}

          {!loading && error && (
            <div className="rounded-xl bg-amber-50 p-3 text-sm text-amber-700">{error}</div>
          )}

          {/* Ubicación manual */}
          {!loading && (
            <div className="border-t border-zinc-100 pt-3">
              <label className="mb-1 block text-xs font-medium text-zinc-600">
                O escribe la ubicación manualmente:
              </label>
              <TextInput
                value={location}
                onChange={(e) => {
                  setLocation(e.target.value);
                  setSelectedSuggestion(null);
                  setLat(null);
                  setLng(null);
                }}
                placeholder="Ej: Copacabana, Río de Janeiro"
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={prev}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Atrás
            </button>
            <button
              onClick={next}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Continuar
            </button>
          </div>
        </div>
      )}

      {/* Paso 2: Detalles */}
      {step === 2 && (
        <div className="space-y-3">
          {imageUrl && (
            <div className="overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-32 w-full object-cover" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Field label="Tipo">
              <Select value={type} onChange={(e) => setType(e.target.value as ActivityType)}>
                {Object.entries(ACTIVITY_TYPE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </Select>
            </Field>
            <Field label="Fecha">
              <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Hora inicio">
              <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </Field>
            <Field label="Hora fin">
              <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </Field>
          </div>

          <Field label="Ubicación">
            <TextInput
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Dirección o lugar"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Coste aprox.">
              <TextInput
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Moneda">
              <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </Select>
            </Field>
          </div>

          <Field label="Imagen">
            <ImageUpload imageUrl={imageUrl} onUploaded={(url) => setImageUrl(url)} />
          </Field>

          <Field label="Notas">
            <TextArea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Notas, reservas, recordatorios..."
            />
          </Field>

          <div className="flex gap-2">
            <button
              onClick={prev}
              className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
            >
              Atrás
            </button>
            <button
              onClick={next}
              className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white hover:bg-emerald-700"
            >
              Revisar
            </button>
          </div>
        </div>
      )}

      {/* Paso 3: Revisar y crear */}
      {step === 3 && (
        <div className="space-y-3">
          {imageUrl && (
            <div className="overflow-hidden rounded-xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt={title} className="h-36 w-full object-cover" />
            </div>
          )}

          <div className="rounded-xl bg-zinc-50 p-3">
            <h4 className="text-base font-bold text-zinc-900">{title}</h4>
            {location && <p className="mt-0.5 text-xs text-zinc-500">{location}</p>}
            <div className="mt-2 flex flex-wrap gap-1.5 text-[11px]">
              <span className="rounded bg-zinc-200 px-1.5 py-0.5 font-medium text-zinc-600">
                {ACTIVITY_TYPE_LABELS[type]}
              </span>
              {date && <span className="text-zinc-500">{date}</span>}
              {startTime && <span className="text-zinc-500">{startTime}{endTime && ` - ${endTime}`}</span>}
              {cost && Number(cost) > 0 && (
                <span className="font-medium text-emerald-700">{cost} {currency}</span>
              )}
            </div>
            {notes && <p className="mt-2 text-xs text-zinc-500">{notes}</p>}
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <form action={handleSubmit}>
            <input type="hidden" name="trip_id" value={tripId} />
            <input type="hidden" name="title" value={title} />
            <input type="hidden" name="date" value={date} />
            <input type="hidden" name="type" value={type} />
            <input type="hidden" name="start_time" value={startTime} />
            <input type="hidden" name="end_time" value={endTime} />
            <input type="hidden" name="location" value={location} />
            <input type="hidden" name="location_lat" value={lat ?? ""} />
            <input type="hidden" name="location_lng" value={lng ?? ""} />
            <input type="hidden" name="cost" value={cost} />
            <input type="hidden" name="currency" value={currency} />
            <input type="hidden" name="notes" value={notes} />
            <input type="hidden" name="image_url" value={imageUrl ?? ""} />

            <div className="flex gap-2">
              <button
                type="button"
                onClick={prev}
                className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Atrás
              </button>
              <SubmitButton className="flex-1">Crear actividad</SubmitButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
