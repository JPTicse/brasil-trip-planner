"use client";

import { useEffect, useRef, useState } from "react";
import { searchOsmPlaces, type OsmPlace } from "@/lib/osm";

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
  const [results, setResults] = useState<OsmPlace[]>([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const lastSelected = useRef<string | null>(null);

  useEffect(() => {
    const q = value.trim();
    if (!countryCode || q.length < 3 || q === lastSelected.current) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    const t = setTimeout(async () => {
      const places = await searchOsmPlaces(q, {
        countryCode,
        featureType: "city",
        limit: 6,
      });
      setResults(places);
      setSearching(false);
      setOpen(places.length > 0);
    }, 600);
    return () => clearTimeout(t);
  }, [value, countryCode]);

  const select = (place: OsmPlace) => {
    lastSelected.current = place.name;
    setResults([]);
    setOpen(false);
    onChange(place.name);
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          lastSelected.current = null;
          onChange(e.target.value);
        }}
        onFocus={() => results.length > 0 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        disabled={!countryCode}
        placeholder={countryCode ? (placeholder ?? "Busca una ciudad...") : "Primero selecciona un país"}
        autoComplete="off"
        className="w-full rounded-lg border border-zinc-300 bg-white dark:bg-zinc-900 px-3 py-2.5 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:bg-zinc-100 dark:disabled:bg-zinc-800 disabled:text-zinc-400 dark:disabled:text-zinc-500"
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
                  {place.displayName}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
