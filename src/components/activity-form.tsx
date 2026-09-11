"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "@/lib/actions";
import { suggestPlace, type Suggestion } from "@/lib/suggest";
import { TextInput, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { POPULAR_COUNTRIES } from "@/components/country-select";
import { ACTIVITY_TYPE_LABELS, CURRENCIES, type Profile, type ActivityType } from "@/lib/types";
import { FloatingActionButton } from "@/components/floating-button";

function parseTripDestination(destination?: string) {
  const [city = "", country = ""] = (destination ?? "").split(",").map((s) => s.trim());
  const code =
    POPULAR_COUNTRIES.find((c) => c.name.toLowerCase() === country.toLowerCase())?.code ??
    country;
  return { city, country, code };
}

const STEPS = [
  { key: "name", label: "Nombre" },
  { key: "location", label: "Ubicación" },
  { key: "date", label: "Fecha" },
  { key: "type", label: "Tipo" },
  { key: "time", label: "Horario" },
  { key: "cost", label: "Coste" },
  { key: "details", label: "Detalles" },
  { key: "review", label: "Revisar" },
];

const TYPE_ORDER: ActivityType[] = ["visit", "tour", "meal", "event", "free", "transport"];

const TYPE_EMOJI: Record<ActivityType, string> = {
  visit: "👀",
  tour: "🚌",
  meal: "🍽️",
  event: "🎉",
  free: "🌿",
  transport: "✈️",
};

const TYPE_GRADIENT: Record<ActivityType, string> = {
  visit: "from-sky-400 to-blue-500",
  tour: "from-violet-400 to-purple-500",
  meal: "from-amber-300 to-orange-400",
  event: "from-rose-300 to-red-400",
  free: "from-emerald-300 to-green-400",
  transport: "from-slate-300 to-zinc-500",
};

export function ActivityForm({
  tripId,
  members,
  defaultDate,
  tripDestination = "Brasil",
  tripStartDate,
  tripEndDate,
}: {
  tripId: string;
  members: Profile[];
  defaultDate?: string;
  tripDestination?: string;
  tripStartDate?: string;
  tripEndDate?: string;
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
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-3xl bg-white shadow-2xl">
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
              tripDestination={tripDestination}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onSuccess={handleSuccess}
            />
          </div>
        </>
      )}
    </>
  );
}

