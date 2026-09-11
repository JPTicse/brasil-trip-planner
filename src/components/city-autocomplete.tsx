"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export function CityAutocomplete({
  value,
  onChange,
  countryCode,
  placeholder,
}: {
  value: string;
  onChange: (city: string) => void;
  countryCode: string | null;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current) return;

        const google = (window as any).google;
        if (!google?.maps?.places) return;

        const options: any = {
          types: ["(cities)"],
          fields: ["name", "place_id", "formatted_address"],
        };

        if (countryCode) {
          options.componentRestrictions = { country: countryCode.toLowerCase() };
        }

        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          options,
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (place) {
            onChange(place.name || place.formatted_address || "");
          }
        });
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [onChange, countryCode]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={!countryCode}
      placeholder={countryCode ? (placeholder ?? "Busca una ciudad...") : "Primero selecciona un país"}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-zinc-100 disabled:text-zinc-400"
    />
  );
}
