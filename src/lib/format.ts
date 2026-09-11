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

// Convierte "YYYY-MM-DD" a Date LOCAL sin desplazarse a UTC
export function parseLocalDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const [, y, m, d] = match;
  const dt = new Date(Number(y), Number(m) - 1, Number(d));
  if (isNaN(dt.getTime())) return null;
  return dt;
}

// Formatea un Date LOCAL como "YYYY-MM-DD"
function toISODateLocal(dt: Date): string {
  const y = dt.getFullYear();
  const m = String(dt.getMonth() + 1).padStart(2, "0");
  const d = String(dt.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function formatDate(date: string | null | undefined): string {
  if (!date) return "—";
  const d = parseLocalDate(date);
  if (!d) return "—";
  return dateFmt.format(d);
}

export function formatDateShort(date: string | null | undefined): string {
  if (!date) return "—";
  const d = parseLocalDate(date);
  if (!d) return "—";
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
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  if (!s || !e) return "";
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
  if (days <= 0) return "";
  return `${days} ${days === 1 ? "día" : "días"}`;
}

// Genera un array de fechas entre start y end (inclusive) en tiempo local
export function getDaysBetween(start: string, end: string): string[] {
  const s = parseLocalDate(start);
  const e = parseLocalDate(end);
  if (!s || !e) return [];
  const days: string[] = [];
  const current = new Date(s.getFullYear(), s.getMonth(), s.getDate());
  const endDate = new Date(e.getFullYear(), e.getMonth(), e.getDate());
  while (current <= endDate) {
    days.push(toISODateLocal(current));
    current.setDate(current.getDate() + 1);
  }
  return days;
}
