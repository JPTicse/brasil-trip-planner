"use client";

import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { haptic } from "@/lib/haptics";

/**
 * EFFECT 1 — Smooth continuous wave fill.
 *
 * A single day chip where emerald "water" rises from the bottom to the
 * fill percentage (hours booked vs 16h available). The liquid surface is
 * made of two overlapping wave layers that translate horizontally at
 * different speeds, producing a gentle, continuous oscillation.
 *
 * Intended for days that are multiples of 1 (every day).
 */
export function DayChipWater1({
  day,
  dayNum,
  isSelected,
  isToday,
  fillPercent,
  onSelect,
}: {
  day: string;
  dayNum: number;
  isSelected: boolean;
  isToday: boolean;
  fillPercent: number;
  onSelect: () => void;
}) {
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(
    new Date(day + "T00:00"),
  );

  // Animate the fill rising from 0 → fillPercent on mount (0.6s ease-out).
  const [mountedFill, setMountedFill] = useState(0);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMountedFill(fillPercent));
    return () => cancelAnimationFrame(raf);
  }, [fillPercent]);

  const clamped = Math.max(0, Math.min(100, mountedFill));

  return (
    <>
      <style>{keyframes}</style>
      <motion.button
        onClick={() => {
          haptic("light");
          onSelect();
        }}
        animate={{ scale: isSelected ? 1.06 : 1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 14, mass: 0.6 }}
        className={`dcw1-chip relative flex h-14 w-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border ${
          isSelected
            ? "border-emerald-500/60 bg-white dark:border-emerald-400/60 dark:bg-zinc-900"
            : "border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900"
        }`}
      >
        {/* Water container: fills from the bottom up to fillPercent% of chip height. */}
        <div
          className="dcw1-water absolute inset-x-0 bottom-0"
          style={{
            height: `${clamped}%`,
            transition: "height 0.6s cubic-bezier(0.22, 1, 0.36, 1)",
          }}
          aria-hidden
        >
          {/* Water body gradient. More vibrant (less transparent) when selected. */}
          <div
            className={`absolute inset-0 bg-gradient-to-b from-emerald-400/50 to-emerald-500/70 dark:from-emerald-400/60 dark:to-emerald-500/80 ${
              isSelected ? "from-emerald-400/80 to-emerald-500/90 dark:from-emerald-400/80 dark:to-emerald-500/95" : ""
            }`}
          />

          {/* Wave layer 1 — slower, slightly lower amplitude. */}
          <div className="dcw1-wave dcw1-wave-1">
            <WaveSvg />
          </div>

          {/* Wave layer 2 — faster, offset phase, creates overlapping ripples. */}
          <div className="dcw1-wave dcw1-wave-2">
            <WaveSvg />
          </div>
        </div>

        {/* Today dot — emerald, top-right, above the water. */}
        {isToday && (
          <span className="absolute right-1 top-1 z-10 h-1.5 w-1.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-zinc-900" />
        )}

        {/* Text on top of the water. */}
        <span
          className={`z-10 text-[10px] font-medium uppercase ${
            isSelected
              ? "text-emerald-700 dark:text-emerald-300"
              : "text-zinc-600 dark:text-zinc-400"
          }`}
        >
          {weekday}
        </span>
        <span
          className={`z-10 text-base font-bold leading-tight ${
            isSelected
              ? "text-emerald-800 dark:text-emerald-200"
              : "text-zinc-800 dark:text-zinc-200"
          }`}
        >
          {dayNum}
        </span>
      </motion.button>
    </>
  );
}

/** Inline SVG wave used by both wave layers. A smooth sine-like curve. */
function WaveSvg() {
  return (
    <svg
      viewBox="0 0 200 20"
      preserveAspectRatio="none"
      className="h-full w-full"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M0 10 C 25 18, 50 2, 100 10 C 150 18, 175 2, 200 10 L200 20 L0 20 Z"
        className="fill-emerald-400/40 dark:fill-emerald-400/50"
      />
    </svg>
  );
}

const keyframes = `
.dcw1-wave {
  position: absolute;
  left: 0;
  right: 0;
  top: -8px;
  height: 16px;
  width: 200%;
  pointer-events: none;
}
.dcw1-wave-1 {
  animation: dcw1-wave-translate 5s ease-in-out infinite;
  opacity: 0.7;
}
.dcw1-wave-2 {
  animation: dcw1-wave-translate 3.2s ease-in-out infinite reverse;
  opacity: 0.5;
  top: -6px;
}
@keyframes dcw1-wave-translate {
  0%   { transform: translateX(0); }
  50%  { transform: translateX(-50%); }
  100% { transform: translateX(0); }
}
@media (prefers-reduced-motion: reduce) {
  .dcw1-wave-1, .dcw1-wave-2 { animation: none; }
}
`;
