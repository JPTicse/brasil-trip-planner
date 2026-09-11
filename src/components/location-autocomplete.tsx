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
  onChange: (name: string, lat: number | null, lng: number | null, photoUrl?: string | null) => void;
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
          if (!place || !place.geometry) return;

          const name = place.name || place.formatted_address || "";
          const lat = place.geometry.location.lat();
          const lng = place.geometry.location.lng();

          // Intentar obtener foto con getDetails
          if (place.place_id) {
            const container = document.createElement("div");
            container.style.display = "none";
            document.body.appendChild(container);
            const service = new google.maps.places.PlacesService(container);

            service.getDetails(
              {
                placeId: place.place_id,
                fields: ["photos"],
              },
              (details: any, status: string) => {
                let photoUrl: string | null = null;
                if (status === google.maps.places.PlacesServiceStatus.OK && details?.photos?.[0]?.getUrl) {
                  try {
                    photoUrl = details.photos[0].getUrl({ maxWidth: 800, maxHeight: 600 });
                  } catch {
                    photoUrl = null;
                  }
                }
                onChange(name, lat, lng, photoUrl);
                document.body.removeChild(container);
              },
            );
          } else {
            onChange(name, lat, lng, null);
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
      onChange={(e) => onChange(e.target.value, null, null, null)}
      placeholder={placeholder ?? "Busca una ubicación..."}
      className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
    />
  );
}
