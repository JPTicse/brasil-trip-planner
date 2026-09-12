"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { updateTrip } from "@/lib/actions";
import { toast } from "sonner";
import { Field, TextInput, TextArea } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CountrySelect, POPULAR_COUNTRIES, type Country } from "@/components/country-select";
import { CityAutocomplete } from "@/components/city-autocomplete";

function getCountryByCodeOrName(value: string): Country | null {
  return (
    POPULAR_COUNTRIES.find((c) => c.code === value) ??
    POPULAR_COUNTRIES.find((c) => c.name.toLowerCase() === value.toLowerCase()) ??
    null
  );
}

export function EditTripForm({
  tripId,
  defaultName,
  defaultCountry,
  defaultCity,
  defaultStartDate,
  defaultEndDate,
  defaultDescription,
}: {
  tripId: string;
  defaultName: string;
  defaultCountry: string;
  defaultCity: string;
  defaultStartDate: string;
  defaultEndDate: string;
  defaultDescription: string;
}) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const [name, setName] = useState(defaultName);
  const [selectedCountry, setSelectedCountry] = useState<Country | null>(getCountryByCodeOrName(defaultCountry));
  const [city, setCity] = useState(defaultCity);
  const [startDate, setStartDate] = useState(defaultStartDate);
  const [endDate, setEndDate] = useState(defaultEndDate);
  const [description, setDescription] = useState(defaultDescription);

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    try {
      await updateTrip(formData);
      router.refresh();
      toast.success("Viaje actualizado ✓");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al actualizar");
    } finally {
      setPending(false);
    }
  };

  return (
    <form action={handleSubmit} className="space-y-4 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-4 shadow-sm">
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="name" value={name} />
      <input type="hidden" name="country" value={selectedCountry?.code ?? defaultCountry} />
      <input type="hidden" name="city" value={city} />
      <input type="hidden" name="start_date" value={startDate} />
      <input type="hidden" name="end_date" value={endDate} />
      <input type="hidden" name="description" value={description} />

      <Field label="Nombre del viaje *">
        <TextInput
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Ej: Aventura Brasil 2026"
          required
        />
      </Field>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-200">País</label>
        <CountrySelect
          selected={selectedCountry?.code ?? null}
          onSelect={(c) => {
            setSelectedCountry(c);
            setCity("");
          }}
        />
      </div>

      <Field label="Ciudad">
        <CityAutocomplete
          value={city}
          onChange={setCity}
          countryCode={selectedCountry?.code ?? null}
          placeholder="Ej: Río de Janeiro"
        />
      </Field>

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

      <Field label="Descripción">
        <TextArea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          placeholder="Notas generales del viaje..."
        />
      </Field>

      {error && (
        <p className="rounded-lg bg-red-50 dark:bg-red-900/20 px-3 py-2 text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      <SubmitButton pending={pending} className="w-full">
        Guardar cambios
      </SubmitButton>
    </form>
  );
}
