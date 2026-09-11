"use client";

export type Country = {
  code: string;
  name: string;
  flag: string;
};

export const POPULAR_COUNTRIES: Country[] = [
  { code: "BR", name: "Brasil", flag: "🇧🇷" },
  { code: "CO", name: "Colombia", flag: "🇨🇴" },
  { code: "AR", name: "Argentina", flag: "🇦🇷" },
  { code: "CL", name: "Chile", flag: "🇨🇱" },
  { code: "PE", name: "Perú", flag: "🇵🇪" },
  { code: "MX", name: "México", flag: "🇲🇽" },
  { code: "UY", name: "Uruguay", flag: "🇺🇾" },
  { code: "EC", name: "Ecuador", flag: "🇪🇨" },
  { code: "BO", name: "Bolivia", flag: "🇧🇴" },
  { code: "PY", name: "Paraguay", flag: "🇵🇾" },
  { code: "ES", name: "España", flag: "🇪🇸" },
  { code: "IT", name: "Italia", flag: "🇮🇹" },
  { code: "FR", name: "Francia", flag: "🇫🇷" },
  { code: "JP", name: "Japón", flag: "🇯🇵" },
  { code: "US", name: "Estados Unidos", flag: "🇺🇸" },
  { code: "GB", name: "Reino Unido", flag: "🇬🇧" },
];

export function CountrySelect({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (country: Country) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {POPULAR_COUNTRIES.map((country) => (
        <button
          key={country.code}
          type="button"
          onClick={() => onSelect(country)}
          className={`flex items-center gap-2.5 rounded-xl border p-3 text-left transition ${
            selected === country.code
              ? "border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500"
              : "border-zinc-200 bg-white hover:border-emerald-300"
          }`}
        >
          <span className="text-2xl">{country.flag}</span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-zinc-900">{country.name}</p>
            <p className="text-[10px] text-zinc-400 uppercase">{country.code}</p>
          </div>
          {selected === country.code && (
            <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </button>
      ))}
    </div>
  );
}
