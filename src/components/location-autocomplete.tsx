"use client";

import { useEffect, useRef } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export function LocationAutocomplete({
  value,
  onChange,
  placeholder,
  country = "br",
  preferFormattedAddress = false,
  mode = "establishment",
}: {
  value: string;
  onChange: (name: string, lat: number | null, lng: number | null, photoUrl?: string | null) => void;
  placeholder?: string;
  country?: string;
  preferFormattedAddress?: boolean;
  mode?: "establishment" | "address";
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current) return;

        const mapsApi = window.google;
        if (!mapsApi?.maps?.places) return;

        // No se puede mezclar "geocode" con otros tipos
        const options: google.maps.places.AutocompleteOptions = {
          types: [mode],
          fields:
            mode === "establishment"
              ? ["name", "geometry", "place_id", "formatted_address", "photos"]
              : ["name", "geometry", "place_id", "formatted_address"],
        };

        if (country) {
          options.componentRestrictions = { country: country.toLowerCase() };
        }

        const autocomplete = new mapsApi.maps.places.Autocomplete(
          inputRef.current,
          options,
        );
        autocompleteRef.current = autocomplete;

        autocomplete.addListener("place_changed", () => {
          const place = autocomplete.getPlace();
          if (!place.geometry?.location) return;

          const name = preferFormattedAddress
            ? place.formatted_address || place.name || ""
            : place.name || place.formatted_address || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          let photoUrl: string | null = null;
          try {
            photoUrl = place.photos?.[0]?.getUrl({ maxWidth: 800, maxHeight: 600 }) ?? null;
          } catch {
            photoUrl = null;
          }
          onChangeRef.current(name, lat, lng, photoUrl);
        });
      })
      .catch(console.error);

    return () => {
      cancelled = true;
      autocompleteRef.current = null;
    };
  }, [country, mode, preferFormattedAddress]);

  return (
    <input
      ref={inputRef}
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value, null, null, null)}
      placeholder={placeholder ?? "Busca una ubicación..."}
      className="w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    />
  );
}
