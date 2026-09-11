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

const STEPS = ["Plan", "Lugar", "Día", "Tipo", "Hora", "Costo", "Extras", "Listo"];

const TYPE_ORDER: ActivityType[] = ["visit", "tour", "meal", "event", "free", "transport"];

const TYPE_CARD: Record<ActivityType, { emoji: string; title: string; desc: string; gradient: string; text: string }> = {
  visit: {
    emoji: "👀",
    title: "Visita",
    desc: "Un lugar para ver o explorar",
    gradient: "from-sky-400 to-blue-600",
    text: "text-white",
  },
  tour: {
    emoji: "🚌",
    title: "Tour",
    desc: "Recorrido guiado o experiencia",
    gradient: "from-violet-400 to-purple-600",
    text: "text-white",
  },
  meal: {
    emoji: "🍽️",
    title: "Comida",
    desc: "Restaurante, café o bar",
    gradient: "from-amber-300 to-orange-500",
    text: "text-white",
  },
  event: {
    emoji: "🎉",
    title: "Evento",
    desc: "Fiesta, show o encuentro",
    gradient: "from-rose-300 to-red-500",
    text: "text-white",
  },
  free: {
    emoji: "🌿",
    title: "Gratis",
    desc: "Playa, parque o actividad sin costo",
    gradient: "from-emerald-300 to-green-600",
    text: "text-white",
  },
  transport: {
    emoji: "✈️",
    title: "Transporte",
    desc: "Vuelo, bus, taxi o traslado",
    gradient: "from-slate-300 to-zinc-600",
    text: "text-white",
  },
};

