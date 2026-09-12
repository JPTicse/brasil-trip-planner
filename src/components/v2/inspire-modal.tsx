"use client";

import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { saveInspirations, createActivity } from "@/lib/actions";
import { fetchInspirationsClient } from "@/lib/places-client";
import { toast } from "sonner";
import { ACTIVITY_TYPE_LABELS, type ActivityType, type Inspiration } from "@/lib/types";
import { getDaysBetween } from "@/lib/format";

const GOOGLE_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

const TYPE_DOT: Record<ActivityType, string> = {
  visit: "bg-blue-500",
  tour: "bg-violet-500",
  meal: "bg-orange-500",
  event: "bg-rose-500",
  free: "bg-emerald-500",
  transport: "bg-zinc-500",
};

const TYPE_EMOJI: Record<ActivityType, string> = {
  visit: "👀",
  tour: "🚌",
  meal: "🍽️",
  event: "🎉",
  free: "🌿",
  transport: "✈️",
};

type Filter = "trending" | "best-rated" | "all";

export function InspireModal({
  open,
  onClose,
  inspirations,
  tripId,
  tripDestination,
  tripStartDate,
  tripEndDate,
}: {
  open: boolean;
  onClose: () => void;
  inspirations: Inspiration[];
  tripId: string;
  tripDestination: string;
  tripStartDate?: string;
  tripEndDate?: string;
}) {
  const [localInspirations, setLocalInspirations] = useState<Inspiration[]>(inspirations);
  const [filter, setFilter] = useState<Filter>("trending");
  const [refreshing, setRefreshing] = useState(false);
  const [selected, setSelected] = useState<Inspiration | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Filtrar y ordenar
  const filtered = (() => {
    const list = [...localInspirations];
    if (filter === "trending") {
      // Trending: rating * log(1 + popularity proxy)
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    } else if (filter === "best-rated") {
      list.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    }
    // "all" keeps original order
    return list;
  })();

  const handleRefresh = async () => {
    if (!GOOGLE_KEY) {
      toast.error("Falta la clave de Google Maps");
      return;
    }
    setRefreshing(true);
    try {
      const places = await fetchInspirationsClient(tripDestination, GOOGLE_KEY);
      if (places.length === 0) {
        toast.error("No se encontraron resultados para este destino");
        return;
      }

      // Guardar en Supabase
      const formData = new FormData();
      formData.append("trip_id", tripId);
      formData.append("places", JSON.stringify(places));
      await saveInspirations(formData);

      setLocalInspirations(places);
      toast.success(`${places.length} inspiraciones encontradas ✓`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Error al buscar inspiraciones";
      toast.error(message);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddToPlan = (inspiration: Inspiration) => {
    setSelected(inspiration);
    setShowWizard(true);
  };

  if (!open) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[60] flex flex-col bg-black"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Header — sticky, sin blur */}
        <div className="shrink-0 bg-zinc-950 pb-3" style={{ paddingTop: "max(1rem, env(safe-area-inset-top))" }}>
          <div className="flex items-center justify-between px-4 pt-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">✨</span>
              <h2 className="text-lg font-bold text-white">Inspirar</h2>
              <span className="text-xs text-white/50">{filtered.length} ideas</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
              >
                <svg className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {refreshing ? "Cargando..." : "Actualizar"}
              </button>
              <button
                onClick={onClose}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white/80 transition hover:bg-white/20 active:scale-95"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
          </div>

          {/* Filtros pill — sin blur */}
          <div className="mt-3 flex gap-2 overflow-x-auto px-4 pb-1" style={{ scrollbarWidth: "none" }}>
            {([
              { id: "trending" as Filter, label: "🔥 Tendencias" },
              { id: "best-rated" as Filter, label: "⭐ Mejor valoradas" },
              { id: "all" as Filter, label: "Todas" },
            ]).map((f) => (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium transition active:scale-95 ${
                  filter === f.id
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-white/70 hover:bg-white/20"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Feed */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain snap-y snap-mandatory"
          style={{ scrollbarWidth: "none" }}
        >
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
              <div className="text-center">
                <div className="mb-3 text-4xl">✨</div>
                <p className="text-sm font-medium text-white/80">No hay inspiraciones aún</p>
                <p className="mt-1 text-xs text-white/50">Busca actividades en {tripDestination}</p>
              </div>
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
              >
                <svg className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M23 4v6h-6M1 20v-6h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {refreshing ? "Cargando..." : "Buscar inspiraciones"}
              </button>
            </div>
          ) : (
            <div className="space-y-3 px-4 pb-8 pt-2">
              {filtered.map((insp, i) => (
                <InspireCard
                  key={insp.id}
                  inspiration={insp}
                  index={i}
                  onAddToPlan={() => handleAddToPlan(insp)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Wizard pre-lleno */}
        <AnimatePresence>
          {showWizard && selected && (
            <PrefillWizard
              inspiration={selected}
              tripId={tripId}
              tripDestination={tripDestination}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onClose={() => {
                setShowWizard(false);
                setSelected(null);
              }}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// --- Card individual ---

function InspireCard({
  inspiration,
  index,
  onAddToPlan,
}: {
  inspiration: Inspiration;
  index: number;
  onAddToPlan: () => void;
}) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const type = inspiration.suggested_type;
  const emoji = TYPE_EMOJI[type];

  return (
    <motion.div
      className="relative h-[70dvh] min-h-[420px] w-full snap-start overflow-hidden rounded-2xl border-l-4"
      style={{ borderColor: getTypeBorderColor(type) }}
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.06, 0.4), duration: 0.4 }}
    >
      {/* Imagen */}
      {inspiration.image_url ? (
        <>
          {!imageLoaded && (
            <div className="absolute inset-0 animate-pulse bg-zinc-800" />
          )}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={inspiration.image_url}
            alt={inspiration.title}
            className={`h-full w-full object-cover transition-opacity duration-500 ${imageLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImageLoaded(true)}
            loading="lazy"
          />
        </>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-zinc-800 to-zinc-900" />
      )}

      {/* Gradiente */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/20" />

      {/* Top: tipo y rating */}
      <div className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
        <span className="flex items-center gap-1.5 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm ring-1 ring-white/25">
          <span className={`h-2 w-2 rounded-full ${TYPE_DOT[type]}`} />
          {emoji} {ACTIVITY_TYPE_LABELS[type]}
        </span>
        {inspiration.rating != null && (
          <span className="flex items-center gap-1 rounded-full bg-black/35 px-2.5 py-1 text-[10px] font-bold text-white backdrop-blur-sm ring-1 ring-white/25">
            ⭐ {inspiration.rating.toFixed(1)}
          </span>
        )}
      </div>

      {/* Bottom: info + CTA */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col gap-3 p-4">
        <div>
          <h3 className="text-xl font-extrabold leading-tight text-white">
            {inspiration.title}
          </h3>
          {inspiration.address && (
            <p className="mt-1 line-clamp-1 text-sm text-white/70">
              📍 {inspiration.address}
            </p>
          )}
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-white/60">
            {inspiration.cost_estimate != null && inspiration.cost_estimate > 0 && (
              <span className="rounded bg-black/35 px-2 py-0.5 font-semibold text-white ring-1 ring-white/25">
                ~{inspiration.currency} {inspiration.cost_estimate}
              </span>
            )}
            {inspiration.cost_estimate === 0 && (
              <span className="rounded bg-emerald-500/80 px-2 py-0.5 font-semibold text-white">
                Gratis
              </span>
            )}
          </div>
        </div>

        <button
          onClick={onAddToPlan}
          className="flex w-full items-center justify-center gap-1.5 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
            <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Crear plan
        </button>
      </div>
    </motion.div>
  );
}

// --- Wizard pre-lleno (quick add) ---

function PrefillWizard({
  inspiration,
  tripId,
  tripDestination,
  tripStartDate,
  tripEndDate,
  onClose,
}: {
  inspiration: Inspiration;
  tripId: string;
  tripDestination: string;
  tripStartDate?: string;
  tripEndDate?: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const days = tripStartDate && tripEndDate ? getDaysBetween(tripStartDate, tripEndDate) : [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) {
      toast.error("Selecciona un día");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("trip_id", tripId);
      formData.append("title", inspiration.title);
      formData.append("date", date);
      formData.append("type", inspiration.suggested_type);
      formData.append("location", inspiration.address ?? inspiration.title);
      if (inspiration.lat != null) formData.append("location_lat", String(inspiration.lat));
      if (inspiration.lng != null) formData.append("location_lng", String(inspiration.lng));
      if (inspiration.cost_estimate != null) formData.append("cost", String(inspiration.cost_estimate));
      formData.append("currency", inspiration.currency);
      if (inspiration.image_url) formData.append("image_url", inspiration.image_url);

      await createActivity(formData);
      toast.success("Plan creado ✓");
      onClose();
    } catch (e) {
      toast.error("Error al crear el plan");
      setSubmitting(false);
    }
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[70] flex items-end sm:items-center sm:justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      <motion.div
        className="relative z-10 w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-3xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
        </div>

        <div className="px-5 pb-5 pt-2">
          {/* Preview */}
          <div className="mb-4 flex gap-3">
            {inspiration.image_url && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inspiration.image_url} alt={inspiration.title} className="h-full w-full object-cover" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-1 text-base font-bold text-zinc-900 dark:text-zinc-100">
                {inspiration.title}
              </h3>
              <div className="mt-0.5 flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1">
                  <span className={`h-2 w-2 rounded-full ${TYPE_DOT[inspiration.suggested_type]}`} />
                  {ACTIVITY_TYPE_LABELS[inspiration.suggested_type]}
                </span>
                {inspiration.rating != null && <span>⭐ {inspiration.rating.toFixed(1)}</span>}
                {inspiration.cost_estimate != null && inspiration.cost_estimate > 0 && (
                  <span>~{inspiration.currency} {inspiration.cost_estimate}</span>
                )}
              </div>
              {inspiration.address && (
                <p className="mt-0.5 line-clamp-1 text-xs text-zinc-400 dark:text-zinc-500">
                  📍 {inspiration.address}
                </p>
              )}
            </div>
          </div>

          {/* Selector de día */}
          <form onSubmit={handleSubmit}>
            <label className="mb-2 block text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              ¿Qué día?
            </label>
            {days.length > 0 ? (
              <div className="mb-4 grid grid-cols-3 gap-2 sm:grid-cols-4">
                {days.map((day) => {
                  const d = new Date(day + "T00:00");
                  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(d);
                  const dayNum = d.getDate();
                  const isSelected = date === day;
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => setDate(day)}
                      className={`flex flex-col items-center rounded-xl border py-2 transition active:scale-95 ${
                        isSelected
                          ? "border-emerald-500 bg-emerald-500 text-white"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-emerald-300 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
                      }`}
                    >
                      <span className="text-[10px] font-medium uppercase opacity-70">{weekday}</span>
                      <span className="text-base font-bold leading-tight">{dayNum}</span>
                    </button>
                  );
                })}
              </div>
            ) : (
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mb-4 w-full rounded-xl border border-zinc-200 bg-white px-3 py-2.5 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
              />
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={submitting || !date}
                className="flex flex-1 items-center justify-center rounded-xl bg-emerald-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-600 active:scale-95 disabled:opacity-50"
              >
                {submitting ? "Creando..." : "Crear plan"}
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </motion.div>,
    document.body,
  );
}

function getTypeBorderColor(type: ActivityType): string {
  const colors: Record<ActivityType, string> = {
    visit: "#3b82f6",
    tour: "#8b5cf6",
    meal: "#f97316",
    event: "#f43f5e",
    free: "#10b981",
    transport: "#71717a",
  };
  return colors[type];
}
