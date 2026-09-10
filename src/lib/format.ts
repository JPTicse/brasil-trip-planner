// Utilidades de formato para fechas y monedas

const dateFmt = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

const dateShortFmt = new Intl.DateTimeFormat("es-ES", {
  day: "numeric",
  month: "short",
});

const timeFmt = new Intl.DateTimeFormat("es-ES", {
  hour: "2-digit",
  minute: "2-digit",
});

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return dateFmt.format(d);
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "—";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "—";
  return dateShortFmt.format(d);
}

export function formatTime(time: string | null | undefined): string {
  if (!time) return "";
  // time viene como "HH:MM:SS"
  const [h, m] = time.split(":");
  return `${h}:${m}`;
}

export function formatDateRange(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start && !end) return "Sin fechas";
  if (start && end) return `${formatDateShort(start)} → ${formatDateShort(end)}`;
  return formatDate(start ?? end);
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return `${dateShortFmt.format(d)} · ${timeFmt.format(d)}`;
}

const CURRENCY_LOCALE: Record<string, string> = {
  BRL: "pt-BR",
  EUR: "es-ES",
  USD: "en-US",
  ARS: "es-AR",
  COP: "es-CO",
  MXN: "es-MX",
  CLP: "es-CL",
};

export function formatCurrency(
  amount: number | null | undefined,
  currency: string = "BRL",
): string {
  if (amount === null || amount === undefined) return "—";
  const locale = CURRENCY_LOCALE[currency] ?? "es-ES";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDaysBetween(
  start: string | null | undefined,
  end: string | null | undefined,
): string {
  if (!start || !end) return "";
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "";
  return `${days} ${days === 1 ? "día" : "días"}`;
}

// Genera un array de fechas entre start y end (inclusive)
export function getDaysBetween(start: string, end: string): string[] {
  const s = new Date(start);
  const e = new Date(end);
  const days: string[] = [];
  const current = new Date(s);
  while (current <= e) {
    days.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
  }
  return days;
}
