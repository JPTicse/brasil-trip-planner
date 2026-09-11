"use client";

/**
 * Selector de tiempo compacto con selects nativos estilizados.
 * En móvil cada select abre el picker del sistema, más usable que ruedas.
 */
export function TimePicker({
  value,
  onChange,
  label,
}: {
  value: string;
  onChange: (time: string) => void;
  label: string;
}) {
  const [h = "", m = ""] = (value ?? "").split(":").map((s) => s ?? "");

  const pad = (n: string | number) => String(n).padStart(2, "0");
  const hours = Array.from({ length: 24 }, (_, i) => pad(i));
  const minutes = Array.from({ length: 60 }, (_, i) => pad(i));

  const handleHour = (newHour: string) => {
    onChange(`${newHour}:${m || "00"}`);
  };

  const handleMinute = (newMinute: string) => {
    onChange(`${h || "00"}:${newMinute}`);
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-center text-xs font-bold uppercase text-zinc-400">{label}</p>
      <div className="flex items-center gap-2 rounded-2xl border border-zinc-200 bg-white p-2 dark:border-zinc-700 dark:bg-zinc-800">
        <select
          value={h || ""}
          onChange={(e) => handleHour(e.target.value)}
          className="h-12 w-16 appearance-none rounded-xl bg-zinc-100 py-2 text-center text-2xl font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="" disabled>--</option>
          {hours.map((hour) => (
            <option key={hour} value={hour}>{hour}</option>
          ))}
        </select>
        <span className="text-2xl font-bold text-zinc-400">:</span>
        <select
          value={m || ""}
          onChange={(e) => handleMinute(e.target.value)}
          className="h-12 w-16 appearance-none rounded-xl bg-zinc-100 py-2 text-center text-2xl font-bold text-zinc-900 outline-none focus:ring-2 focus:ring-emerald-500/50 dark:bg-zinc-900 dark:text-zinc-100"
        >
          <option value="" disabled>--</option>
          {minutes.map((minute) => (
            <option key={minute} value={minute}>{minute}</option>
          ))}
        </select>
      </div>
      {value && <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">{value}</p>}
    </div>
  );
}