const TYPE_ICON: Record<ActivityType, string> = {
  visit: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 5 8.268 7.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
  tour: "M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M18.001 17H19.4a.6.6 0 00.6-.6V16M12 3v12m0 0a2 2 0 104 0 2 2 0 00-4 0",
  meal: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 002-2V2M7 2v20M21 15V2a5 5 0 00-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  event: "M12 2l2.5 5 5.5.8-4 4 1 5.5L12 15l-5 2.5 1-5.5-4-4 5.5-.8L12 2z",
  free: "M5 3v18M5 3l10 9-10 9",
  transport: "M4 16l2-6h12l2 6M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M4 16h16M18 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3",
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
            className="fixed inset-0 z-50 bg-zinc-900/40 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex h-[92vh] max-w-md flex-col rounded-t-3xl bg-white shadow-2xl">
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
  const [direction, setDirection] = useState(1);
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

  const next = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };
  const prev = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

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

  const slideClass = direction > 0 ? "animate-slide-in-right" : "animate-slide-in-left";

  const StepLayout = ({
    title: stepTitle,
    subtitle,
    children,
    showNext = true,
    onNext,
    nextLabel = "Continuar",
  }: {
    title: string;
    subtitle: string;
    children: React.ReactNode;
    showNext?: boolean;
    onNext?: () => void;
    nextLabel?: string;
  }) => (
    <div className={`flex h-full flex-col ${slideClass}`}>
      <div className="shrink-0 pt-3 pb-2 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
          Paso {step + 1} de {STEPS.length}
        </p>
      </div>

      <div className="mx-5 mb-4 h-2 overflow-hidden rounded-full bg-zinc-100">
        <div
          className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto px-5 pb-24 pt-2">
        <div className="mb-6">
          <h2 className="text-2xl font-extrabold leading-tight text-zinc-900">{stepTitle}</h2>
          <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        </div>

        {children}
      </div>

      {showNext && (
        <div className="absolute bottom-0 left-0 right-0 border-t border-zinc-100 bg-white/95 p-4 backdrop-blur-md">
          <button
            type="button"
            onClick={onNext ?? next}
            disabled={!isStepValid()}
            className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-40"
          >
            {nextLabel}
          </button>
        </div>
      )}
    </div>
  );

  return (
    <>
      <style jsx global>{`
        @keyframes slide-in-right {
          from { opacity: 0; transform: translateX(30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes slide-in-left {
          from { opacity: 0; transform: translateX(-30px); }
          to { opacity: 1; transform: translateX(0); }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out;
        }
        .animate-slide-in-left {
          animation: slide-in-left 0.3s ease-out;
        }
      `}</style>

      {/* Paso 0: Nombre */}
      {step === 0 && (
        <StepLayout
          title="¿Qué quieres proponer?"
          subtitle="Dale un nombre que todos entiendan"
          onNext={next}
        >
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <div className="text-6xl">📝</div>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Visita al Cristo Redentor"
              className="w-full rounded-3xl border-2 border-zinc-100 bg-zinc-50 px-5 py-4 text-center text-xl font-semibold text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
          </div>
        </StepLayout>
      )}

      {/* Paso 1: Ubicación */}
      {step === 1 && (
        <StepLayout
          title="¿Dónde queda?"
          subtitle="Busca una sugerencia o escribe la ubicación"
          onNext={next}
        >
          <div className="space-y-4">
            <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-3">
              <p className="mb-2 text-xs font-bold uppercase text-zinc-400">Sugerencias automáticas</p>
              <div className="flex gap-2">
                <TextInput
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Buscar con el nombre del plan"
                  className="flex-1 rounded-xl border-zinc-200"
                />
                <button
                  type="button"
                  onClick={() => searchSuggestions(title)}
                  disabled={title.trim().length < 3 || loading}
                  className="shrink-0 rounded-xl bg-emerald-500 px-4 text-sm font-bold text-white transition hover:bg-emerald-600 disabled:opacity-40"
                >
                  {loading ? "..." : "Buscar"}
                </button>
              </div>

              {searchError && <p className="mt-2 text-xs text-amber-600">{searchError}</p>}

              {suggestions.length > 0 && (
                <div className="mt-3 space-y-2">
                  {suggestions.map((s) => (
                    <button
                      key={s.place_id}
                      type="button"
                      onClick={() => selectSuggestion(s)}
                      className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition ${
                        selectedSuggestion?.place_id === s.place_id
                          ? "border-emerald-400 bg-emerald-50"
                          : "border-zinc-100 bg-white"
                      }`}
                    >
                      {s.photo_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={s.photo_url} alt="" className="h-14 w-14 rounded-xl object-cover" />
                      ) : (
                        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-2xl">
                          📍
                        </div>
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

            <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-3">
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
        </StepLayout>
      )}

      {/* Paso 2: Fecha */}
      {step === 2 && (
        <StepLayout
          title="¿Qué día?"
          subtitle="Elige una fecha dentro del viaje"
          onNext={next}
        >
          {tripStartDate && tripEndDate ? (
            <div className="grid grid-cols-3 gap-3">
              {dateOptions().map((d) => {
                const isSelected = date === d;
                const day = new Date(d);
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDate(d)}
                    className={`flex flex-col items-center justify-center rounded-2xl border-2 p-4 text-center transition active:scale-95 ${
                      isSelected
                        ? "border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                        : "border-zinc-100 bg-white text-zinc-700 hover:border-zinc-200"
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase opacity-80">
                      {day.toLocaleDateString("es", { weekday: "short" })}
                    </span>
                    <span className="mt-1 text-2xl font-extrabold">{day.getDate()}</span>
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
        </StepLayout>
      )}

      {/* Paso 3: Tipo */}
      {step === 3 && (
        <StepLayout
          title="¿Qué tipo de plan?"
          subtitle="Elige la categoría que mejor encaje"
          onNext={next}
        >
          <div className="grid grid-cols-2 gap-3">
            {TYPE_ORDER.map((t) => {
              const card = TYPE_CARD[t];
              const isSelected = type === t;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`relative overflow-hidden rounded-3xl border-2 p-4 text-left transition active:scale-95 ${
                    isSelected
                      ? `border-transparent bg-gradient-to-br ${card.gradient} ${card.text} shadow-lg`
                      : "border-zinc-100 bg-white text-zinc-700 hover:border-zinc-200"
                  }`}
                >
                  <div className="text-4xl">{card.emoji}</div>
                  <p className="mt-2 text-lg font-extrabold">{card.title}</p>
                  <p className={`text-xs ${isSelected ? "text-white/80" : "text-zinc-400"}`}>
                    {card.desc}
                  </p>
                </button>
              );
            })}
          </div>
        </StepLayout>
      )}

      {/* Paso 4: Horario */}
      {step === 4 && (
        <StepLayout
          title="¿A qué hora?"
          subtitle="Opcional, pero ayuda a organizar"
          onNext={next}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="text-6xl">⏰</div>
            <div className="grid w-full grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
                <p className="mb-2 text-center text-xs font-bold uppercase text-zinc-400">Inicio</p>
                <TextInput
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="border-0 bg-transparent text-center text-2xl font-bold"
                />
              </div>
              <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
                <p className="mb-2 text-center text-xs font-bold uppercase text-zinc-400">Fin</p>
                <TextInput
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="border-0 bg-transparent text-center text-2xl font-bold"
                />
              </div>
            </div>
          </div>
        </StepLayout>
      )}

      {/* Paso 5: Coste */}
      {step === 5 && (
        <StepLayout
          title="¿Coste aproximado?"
          subtitle="Puedes dejarlo en 0 si es gratis"
          onNext={next}
        >
          <div className="flex flex-col items-center gap-6">
            <div className="text-6xl">💰</div>
            <div className="grid w-full grid-cols-3 gap-3">
              {CURRENCIES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCurrency(c)}
                  className={`rounded-2xl border-2 py-3 text-sm font-extrabold transition active:scale-95 ${
                    currency === c
                      ? "border-emerald-400 bg-emerald-500 text-white shadow-lg shadow-emerald-500/20"
                      : "border-zinc-100 bg-white text-zinc-600 hover:border-zinc-200"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
              <p className="mb-2 text-center text-xs font-bold uppercase text-zinc-400">Monto</p>
              <TextInput
                type="number"
                step="0.01"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="0.00"
                className="border-0 bg-transparent text-center text-3xl font-extrabold"
              />
            </div>
          </div>
        </StepLayout>
      )}

      {/* Paso 6: Detalles e imagen */}
      {step === 6 && (
        <StepLayout
          title="¿Algo más?"
          subtitle="Notas e imagen del plan"
          onNext={next}
          nextLabel="Revisar"
        >
          <div className="space-y-4">
            {imageUrl && (
              <div className="overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-48 w-full object-cover" />
              </div>
            )}

            <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
              <ImageUpload imageUrl={imageUrl} onUploaded={(url) => setImageUrl(url)} />
            </div>

            <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
              <p className="mb-2 text-xs font-bold uppercase text-zinc-400">Notas</p>
              <TextArea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reservas, recomendaciones, recordatorios..."
                className="border-0 bg-transparent"
              />
            </div>
          </div>
        </StepLayout>
      )}

      {/* Paso 7: Revisar */}
      {step === 7 && (
        <StepLayout
          title="¿Todo listo?"
          subtitle="Revisa tu plan antes de guardar"
          showNext={false}
        >
          <div className="space-y-4">
            <div className="overflow-hidden rounded-3xl border-2 border-zinc-100 bg-white shadow-sm">
              {imageUrl && (
                <div className="h-48 w-full overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imageUrl} alt={title} className="h-full w-full object-cover" />
                </div>
              )}
              <div className="p-5">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{TYPE_CARD[type].emoji}</span>
                  <h3 className="text-xl font-extrabold text-zinc-900">{title}</h3>
                </div>
                <p className="mt-1 text-sm text-zinc-500">{location}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {date && (
                    <span className="rounded-xl bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                      {new Date(date).toLocaleDateString("es", { weekday: "short", day: "numeric", month: "short" })}
                    </span>
                  )}
                  {startTime && (
                    <span className="rounded-xl bg-zinc-100 px-3 py-1 text-xs font-bold text-zinc-600">
                      {startTime}{endTime && ` - ${endTime}`}
                    </span>
                  )}
                  {cost && Number(cost) > 0 && (
                    <span className="rounded-xl bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                      {cost} {currency}
                    </span>
                  )}
                </div>
                {notes && <p className="mt-3 text-sm text-zinc-500">{notes}</p>}
              </div>
            </div>

            {formError && (
              <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</p>
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

              <div className="flex flex-col gap-3">
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-2xl border-2 border-zinc-100 py-3.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50"
                >
                  Atrás
                </button>
                <SubmitButton className="w-full rounded-2xl py-4 text-base shadow-lg shadow-emerald-500/20">
                  Crear plan 🚀
                </SubmitButton>
              </div>
            </form>
          </div>
        </StepLayout>
      )}

      {/* Botón atrás flotante arriba */}
      {step > 0 && (
        <button
          type="button"
          onClick={prev}
          className="absolute left-5 top-5 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      )}
    </>
  );
}
