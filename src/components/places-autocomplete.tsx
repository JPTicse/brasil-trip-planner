"use client";

import { useEffect, useRef, useState } from "react";
import { loadGoogleMaps } from "@/lib/google-maps";

export type PlaceResult = {
  name: string;
  lat: number;
  lng: number;
  place_id?: string;
  photo_url?: string;
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
  const [error, setError] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled || !inputRef.current) return;
        const google = (window as any).google;
        if (!google?.maps?.places) {
          setError("Places API no disponible");
          return;
        }

        // Evitar doble init
        if (autocompleteRef.current) return;

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
            const photoUrl = place.photos?.[0]?.getUrl?.({ maxWidth: 800, maxHeight: 600 });
            onChange(
              {
                name: place.name || place.formatted_address || "",
                lat: place.geometry.location.lat(),
                lng: place.geometry.location.lng(),
                place_id: place.place_id,
                photo_url: photoUrl,
              },
              place.name || place.formatted_address || "",
            );
          }
        });

        setLoaded(true);
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Error");
      });

    return () => {
      cancelled = true;
    };
  }, [onChange]);

  // Autodetectar: usa Geocoder directamente (no deprecado)
  const autoDetect = async () => {
    if (!titleHint || !loaded) return;
    const google = (window as any).google;
    if (!google?.maps?.Geocoder) return;

    setError(null);
    setSearching(true);

    try {
      const geocoder = new google.maps.Geocoder();

      geocoder.geocode(
        {
          address: titleHint,
          componentRestrictions: { country: "BR" },
        },
        (results: any[], status: string) => {
          setSearching(false);
          if (status === google.maps.GeocoderStatus.OK && results?.length) {
            const r = results[0];
            const photos = r.photos;
            const photoUrl = photos?.[0]?.getUrl?.({ maxWidth: 800, maxHeight: 600 });
            onChange(
              {
                name: r.formatted_address || titleHint,
                lat: r.geometry.location.lat(),
                lng: r.geometry.location.lng(),
                place_id: r.place_id,
                photo_url: photoUrl,
              },
              r.formatted_address || titleHint,
            );
          } else {
            // Intentar sin restricción de país
            geocoder.geocode({ address: titleHint }, (results2: any[], status2: string) => {
              if (status2 === google.maps.GeocoderStatus.OK && results2?.length) {
                const r = results2[0];
                const photos = r.photos;
                const photoUrl = photos?.[0]?.getUrl?.({ maxWidth: 800, maxHeight: 600 });
                onChange(
                  {
                    name: r.formatted_address || titleHint,
                    lat: r.geometry.location.lat(),
                    lng: r.geometry.location.lng(),
                    place_id: r.place_id,
                    photo_url: photoUrl,
                  },
                  r.formatted_address || titleHint,
                );
              } else {
                setError("No se encontró el lugar. Búscalo manualmente.");
              }
            });
          }
        },
      );
    } catch (e) {
      setSearching(false);
      setError("Error al buscar el lugar");
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          defaultValue={value}
          placeholder={placeholder ?? "Busca un lugar..."}
          onChange={(e) => onChange(null, e.target.value)}
          className="flex-1 rounded-lg border border-zinc-200 px-3 py-2.5 text-sm text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        {titleHint && titleHint.length > 2 && (
          <button
            type="button"
            onClick={autoDetect}
            disabled={searching}
            title="Buscar ubicación desde el título"
            className="flex shrink-0 items-center justify-center rounded-lg border border-emerald-300 bg-emerald-50 px-3 text-emerald-700 transition hover:bg-emerald-100 active:scale-95 disabled:opacity-50"
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
      {error && (
        <p className="text-[11px] text-amber-600">{error}</p>
      )}
      <p className="text-[10px] text-zinc-400">
        Escribe el nombre del lugar y selecciónalo de las sugerencias, o pulsa el pin para autodetectar desde el título.
      </p>
    </div>
  );
}
