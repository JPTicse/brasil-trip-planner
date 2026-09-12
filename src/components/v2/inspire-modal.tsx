"use client";

import { useState, useRef, useEffect } from "react";
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
  const scrollRef = useRef<HTMLDivElement>(null);

  // Actualizar cuando cambian las inspiraciones del servidor
  useEffect(() => {
    setLocalInspirations(inspirations);
  }, [inspirations]);

  // Filtrar y ordenar
  const filtered = (() => {
    const list = [...localInspirations];
    if (filter === "trending") {
      // Trending: rating * log(1 + user_ratings_total)
      list.sort((a, b) => {
        const scoreA = (a.rating ?? 0) * Math.log(1 + (a.user_ratings_total ?? 0));
        const scoreB = (b.rating ?? 0) * Math.log(1 + (b.user_ratings_total ?? 0));
        return scoreB - scoreA;
      });
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

        {/* Feed — collage cards (sin botón "Crear plan", se abre detalle al tocar) */}
        <div
          ref={scrollRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain"
          style={{ scrollbarWidth: "none" }}
        >
          {filtered.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 px-6">
              <div className="text-center">
                <div className="mb-3 text-4xl">✨</div>
                <p className="text-sm font-medium text-white/80">No hay inspiraciones aún</p>
                <p className="mt-1 text-xs text-white/50">Busca lugares trending en {tripDestination}</p>
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
            <div className="space-y-4 px-4 pb-8 pt-3">
              {filtered.map((insp, i) => (
                <CollageCard
                  key={insp.id}
                  inspiration={insp}
                  index={i}
                  onClick={() => setSelected(insp)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Vista de detalle — bottom sheet con galería + info + "Agregar al viaje" */}
        <AnimatePresence>
          {selected && (
            <PlaceDetailSheet
              inspiration={selected}
              tripId={tripId}
              tripDestination={tripDestination}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onClose={() => setSelected(null)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>,
    document.body,
  );
}

// --- Card con collage de imágenes (sin botón, se abre detalle al tocar) ---

function CollageCard({
  inspiration,
  index,
  onClick,
}: {
  inspiration: Inspiration;
  index: number;
  onClick: () => void;
}) {
  const type = inspiration.suggested_type;
  const typeEmoji = TYPE_EMOJI[type];
  const spotEmoji = inspiration.emoji ?? typeEmoji;
  const images = inspiration.image_urls?.length > 0
    ? inspiration.image_urls
    : inspiration.image_url
      ? [inspiration.image_url]
      : [];

  return (
    <motion.button
      onClick={onClick}
      className="block w-full overflow-hidden rounded-2xl border border-white/10 bg-zinc-900 text-left transition active:scale-[0.98]"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.3), duration: 0.3 }}
    >
      {/* Collage de imágenes */}
      <ImageCollage
        images={images}
        emoji={inspiration.emoji}
        category={inspiration.category}
        title={inspiration.title}
      />

      {/* Info */}
      <div className="p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-base font-bold text-white">
            {spotEmoji} {inspiration.title}
          </h3>
          {inspiration.rating != null && (
            <span className="flex shrink-0 items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-xs font-bold text-white">
              ⭐ {inspiration.rating.toFixed(1)}
            </span>
          )}
        </div>

        {/* 📸 Foto trend — el "punto humano" que el grupo querría replicar */}
        {inspiration.viral_trend && (
          <div className="mt-2 flex items-start gap-1.5 rounded-lg bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 px-2.5 py-1.5">
            <span className="text-sm">📸</span>
            <p className="line-clamp-2 text-xs font-medium text-pink-200">
              {inspiration.viral_trend}
            </p>
          </div>
        )}

        <div className="mt-1.5 flex items-center gap-2 text-xs text-white/50">
          <span className="flex items-center gap-1">
            <span className={`h-2 w-2 rounded-full ${TYPE_DOT[type]}`} />
            {typeEmoji} {ACTIVITY_TYPE_LABELS[type]}
          </span>
          {inspiration.user_ratings_total != null && (
            <span>· {inspiration.user_ratings_total.toLocaleString("es")} reseñas</span>
          )}
        </div>
        {inspiration.address && (
          <p className="mt-1 line-clamp-1 text-xs text-white/40">
            📍 {inspiration.address}
          </p>
        )}
      </div>
    </motion.button>
  );
}

// --- Collage de imágenes (grid adaptativo según cantidad) ---

// Gradientes por categoría para placeholders sin foto
const CATEGORY_GRADIENTS: Record<string, string> = {
  landmark: "from-amber-500/30 to-orange-700/40",
  viewpoint: "from-sky-500/30 to-indigo-700/40",
  beach: "from-cyan-500/30 to-blue-700/40",
  hiking: "from-emerald-500/30 to-green-800/40",
  "street-art": "from-fuchsia-500/30 to-purple-700/40",
  stadium: "from-rose-500/30 to-red-700/40",
  museum: "from-violet-500/30 to-indigo-800/40",
  park: "from-lime-500/30 to-green-700/40",
  nightlife: "from-purple-500/30 to-zinc-800/40",
  food: "from-orange-500/30 to-red-600/40",
};

function ImageCollage({
  images,
  emoji,
  category,
  title,
}: {
  images: string[];
  emoji?: string | null;
  category?: string | null;
  title?: string;
}) {
  if (images.length === 0) {
    const gradient = CATEGORY_GRADIENTS[category ?? ""] ?? "from-zinc-700 to-zinc-900";
    return (
      <div className={`flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br ${gradient}`}>
        <span className="text-6xl opacity-80">{emoji ?? "📍"}</span>
      </div>
    );
  }

  // 1 imagen → full
  if (images.length === 1) {
    return (
      <div className="aspect-[4/3] w-full overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
    );
  }

  // 2 imágenes → 50/50
  if (images.length === 2) {
    return (
      <div className="grid aspect-[4/3] grid-cols-2 gap-0.5">
        {images.slice(0, 2).map((src, i) => (
          <div key={i} className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    );
  }

  // 3 imágenes → hero left (2/3) + 2 stacked right (1/3)
  if (images.length === 3) {
    return (
      <div className="grid aspect-[4/3] grid-cols-3 grid-rows-2 gap-0.5">
        <div className="col-span-2 row-span-2 overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
        </div>
        {images.slice(1, 3).map((src, i) => (
          <div key={i} className="overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    );
  }

  // 4+ imágenes → hero left (2/3) + 3 stacked right (1/3) con "+N"
  return (
    <div className="grid aspect-[4/3] grid-cols-3 grid-rows-3 gap-0.5">
      <div className="col-span-2 row-span-3 overflow-hidden">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={images[0]} alt="" className="h-full w-full object-cover" loading="lazy" />
      </div>
      {images.slice(1, 4).map((src, i) => (
        <div key={i} className="relative overflow-hidden">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="" className="h-full w-full object-cover" loading="lazy" />
          {i === 2 && images.length > 4 && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <span className="text-lg font-bold text-white">+{images.length - 4}</span>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// --- Vista de detalle — bottom sheet con galería swipeable + info + "Agregar al viaje" ---

function PlaceDetailSheet({
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
  const [galleryIndex, setGalleryIndex] = useState(0);
  const [showAddToTrip, setShowAddToTrip] = useState(false);
  const type = inspiration.suggested_type;
  const emoji = TYPE_EMOJI[type];

  const images = inspiration.image_urls?.length > 0
    ? inspiration.image_urls
    : inspiration.image_url
      ? [inspiration.image_url]
      : [];

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[70] flex items-end sm:items-center sm:justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />

      {/* Sheet */}
      <motion.div
        className="relative z-10 flex max-h-[92vh] w-full max-w-md flex-col overflow-hidden rounded-t-3xl bg-zinc-950 shadow-2xl sm:rounded-3xl"
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
      >
        {/* Grabber */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-700" />
        </div>

        {/* Contenido scrollable */}
        <div className="min-h-0 flex-1 overflow-y-auto" style={{ scrollbarWidth: "none" }}>
          {/* Galería swipeable (scroll-snap nativo, sin dependencias) */}
          {images.length > 0 ? (
            <div
              className="flex aspect-[4/3] w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain"
              style={{ scrollbarWidth: "none" }}
              onScroll={(e) => {
                const scrollLeft = e.currentTarget.scrollLeft;
                const width = e.currentTarget.clientWidth;
                setGalleryIndex(Math.round(scrollLeft / width));
              }}
            >
              {images.map((src, i) => (
                <div key={i} className="h-full w-full shrink-0 snap-start">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={src} alt={inspiration.title} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <div className={`flex aspect-[4/3] w-full items-center justify-center bg-gradient-to-br ${CATEGORY_GRADIENTS[inspiration.category ?? ""] ?? "from-zinc-800 to-zinc-900"}`}>
              <span className="text-7xl opacity-80">{inspiration.emoji ?? "📍"}</span>
            </div>
          )}

          {/* Indicadores de galería (dots) */}
          {images.length > 1 && (
            <div className="flex justify-center gap-1.5 py-2">
              {images.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === galleryIndex ? "w-5 bg-emerald-500" : "w-1.5 bg-zinc-700"
                  }`}
                />
              ))}
            </div>
          )}

          {/* Info */}
          <div className="space-y-3 p-5">
            {/* Tipo + rating */}
            <div className="flex items-center gap-2 text-xs">
              <span className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 font-bold text-white">
                <span className={`h-2 w-2 rounded-full ${TYPE_DOT[type]}`} />
                {emoji} {ACTIVITY_TYPE_LABELS[type]}
              </span>
              {inspiration.rating != null && (
                <span className="flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-1 font-bold text-white">
                  ⭐ {inspiration.rating.toFixed(1)}
                </span>
              )}
              {inspiration.user_ratings_total != null && (
                <span className="text-white/40">
                  {inspiration.user_ratings_total.toLocaleString("es")} reseñas
                </span>
              )}
            </div>

            {/* Título */}
            <h2 className="text-xl font-extrabold leading-tight text-white">
              {inspiration.emoji ? `${inspiration.emoji} ` : ""}{inspiration.title}
            </h2>

            {/* 📸 La foto que tienes que tomar — el trend viral del lugar */}
            {inspiration.viral_trend && (
              <div className="rounded-xl bg-gradient-to-r from-fuchsia-500/20 to-pink-500/20 p-3">
                <p className="mb-0.5 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-pink-300">
                  📸 La foto que tienes que tomar
                </p>
                <p className="text-sm font-medium text-pink-100">
                  {inspiration.viral_trend}
                </p>
              </div>
            )}

            {/* Dirección */}
            {inspiration.address && (
              <p className="flex items-start gap-1.5 text-sm text-white/60">
                <span className="mt-0.5">📍</span>
                <span>{inspiration.address}</span>
              </p>
            )}

            {/* Descripción editorial */}
            {inspiration.description && (
              <p className="text-sm leading-relaxed text-white/70">
                {inspiration.description}
              </p>
            )}

            {/* Costo estimado */}
            {inspiration.cost_estimate != null && inspiration.cost_estimate > 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-lg bg-white/10 px-2.5 py-1 font-semibold text-white">
                  ~{inspiration.currency} {inspiration.cost_estimate}
                </span>
              </div>
            )}
            {inspiration.cost_estimate === 0 && (
              <div className="flex items-center gap-2 text-sm">
                <span className="rounded-lg bg-emerald-500/20 px-2.5 py-1 font-semibold text-emerald-400">
                  Gratis
                </span>
              </div>
            )}

            {/* Horarios */}
            {inspiration.opening_hours && inspiration.opening_hours.length > 0 && (
              <div className="rounded-xl bg-white/5 p-3">
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-white/40">
                  Horarios
                </p>
                <div className="space-y-0.5">
                  {inspiration.opening_hours.map((h, i) => (
                    <p key={i} className="text-xs text-white/60">{h}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Website */}
            {inspiration.website && (
              <a
                href={inspiration.website}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium text-emerald-400 hover:text-emerald-300"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M15 3h6v6M10 14L21 3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Ver sitio web
              </a>
            )}
          </div>
        </div>

        {/* Footer — botón "Agregar al viaje" (solo aquí, no en el feed) */}
        <div
          className="shrink-0 border-t border-white/10 bg-zinc-950 p-4"
          style={{ paddingBottom: "max(1rem, env(safe-area-inset-bottom))" }}
        >
          <button
            onClick={() => setShowAddToTrip(true)}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-emerald-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-500/20 transition hover:bg-emerald-600 active:scale-95"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
              <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Agregar al viaje
          </button>
        </div>
      </motion.div>

      {/* Wizard de "agregar al viaje" — selector de día */}
      <AnimatePresence>
        {showAddToTrip && (
          <AddToTripWizard
            inspiration={inspiration}
            tripId={tripId}
            tripStartDate={tripStartDate}
            tripEndDate={tripEndDate}
            onClose={() => setShowAddToTrip(false)}
            onDone={onClose}
          />
        )}
      </AnimatePresence>
    </motion.div>,
    document.body,
  );
}

// --- Wizard para agregar la inspiración al viaje (selector de día) ---

function AddToTripWizard({
  inspiration,
  tripId,
  tripStartDate,
  tripEndDate,
  onClose,
  onDone,
}: {
  inspiration: Inspiration;
  tripId: string;
  tripStartDate?: string;
  tripEndDate?: string;
  onClose: () => void;
  onDone: () => void;
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
      onDone();
    } catch {
      toast.error("Error al crear el plan");
      setSubmitting(false);
    }
  };

  return createPortal(
    <motion.div
      className="fixed inset-0 z-[80] flex items-end sm:items-center sm:justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
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
              <div className="mb-4 grid max-h-48 grid-cols-3 gap-2 overflow-y-auto sm:grid-cols-4">
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