function Wizard({
  tripId,
  defaultDate,
  tripDestination,
  tripStartDate,
  tripEndDate,
  onSuccess,
}: {
  tripId: string;
  defaultDate?: string;
  tripDestination: string;
  tripStartDate?: string;
  tripEndDate?: string;
  onSuccess: () => void;
}) {
  const router = useRouter();
  const { country: tripCountryName, code: tripCountryCode } = parseTripDestination(tripDestination);
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

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

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (formData: FormData) => {
    if (!formData.has("image_url")) {
      formData.set("image_url", imageUrl ?? "");
    }
    try {
      await createActivity(formData);
      router.refresh();
      onSuccess();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Error al crear");
    }
  };

  const searchSuggestions = async (query: string) => {
    if (query.trim().length < 3) return;
    setLoading(true);
    setSearchError(null);
    try {
      const data = await suggestPlace(query, tripCountryName || tripDestination);
      if (data.error) {
        setSearchError(data.error);
      } else if (data.suggestions?.length) {
        setSuggestions(data.suggestions);
        selectSuggestion(data.suggestions[0]);
      } else {
        setSearchError("No se encontraron lugares. Puedes continuar manualmente.");
      }
    } catch {
      setSearchError("Error al buscar. Puedes continuar manualmente.");
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

  const canContinue = () => {
    switch (step) {
      case 0:
        return title.trim().length >= 3;
      case 1:
        return location.trim().length > 0;
      case 2:
        return date.length > 0;
      case 3:
        return true;
      case 4:
        return true;
      case 5:
        return true;
      case 6:
        return true;
      case 7:
        return true;
      default:
        return false;
    }
  };

  const dateOptions = () => {
    if (!tripStartDate || !tripEndDate) return [];
    const start = new Date(tripStartDate);
    const end = new Date(tripEndDate);
    const options: string[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      options.push(new Date(d).toISOString().split("T")[0]);
    }
    return options;
  };

  const stepIndicator = (
    <div className="mb-5 px-5">
      <div className="flex items-center justify-between">
        {STEPS.map((s, i) => (
          <button
            key={s.key}
            type="button"
            onClick={() => i < step && setStep(i)}
            className="flex flex-1 flex-col items-center"
          >
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-semibold transition ${
                i < step
                  ? "bg-emerald-500 text-white"
                  : i === step
                    ? "bg-zinc-900 text-white ring-2 ring-zinc-200"
                    : "bg-zinc-100 text-zinc-400"
              }`}
            >
              {i < step ? (
                <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                i + 1
              )}
            </div>
            <span className={`mt-1 text-[9px] ${i <= step ? "font-medium text-zinc-700" : "text-zinc-300"}`}>
              {s.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="max-h-[78vh] overflow-y-auto px-5 pb-6 pt-1">
      {stepIndicator}

      {/* Paso 0: Nombre */}
      {step === 0 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">¿Qué quieres proponer?</h2>
            <p className="text-sm text-zinc-400">Escribe un nombre claro para el plan</p>
          </div>
          <input
            autoFocus
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej: Visita al Cristo Redentor"
            className="w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3.5 text-lg font-medium text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            onClick={next}
            disabled={!canContinue()}
            className="w-full rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40"
          >
            Continuar
          </button>
        </div>
      )}

      {/* Paso 1: Ubicación */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">¿Dónde es?</h2>
            <p className="text-sm text-zinc-400">Busca una sugerencia o escribe la ubicación</p>
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Escribe y busca sugerencias</label>
            <div className="flex gap-2">
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Título para buscar"
                className="flex-1"
              />
              <button
                type="button"
                onClick={() => searchSuggestions(title)}
                disabled={title.trim().length < 3 || loading}
                className="shrink-0 rounded-xl bg-emerald-500 px-3 text-sm font-semibold text-white transition hover:bg-emerald-600 disabled:opacity-40"
              >
                {loading ? "..." : "Buscar"}
              </button>
            </div>

            {searchError && (
              <p className="mt-2 text-xs text-amber-600">{searchError}</p>
            )}

            {suggestions.length > 0 && (
              <div className="mt-3 space-y-2">
                {suggestions.map((s) => (
                  <button
                    key={s.place_id}
                    type="button"
                    onClick={() => selectSuggestion(s)}
                    className={`flex w-full items-start gap-3 rounded-xl border p-2.5 text-left transition ${
                      selectedSuggestion?.place_id === s.place_id
                        ? "border-emerald-500 bg-emerald-50"
                        : "border-zinc-200 bg-white"
                    }`}
                  >
                    {s.photo_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={s.photo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-zinc-400">
                        📍
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-zinc-900">{s.name}</p>
                      <p className="truncate text-[10px] text-zinc-400">{s.address}</p>
                    </div>
                    {selectedSuggestion?.place_id === s.place_id && (
                      <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium text-zinc-500">O escribe manualmente</label>
            <LocationAutocomplete
              value={location}
              onChange={(name, newLat, newLng, photoUrl) => {
                setLocation(name);
                setSelectedSuggestion(null);
                setLat(newLat);
                setLng(newLng);
                if (photoUrl != null) setImageUrl(photoUrl);
              }}
              placeholder="Ej: Copacabana, Río de Janeiro"
              country={tripCountryCode}
            />
          </div>

          <div className="flex gap-2">
            <button onClick={prev} className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Atrás</button>
            <button onClick={next} disabled={!canContinue()} className="flex-1 rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40">Continuar</button>
          </div>
        </div>
      )}

      {/* Paso 2: Fecha */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">¿Qué día?</h2>
            <p className="text-sm text-zinc-400">Elige una fecha dentro del viaje</p>
          </div>

          {tripStartDate && tripEndDate ? (
            <div className="grid grid-cols-3 gap-2">
              {dateOptions().map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDate(d)}
                  className={`rounded-xl border p-2.5 text-center text-sm transition ${
                    date === d
                      ? "border-emerald-500 bg-emerald-50 font-semibold text-emerald-700"
                      : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300"
                  }`}
                >
                  <span className="block text-[10px] text-zinc-400 uppercase">
                    {new Date(d).toLocaleDateString("es", { weekday: "short" })}
                  </span>
                  <span className="block text-base">{new Date(d).getDate()}</span>
                </button>
              ))}
            </div>
          ) : (
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          )}

          <div className="flex gap-2">
            <button onClick={prev} className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Atrás</button>
            <button onClick={next} disabled={!canContinue()} className="flex-1 rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:opacity-40">Continuar</button>
          </div>
        </div>
      )}

      {/* Paso 3: Tipo */}
      {step === 3 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">¿Qué tipo de plan es?</h2>
            <p className="text-sm text-zinc-400">Selecciona una categoría</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {TYPE_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`flex items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                  type === t
                    ? `border-transparent bg-gradient-to-br ${TYPE_GRADIENT[t]} text-white`
                    : "border-zinc-100 bg-white text-zinc-700 hover:border-zinc-200"
                }`}
              >
                <span className="text-2xl">{TYPE_EMOJI[t]}</span>
                <div>
                  <p className="text-sm font-semibold">{ACTIVITY_TYPE_LABELS[t]}</p>
                  <p className="text-[10px] opacity-80">{t}</p>
                </div>
              </button>
            ))}
          </div>

          <div className="flex gap-2">
            <button onClick={prev} className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Atrás</button>
            <button onClick={next} className="flex-1 rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Continuar</button>
          </div>
        </div>
      )}

      {/* Paso 4: Horario */}
      {step === 4 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">¿A qué hora?</h2>
            <p className="text-sm text-zinc-400">Opcional, pero ayuda a organizar el día</p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Inicio</label>
              <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
            </div>
            <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
              <label className="mb-1.5 block text-xs font-medium text-zinc-500">Fin</label>
              <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={prev} className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Atrás</button>
            <button onClick={next} className="flex-1 rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Continuar</button>
          </div>
        </div>
      )}

      {/* Paso 5: Coste */}
      {step === 5 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">¿Coste aproximado?</h2>
            <p className="text-sm text-zinc-400">Puedes dejarlo en 0 si es gratis</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-xl border py-2.5 text-sm font-semibold transition ${
                  currency === c
                    ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                    : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-300"
                }`}
              >
                {c}
              </button>
            ))}
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Monto</label>
            <TextInput
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="flex gap-2">
            <button onClick={prev} className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Atrás</button>
            <button onClick={next} className="flex-1 rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Continuar</button>
          </div>
        </div>
      )}

      {/* Paso 6: Detalles e imagen */}
      {step === 6 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">Notas e imagen</h2>
            <p className="text-sm text-zinc-400">Añade contexto o una foto personalizada</p>
          </div>

          {imageUrl && (
            <div className="overflow-hidden rounded-2xl">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-40 w-full object-cover" />
            </div>
          )}

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            <ImageUpload imageUrl={imageUrl} onUploaded={(url) => setImageUrl(url)} />
          </div>

          <div className="rounded-2xl border border-zinc-100 bg-zinc-50 p-3">
            <label className="mb-1.5 block text-xs font-medium text-zinc-500">Notas</label>
            <TextArea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reservas, recomendaciones, recordatorios..."
            />
          </div>

          <div className="flex gap-2">
            <button onClick={prev} className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50">Atrás</button>
            <button onClick={next} className="flex-1 rounded-2xl bg-zinc-900 py-3.5 text-sm font-semibold text-white transition hover:bg-zinc-800">Revisar</button>
          </div>
        </div>
      )}

      {/* Paso 7: Revisar */}
      {step === 7 && (
        <div className="space-y-4">
          <div>
            <h2 className="text-xl font-bold text-zinc-900">¿Todo listo?</h2>
            <p className="text-sm text-zinc-400">Revisa antes de guardar</p>
          </div>

          <div className="overflow-hidden rounded-2xl border border-zinc-100 bg-white shadow-sm">
            {imageUrl && (
              <div className="h-40 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <h3 className="text-lg font-bold text-zinc-900">{title}</h3>
              <p className="text-sm text-zinc-500">{location}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                <span className={`rounded-lg bg-gradient-to-br ${TYPE_GRADIENT[type]} px-2 py-1 font-medium text-white`}>
                  {ACTIVITY_TYPE_LABELS[type]}
                </span>
                {date && <span className="rounded-lg bg-zinc-100 px-2 py-1 text-zinc-600">{date}</span>}
                {startTime && (
                  <span className="rounded-lg bg-zinc-100 px-2 py-1 text-zinc-600">
                    {startTime}{endTime && ` - ${endTime}`}
                  </span>
                )}
                {cost && Number(cost) > 0 && (
                  <span className="rounded-lg bg-emerald-50 px-2 py-1 font-medium text-emerald-700">
                    {cost} {currency}
                  </span>
                )}
              </div>
              {notes && <p className="mt-2 text-sm text-zinc-500">{notes}</p>}
            </div>
          </div>

          {formError && (
            <p className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{formError}</p>
          )}

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
                className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
              >
                Atrás
              </button>
              <SubmitButton className="flex-1 rounded-2xl">
                Crear actividad
              </SubmitButton>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
