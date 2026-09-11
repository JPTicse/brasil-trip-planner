"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createActivity } from "@/lib/actions";
import { suggestPlace, type Suggestion } from "@/lib/suggest";
import { TextInput, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { ImageUpload } from "@/components/image-upload";
import { LocationAutocomplete } from "@/components/location-autocomplete";
import { POPULAR_COUNTRIES } from "@/components/country-select";
import { ACTIVITY_TYPE_LABELS, CURRENCIES, type ActivityType } from "@/lib/types";

function parseTripDestination(destination?: string) {
  const [city = "", country = ""] = (destination ?? "").split(",").map((s) => s.trim());
  const code =
    POPULAR_COUNTRIES.find((c) => c.name.toLowerCase() === country.toLowerCase())?.code ??
    country;
  return { city, country, code };
}

const STEPS = ["Plan", "Lugar", "Día", "Tipo", "Hora", "Costo", "Extras", "Listo"];

const TYPE_ORDER: ActivityType[] = ["visit", "tour", "meal", "event", "free", "transport"];

const TYPE_CARD: Record<ActivityType, { emoji: string; title: string; desc: string; bg: string }> = {
  visit: { emoji: "👀", title: "Visita", desc: "Lugar para ver", bg: "bg-blue-600" },
  tour: { emoji: "🚌", title: "Tour", desc: "Recorrido guiado", bg: "bg-violet-600" },
  meal: { emoji: "🍽️", title: "Comida", desc: "Restaurante o bar", bg: "bg-orange-600" },
  event: { emoji: "🎉", title: "Evento", desc: "Fiesta o show", bg: "bg-rose-600" },
  free: { emoji: "🌿", title: "Gratis", desc: "Parque o playa", bg: "bg-emerald-600" },
  transport: { emoji: "✈️", title: "Transporte", desc: "Vuelo, bus o taxi", bg: "bg-zinc-700" },
};

export function NewActivityWizard({
  tripId,
  tripDestination,
  tripStartDate,
  tripEndDate,
  defaultDate,
  onClose,
}: {
  tripId: string;
  tripDestination: string;
  tripStartDate?: string;
  tripEndDate?: string;
  defaultDate?: string;
  onClose: () => void;
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

  // Buscar sugerencias automáticamente al escribir título
  useEffect(() => {
    const t = setTimeout(() => {
      if (title.trim().length >= 3) {
        searchSuggestions(title);
      } else {
        setSuggestions([]);
        setSearchError(null);
      }
    }, 500);
    return () => clearTimeout(t);
  }, [title]);

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (formData: FormData) => {
    if (!formData.has("image_url")) {
      formData.set("image_url", imageUrl ?? "");
    }
    const currentImage = formData.get("image_url") as string;
    if (!currentImage && lat != null && lng != null) {
      const key = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (key) {
        const mapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${lat},${lng}&zoom=15&size=400x300&maptype=roadmap&markers=color:red%7C${lat},${lng}&key=${key}`;
        formData.set("image_url", mapUrl);
      }
    }
    try {
      await createActivity(formData);
      router.refresh();
      onClose();
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

  const isStepValid = () => {
    switch (step) {
      case 0:
        return title.trim().length >= 3;
      case 1:
        return location.trim().length > 0;
      case 2:
        return date.length > 0;
      default:
        return true;
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

  const progress = ((step + 1) / STEPS.length) * 100;

  const stepProps = { step, total: STEPS.length, prev, next, isStepValid: isStepValid() };

  return (
    <div className="relative px-5">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white pb-2 pt-1 dark:bg-zinc-900">
        <div className="flex items-center justify-between">
          <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Nuevo plan</p>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
        <div className="mt-2 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step 0: Nombre */}
      {step === 0 && (
        <Step {...stepProps} title="¿Qué propones?" subtitle="Un nombre claro para el plan">
          <div className="flex flex-col items-center gap-4 py-6">
            <div className="text-5xl">📝</div>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Visita al Cristo Redentor"
              className="w-full rounded-3xl border-2 border-zinc-200 bg-zinc-50 px-4 py-3.5 text-center text-lg font-semibold text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-400 focus:bg-white focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-600 dark:focus:bg-zinc-800"
            />
          </div>
        </Step>
      )}

      {/* Step 1: Ubicación */}
      {step === 1 && (
        <Step {...stepProps} title="¿Dónde queda?" subtitle="Busca o escribe la ubicación">
          <div className="space-y-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-2 text-xs font-bold uppercase text-zinc-400">Sugerencias automáticas</p>
              <TextInput
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Escribe el nombre para buscar"
                className="w-full rounded-xl"
              />
              {loading && <p className="mt-2 text-xs text-zinc-400">Buscando...</p>}
              {searchError && <p className="mt-2 text-xs text-amber-600">{searchError}</p>}
              {suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.place_id}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                        selectedSuggestion?.place_id === s.place_id
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800"
                      }`}
                    >
                      {s.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photo_url} alt="" className="h-12 w-12 rounded-lg object-cover" />
                      ) : (
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-zinc-100 text-xl">📍</div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-zinc-900">{s.name}</p>
                        <p className="truncate text-xs text-zinc-400">{s.address}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-2 text-xs font-bold uppercase text-zinc-400">O escribe manual</p>
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
          </div>
        </Step>
      )}

      {/* Step 2: Fecha */}
      {step === 2 && (
        <Step {...stepProps} title="¿Qué día?" subtitle="Dentro del viaje">
          {tripStartDate && tripEndDate ? (
            <div className="grid grid-cols-3 gap-2">
              {dateOptions().map((d) => {
                const isSelected = date === d;
                const day = new Date(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className={`flex flex-col items-center rounded-2xl border-2 p-3 transition active:scale-95 ${
                      isSelected
                        ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase opacity-80">
                      {day.toLocaleDateString("es", { weekday: "short" })}
                    </span>
                    <span className="text-xl font-extrabold">{day.getDate()}</span>
                    <span className="text-[10px] opacity-80">
                      {day.toLocaleDateString("es", { month: "short" })}
                    </span>
                  </button>
                );
              })}
            </div>
          ) : (
            <TextInput type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          )}
        </Step>
      )}

      {/* Step 3: Tipo */}
      {step === 3 && (
        <Step {...stepProps} title="¿Qué tipo?" subtitle="Elige una categoría">
          <div className="grid grid-cols-2 gap-3">
            {TYPE_ORDER.map((t) => {
              const card = TYPE_CARD[t];
              const isSelected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-3xl border-2 p-4 text-left transition active:scale-95 ${
                    isSelected
                      ? `${card.bg} border-transparent text-white shadow-lg`
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                  }`}
                >
                  <div className="text-3xl">{card.emoji}</div>
                  <p className="mt-2 text-base font-extrabold">{card.title}</p>
                  <p className={`text-[10px] ${isSelected ? "text-white/80" : "text-zinc-400"}`}>{card.desc}</p>
                </button>
              );
            })}
          </div>
        </Step>
      )}

      {/* Step 4: Horario */}
      {step === 4 && (
        <Step {...stepProps} title="¿A qué hora?" subtitle="Opcional">
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-2 text-center text-xs font-bold uppercase text-zinc-400">Inicio</p>
              <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border-0 bg-transparent text-center text-xl font-bold" />
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
              <p className="mb-2 text-center text-xs font-bold uppercase text-zinc-400">Fin</p>
              <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border-0 bg-transparent text-center text-xl font-bold" />
            </div>
          </div>
        </Step>
      )}

      {/* Step 5: Costo */}
      {step === 5 && (
        <Step {...stepProps} title="¿Costo aprox?" subtitle="Déjalo en 0 si es gratis">
          <div className="grid grid-cols-3 gap-2">
            {CURRENCIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className={`rounded-2xl border-2 py-3 text-sm font-extrabold transition active:scale-95 ${
                  currency === c
                    ? "border-emerald-500 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-2 text-center text-xs font-bold uppercase text-zinc-400">Monto</p>
            <TextInput
              type="number"
              step="0.01"
              value={cost}
              onChange={(e) => setCost(e.target.value)}
              placeholder="0.00"
              className="border-0 bg-transparent text-center text-2xl font-extrabold"
            />
          </div>
        </Step>
      )}

      {/* Step 6: Detalles */}
      {step === 6 && (
        <Step {...stepProps} title="¿Algo más?" subtitle="Notas e imagen" nextLabel="Revisar">
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-2 text-xs font-bold uppercase text-zinc-400 dark:text-zinc-500">Imagen</p>
            <ImageUpload imageUrl={imageUrl} onUploaded={(url) => setImageUrl(url)} />
          </div>
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-800">
            <p className="mb-2 text-xs font-bold uppercase text-zinc-400">Notas</p>
            <TextArea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Reservas, recomendaciones..."
              className="border-0 bg-transparent"
            />
          </div>
        </Step>
      )}

      {/* Step 7: Revisar */}
      {step === 7 && (
        <Step {...stepProps} title="¿Todo listo?" subtitle="Revisa antes de guardar" hideNext>
          <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white dark:border-zinc-700 dark:bg-zinc-800 shadow-sm">
            {imageUrl && (
              <div className="h-40 w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="p-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{TYPE_CARD[type].emoji}</span>
                <h3 className="text-lg font-extrabold text-zinc-900">{title}</h3>
              </div>
              <p className="mt-1 text-sm text-zinc-500">{location}</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {date && (
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600">
                    {new Date(date).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })}
                  </span>
                )}
                {startTime && (
                  <span className="rounded-lg bg-zinc-100 px-2.5 py-1 text-[11px] font-bold text-zinc-600">
                    {startTime}{endTime && ` - ${endTime}`}
                  </span>
                )}
                {cost && Number(cost) > 0 && (
                  <span className="rounded-lg bg-emerald-100 px-2.5 py-1 text-[11px] font-bold text-emerald-700">
                    {cost} {currency}
                  </span>
                )}
              </div>
              {notes && <p className="mt-2 text-sm text-zinc-500">{notes}</p>}
            </div>
          </div>

          {formError && <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</p>}

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

            <div className="space-y-3">
              <SubmitButton className="w-full rounded-2xl py-3.5 text-base shadow-lg shadow-emerald-500/20">
                Crear plan
              </SubmitButton>
              <button
                type="button"
                onClick={prev}
                className="w-full rounded-2xl border border-zinc-200 py-3.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50"
              >
                Atrás
              </button>
            </div>
          </form>
        </Step>
      )}
    </div>
  );
}

function Step({
  step,
  total,
  prev,
  next,
  isStepValid,
  title: stepTitle,
  subtitle,
  children,
  hideNext,
  nextLabel,
}: {
  step: number;
  total: number;
  prev: () => void;
  next: () => void;
  isStepValid: boolean;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  hideNext?: boolean;
  nextLabel?: string;
}) {
  return (
    <div className="space-y-4 pb-24 pt-2">
      <div className="text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 dark:text-emerald-400">
          Paso {step + 1} de {total}
        </p>
        <h2 className="mt-1 text-xl font-extrabold text-zinc-900 dark:text-zinc-100">{stepTitle}</h2>
        <p className="text-sm text-zinc-400 dark:text-zinc-500">{subtitle}</p>
      </div>

      {children}

      {!hideNext && (
        <div className="flex gap-2 pt-2">
          {step > 0 && (
            <button
              type="button"
              onClick={prev}
              className="rounded-2xl border border-zinc-200 px-5 py-3.5 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Atrás
            </button>
          )}
          <button
            type="button"
            onClick={next}
            disabled={!isStepValid}
            className="flex-1 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 disabled:opacity-40"
          >
            {nextLabel ?? "Continuar"}
          </button>
        </div>
      )}
    </div>
  );
}
