"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  country = "br",
}: {
  value: string;
  onChange: (name: string, lat: number | null, lng: number | null) => void;
  placeholder?: string;
  country?: string;
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

        // No se puede mezclar "geocode" con otros tipos
        const types = ["establishment"];
        const options: any = {
          types,
          fields: ["name", "geometry", "place_id", "formatted_address"],
        };

        if (country) {
          options.componentRestrictions = { country: country.toLowerCase() };
        }

        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          options,
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.geometry) {
            onChange(
              place.name || place.formatted_address || "",
              place.geometry.location.lat(),
              place.geometry.location.lng(),
            );
          }
        });
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [onChange, country]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value, null, null)}
      placeholder={placeholder ?? "Busca una ubicación..."}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    />
  );
}
