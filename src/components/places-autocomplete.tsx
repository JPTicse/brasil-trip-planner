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
  titleHint,
}: {
  value: string;
  onChange: (place: PlaceResult | null, rawName: string) => void;
  placeholder?: string;
  titleHint?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);
  const [loaded, setLoaded] = useState(false);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current) return;
        const google = (window as any).google;
        if (!google?.maps?.places) return;

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

  // Autodetectar ubicación basada en el título del plan
  const autoDetect = async () => {
    if (!titleHint || loaded === false) return;
    const google = (window as any).google;
    if (!google?.maps?.places) return;

    setSearching(true);
    try {
      const service = new google.maps.places.PlacesService(
        document.createElement("div"),
      );
      const request = {
        query: titleHint,
        fields: ["name", "geometry", "place_id", "formatted_address"],
      };

      service.textSearch(request, (results: any[], status: string) => {
        setSearching(false);
        if (status === google.maps.places.PlacesServiceStatus.OK && results.length > 0) {
          const place = results[0];
          if (place.geometry?.location) {
            onChange(
              {
                name: place.name || place.formatted_address || titleHint,
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                place_id: place.place_id,
              },
              place.name || place.formatted_address || titleHint,
            );
          }
        }
      });
    } catch (e) {
      setSearching(false);
    }
  };

  return (
    <div className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        defaultValue={value}
        placeholder={placeholder ?? "Busca un lugar..."}
        onChange={(e) => onChange(null, e.target.value)}
        className="flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
      {titleHint && (
        <button
          type="button"
          onClick={autoDetect}
          disabled={searching}
          title="Autodetectar ubicación desde el título"
          className="flex shrink-0 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-emerald-700 transition hover:bg-emerald-100 disabled:opacity-50"
        >
          {searching ? (
            <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          ) : (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="12" cy="10" r="3" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}
