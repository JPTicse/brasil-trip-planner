"use client";

import { motion } from "motion/react";
import { haptic } from "@/lib/haptics";

/**
 * EFFECT 3 — Droplet/bubble "water fill" day chip.
 *
 * The chip fills from the bottom up to `fillPercent` of its height with
 * semi-transparent emerald water. Small circular bubbles rise through
 * the water and the surface gently bobs, giving an organic, effervescent
 * feel. Used for days that are multiples of 3.
 *
 * Fill semantics: hours of activities scheduled that day vs the 16
 * available hours (8am–midnight). e.g. 10h booked → 62.5% filled.
 */
export function DayChipWater3({
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
  const d = new Date(day + "T00:00");
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(d);
  const clamped = Math.max(0, Math.min(100, fillPercent));

  // Bubble config: 4 bubbles with staggered horizontal positions & delays.
  const bubbles = [
    { left: "22%", delay: "0s", duration: "2.6s", size: "h-1.5 w-1.5" },
    { left: "55%", delay: "0.7s", duration: "3.1s", size: "h-1.5 w-1.5" },
    { left: "38%", delay: "1.4s", duration: "2.9s", size: "h-1 w-1" },
    { left: "72%", delay: "2.0s", duration: "3.4s", size: "h-1.5 w-1.5" },
  ];

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
        className={`relative flex h-14 w-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border ${
          isSelected
            ? "border-emerald-500 bg-white dark:bg-zinc-900"
            : "border-zinc-200 bg-white text-zinc-600 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-400"
        }`}
        aria-label={`Día ${dayNum}, ${clamped.toFixed(0)}% del día ocupado`}
      >
        {/* Water container: pinned to the bottom, grows on mount. */}
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 overflow-hidden"
          style={{ height: `${clamped}%` }}
        >
          <motion.div
            className="absolute inset-x-0 bottom-0"
            initial={{ height: "0%" }}
            animate={{ height: "100%" }}
            transition={{ duration: 0.8, ease: [0.34, 1.56, 0.64, 1] }}
          >
            {/* The water body with a vertical emerald gradient. */}
            <div
              className={`absolute inset-0 bg-gradient-to-b from-emerald-400/60 to-emerald-500/70 dark:from-emerald-400/50 dark:to-emerald-500/70 ${
                isSelected ? "from-emerald-400/80 to-emerald-500/90 dark:from-emerald-400/70 dark:to-emerald-500/90" : ""
              }`}
            />

            {/* Bobbing water surface (top edge of the water). */}
            <div
              className="absolute inset-x-0 top-0 h-1 bg-emerald-300/50 dark:bg-emerald-300/40"
              style={{ animation: "waterBob 2s ease-in-out infinite" }}
            />

            {/* Rising bubbles inside the water. */}
            {bubbles.map((b, i) => (
              <span
                key={i}
                className={`absolute bottom-0 rounded-full bg-white/30 dark:bg-white/20 ${
                  b.size
                } ${isSelected ? "bg-white/50 dark:bg-white/40" : ""}`}
                style={{
                  left: b.left,
                  animation: `bubbleRise ${b.duration} ease-in ${b.delay} infinite`,
                }}
              />
            ))}
          </motion.div>
        </div>

        {/* Today dot (top-right), emerald. */}
        {isToday && !isSelected && (
          <span className="absolute right-1 top-1 z-10 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        )}

        {/* Text content on top of the water. */}
        <span className="z-10 text-[10px] font-medium uppercase opacity-70">
          {weekday}
        </span>
        <span className="z-10 text-base font-bold leading-tight">{dayNum}</span>
      </motion.button>
    </>
  );
}

const keyframes = `
@keyframes bubbleRise {
  0% {
    transform: translateY(0) scale(0.6);
    opacity: 0;
  }
  15% {
    opacity: 1;
  }
  80% {
    opacity: 0.8;
  }
  100% {
    transform: translateY(-44px) scale(1);
    opacity: 0;
  }
}
@keyframes waterBob {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-2px);
  }
}
`;
