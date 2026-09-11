"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
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

const TYPE_CARD: Record<ActivityType, { emoji: string; title: string; desc: string; gradient: string }> = {
  visit: { emoji: "👀", title: "Visita", desc: "Lugar para ver o explorar", gradient: "from-sky-400 to-blue-600" },
  tour: { emoji: "🚌", title: "Tour", desc: "Recorrido guiado", gradient: "from-violet-400 to-purple-600" },
  meal: { emoji: "🍽️", title: "Comida", desc: "Restaurante o bar", gradient: "from-amber-300 to-orange-500" },
  event: { emoji: "🎉", title: "Evento", desc: "Fiesta, show o encuentro", gradient: "from-rose-300 to-red-500" },
  free: { emoji: "🌿", title: "Gratis", desc: "Playa, parque o similar", gradient: "from-emerald-300 to-green-600" },
  transport: { emoji: "✈️", title: "Transporte", desc: "Vuelo, bus o traslado", gradient: "from-slate-300 to-zinc-600" },
};

export function NewActivityWizard({
  tripId,
  tripDestination,
  tripStartDate,
  tripEndDate,
  defaultDate,
}: {
  tripId: string;
  tripDestination: string;
  tripStartDate?: string;
  tripEndDate?: string;
  defaultDate?: string;
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
      router.push(`/trips/${tripId}/itinerary`);
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

  const StepWrap = ({ children, className = "" }: { children: React.ReactNode; className?: string }) => (
    <div
      className={`flex h-full flex-col px-5 pb-28 pt-3 transition-all duration-300 ease-out ${className}`}
      style={{ animation: direction > 0 ? "slideInRight 0.25s ease" : "slideInLeft 0.25s ease" }}
    >
      {children}
    </div>
  );

  const StepHeader = ({ title: stepTitle, subtitle }: { title: string; subtitle: string }) => (
    <div className="mb-5 text-center">
      <p className="text-[10px] font-bold uppercase tracking-widest text-emerald-600">
        Paso {step + 1} de {STEPS.length}
      </p>
      <h2 className="mt-1 text-2xl font-extrabold leading-tight text-zinc-900">{stepTitle}</h2>
      <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
    </div>
  );

  const BottomCta = ({ onClick, label = "Continuar" }: { onClick?: () => void; label?: string }) => (
    <div className="fixed bottom-0 left-0 right-0 z-20 border-t border-zinc-100 bg-white/95 p-4 backdrop-blur-md">
      <button
        type="button"
        onClick={onClick ?? next}
        disabled={!isStepValid()}
        className="w-full rounded-2xl bg-emerald-500 py-4 text-base font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-[0.98] disabled:opacity-40"
      >
        {label}
      </button>
    </div>
  );

  return (
    <div className="relative flex h-dvh flex-col overflow-hidden bg-white">
      {/* Top bar */}
      <div className="shrink-0 pt-4 pb-2">
        <div className="mx-auto flex max-w-md items-center justify-between px-5">
          <Link
            href={`/trips/${tripId}/itinerary`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 transition hover:bg-zinc-200"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </Link>
          <span className="text-sm font-bold text-zinc-900">Nuevo plan</span>
          <div className="h-10 w-10" />
        </div>
        <div className="mx-5 mt-2 h-2 overflow-hidden rounded-full bg-zinc-100">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 overflow-y-auto">
        {step === 0 && (
          <StepWrap className="items-center justify-center">
            <StepHeader title="¿Qué plan propones?" subtitle="Un nombre que todos entiendan" />
            <div className="text-7xl">📝</div>
            <input
              autoFocus
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ej: Visita al Cristo Redentor"
              className="mt-6 w-full max-w-xs rounded-3xl border-2 border-zinc-100 bg-zinc-50 px-5 py-4 text-center text-xl font-semibold text-zinc-900 placeholder:text-zinc-300 focus:border-emerald-400 focus:bg-white focus:outline-none"
            />
            <BottomCta />
          </StepWrap>
        )}

        {step === 1 && (
          <StepWrap>
            <StepHeader title="¿Dónde queda?" subtitle="Busca o escribe la ubicación" />
            <div className="space-y-3">
              <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-3">
                <p className="mb-2 text-xs font-bold uppercase text-zinc-400">Sugerencias</p>
                <div className="flex gap-2">
                  <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Buscar con el nombre" className="flex-1 rounded-xl border-zinc-200" />
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
                          <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-zinc-100 text-2xl">📍</div>
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
            <BottomCta />
          </StepWrap>
        )}

        {step === 2 && (
          <StepWrap>
            <StepHeader title="¿Qué día?" subtitle="Dentro de las fechas del viaje" />
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
            <BottomCta />
          </StepWrap>
        )}

        {step === 3 && (
          <StepWrap>
            <StepHeader title="¿Qué tipo de plan?" subtitle="Elige una categoría" />
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
                        ? `border-transparent bg-gradient-to-br ${card.gradient} text-white shadow-lg`
                        : "border-zinc-100 bg-white text-zinc-700 hover:border-zinc-200"
                    }`}
                  >
                    <div className="text-4xl">{card.emoji}</div>
                    <p className="mt-2 text-lg font-extrabold">{card.title}</p>
                    <p className={`text-xs ${isSelected ? "text-white/80" : "text-zinc-400"}`}>{card.desc}</p>
                  </button>
                );
              })}
            </div>
            <BottomCta />
          </StepWrap>
        )}

        {step === 4 && (
          <StepWrap className="items-center justify-center">
            <StepHeader title="¿A qué hora?" subtitle="Opcional, para organizar el día" />
            <div className="text-6xl">⏰</div>
            <div className="mt-6 grid w-full max-w-xs grid-cols-2 gap-4">
              <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
                <p className="mb-2 text-center text-xs font-bold uppercase text-zinc-400">Inicio</p>
                <TextInput type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="border-0 bg-transparent text-center text-2xl font-bold" />
              </div>
              <div className="rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
                <p className="mb-2 text-center text-xs font-bold uppercase text-zinc-400">Fin</p>
                <TextInput type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="border-0 bg-transparent text-center text-2xl font-bold" />
              </div>
            </div>
            <BottomCta />
          </StepWrap>
        )}

        {step === 5 && (
          <StepWrap className="items-center justify-center">
            <StepHeader title="¿Costo aproximado?" subtitle="Déjalo en 0 si es gratis" />
            <div className="text-6xl">💰</div>
            <div className="mt-6 grid w-full max-w-xs grid-cols-3 gap-3">
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
            <div className="mt-4 w-full max-w-xs rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
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
            <BottomCta />
          </StepWrap>
        )}

        {step === 6 && (
          <StepWrap>
            <StepHeader title="¿Algo más?" subtitle="Notas e imagen del plan" />
            {imageUrl && (
              <div className="overflow-hidden rounded-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="" className="h-48 w-full object-cover" />
              </div>
            )}
            <div className="mt-3 rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
              <ImageUpload imageUrl={imageUrl} onUploaded={(url) => setImageUrl(url)} />
            </div>
            <div className="mt-3 rounded-2xl border-2 border-zinc-100 bg-zinc-50 p-4">
              <p className="mb-2 text-xs font-bold uppercase text-zinc-400">Notas</p>
              <TextArea
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Reservas, recomendaciones..."
                className="border-0 bg-transparent"
              />
            </div>
            <BottomCta label="Revisar" />
          </StepWrap>
        )}

        {step === 7 && (
          <StepWrap>
            <StepHeader title="¿Todo listo?" subtitle="Revisa antes de guardar" />
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

            {formError && <p className="mt-3 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-600">{formError}</p>}

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

              <div className="mt-4 space-y-3">
                <button
                  type="button"
                  onClick={prev}
                  className="w-full rounded-2xl border-2 border-zinc-100 py-3.5 text-sm font-bold text-zinc-600 transition hover:bg-zinc-50"
                >
                  Atrás
                </button>
                <SubmitButton className="w-full rounded-2xl py-4 text-base shadow-lg shadow-emerald-500/20">
                  Crear plan 🚀
                </SubmitButton>
              </div>
            </form>
          </StepWrap>
        )}
      </div>

      <style>{`
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes slideInLeft { from { opacity: 0; transform: translateX(-30px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  );
}
