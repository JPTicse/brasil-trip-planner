"use client";

import { useEffect, useRef, useState } from "react";
import { searchOsmPlaces, searchPlacePhoto, type OsmPlace } from "@/lib/osm";

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
  const [results, setResults] = useState<OsmPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const onChangeRef = useRef(onChange);
  const lastSelected = useRef<string | null>(null);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Búsqueda con debounce (Nominatim: uso moderado, sin API key)
  useEffect(() => {
    const q = value.trim();
    if (q.length < 3 || q === lastSelected.current) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const places = await searchOsmPlaces(q, {
        countryCode: country,
        limit: 6,
      });
      setResults(places);
      setSearching(false);
      setOpen(places.length > 0);
    }, 600);
    return () => clearTimeout(t);
  }, [value, country]);

  const select = (place: OsmPlace) => {
    const name = preferFormattedAddress
      ? place.address || place.displayName
      : place.name || place.displayName;
    lastSelected.current = name;
    setResults([]);
    setOpen(false);
    onChangeRef.current(name, place.lat, place.lng, null);

    // Foto gratuita (Openverse/Wikimedia) en segundo plano para establecimientos
    if (mode === "establishment") {
      void searchPlacePhoto(place.name, place.address).then((photoUrl) => {
        if (photoUrl) onChangeRef.current(name, place.lat, place.lng, photoUrl);
      });
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          lastSelected.current = null;
          onChange(e.target.value, null, null, null);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder ?? "Busca una ubicación..."}
        autoComplete="off"
        className="w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
      />
      {searching && (
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2">
          <svg className="h-4 w-4 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      )}
      {open && results.length > 0 && (
        <ul className="absolute inset-x-0 top-full z-30 mt-1 max-h-56 overflow-y-auto rounded-xl border border-zinc-200 bg-white py-1 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
          {results.map((place) => (
            <li key={place.id}>
              <button
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  select(place);
                }}
                className="flex w-full flex-col px-3 py-2 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
              >
                <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {place.name}
                </span>
                <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                  {place.address}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
