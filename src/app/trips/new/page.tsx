"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTrip } from "@/lib/actions";
import { Field, TextInput, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CountrySelect, POPULAR_COUNTRIES, type Country } from "@/components/country-select";
import { CityAutocomplete } from "@/components/city-autocomplete";

const STEPS = ["Destino", "Fechas", "Detalles"] as const;

function getCountryName(code: string | null) {
  return POPULAR_COUNTRIES.find((c) => c.code === code)?.name ?? code;
}

export default function NewTripPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(null);
  const [city, setCity] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");

  const next = () => setStep((s) => Math.min(s + 1, STEPS.length - 1));
  const prev = () => setStep((s) => Math.max(s - 1, 0));

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    try {
      await createTrip(formData);
      router.refresh();
    } catch (e) {
      setPending(false);
      setError(e instanceof Error ? e.message : "Error al crear");
    }
  };

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center gap-3 px-4 py-3">
          <Link
            href="/trips"
            className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
          >
            <BackIcon />
          </Link>
          <h1 className="text-lg font-bold text-zinc-900">Nuevo viaje</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-6">
        {/* Indicador de pasos */}
        <div className="mb-6 flex items-center justify-between">
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

        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="name" value={name} />
          <input type="hidden" name="country" value={selectedCountry?.code ?? ""} />
          <input type="hidden" name="city" value={city} />
          <input type="hidden" name="start_date" value={startDate} />
          <input type="hidden" name="end_date" value={endDate} />
          <input type="hidden" name="description" value={description} />

          {/* Paso 0: Destino */}
          {step === 0 && (
            <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-zinc-900">¿A dónde vas?</h2>
                <p className="text-xs text-zinc-500">Selecciona el país y la ciudad de tu viaje</p>
              </div>

              <Field label="Nombre del viaje *">
                <TextInput
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej: Aventura Brasil 2026 🇧🇷"
                  required
                />
              </Field>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">País *</label>
                <CountrySelect
                  selected={selectedCountry?.code ?? null}
                  onSelect={(c) => {
                    setSelectedCountry(c);
                    setCity("");
                  }}
                />
              </div>

              <Field label="Ciudad *">
                <CityAutocomplete
                  value={city}
                  onChange={setCity}
                  countryCode={selectedCountry?.code ?? null}
                  placeholder="Ej: Río de Janeiro"
                />
              </Field>

              <button
                type="button"
                onClick={next}
                disabled={!name.trim() || !selectedCountry || !city.trim()}
                className="w-full rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-40"
              >
                Continuar
              </button>
            </div>
          )}

          {/* Paso 1: Fechas */}
          {step === 1 && (
            <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-zinc-900">¿Cuándo viajas?</h2>
                <p className="text-xs text-zinc-500">
                  {selectedCountry?.flag} {city}, {getCountryName(selectedCountry?.code ?? null)}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Fecha inicio">
                  <TextInput
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </Field>
                <Field label="Fecha fin">
                  <TextInput
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                  />
                </Field>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Atrás
                </button>
                <button
                  type="button"
                  onClick={next}
                  className="flex-1 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700"
                >
                  Continuar
                </button>
              </div>
            </div>
          )}

          {/* Paso 2: Detalles */}
          {step === 2 && (
            <div className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div>
                <h2 className="text-base font-bold text-zinc-900">Resumen del viaje</h2>
                <p className="text-xs text-zinc-500">
                  {selectedCountry?.flag} {city}, {getCountryName(selectedCountry?.code ?? null)} · {startDate && endDate ? `${startDate} - ${endDate}` : "Sin fechas"}
                </p>
              </div>

              <Field label="Descripción">
                <TextArea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Notas generales del viaje..."
                />
              </Field>

              {error && (
                <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
              )}

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={prev}
                  className="rounded-xl border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
                >
                  Atrás
                </button>
                <SubmitButton pending={pending} className="flex-1">
                  Crear viaje
                </SubmitButton>
              </div>
            </div>
          )}
        </form>
      </main>
    </div>
  );
}

function BackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
