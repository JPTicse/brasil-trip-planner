"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export type PlaceResult = {
  name: string;
  lat: number;
  lng: number;
  place_id?: string;
};

export function PlacesAutocomplete({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (place: PlaceResult | null, rawName: string) => void;
  placeholder?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current) return;

        const google = (window as any).google;
        autocompleteRef.current = new google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ["geocode", "establishment", "tourist_attraction", "point_of_interest"],
            fields: ["name", "geometry", "place_id", "formatted_address"],
          },
        );

        autocompleteRef.current.addListener("place_changed", () => {
          const place = autocompleteRef.current.getPlace();
          if (place && place.geometry) {
            onChange(
              {
                name: place.name || place.formatted_address || "",
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                place_id: place.place_id,
              },
              place.name || place.formatted_address || "",
            );
          }
        });

        setLoaded(true);
      })
      .catch(console.error);

    return () => {
      cancelled = true;
    };
  }, [onChange]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={value}
      placeholder={placeholder ?? "Busca un lugar..."}
      onChange={(e) => onChange(null, e.target.value)}
      className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
    />
  );
}
