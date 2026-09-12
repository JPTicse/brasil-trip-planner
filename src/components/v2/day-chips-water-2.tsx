"use client";

import { motion } from "motion/react";
import { haptic } from "@/lib/haptics";

const SEGMENTS = 8;
const SEGMENT_PERCENT = 100 / SEGMENTS; // 12.5

const SHIMMER_CSS = `
@keyframes water2-shimmer {
  0% { transform: translateX(-100%); }
  100% { transform: translateX(100%); }
}
.water2-shimmer {
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.25) 50%,
    transparent 100%
  );
  animation: water2-shimmer 2.5s ease-in-out infinite;
}
`;

/**
 * EFFECT 2 — Stepped block fill.
 *
 * The chip is divided into 8 horizontal segments (each = 2 hours of the
 * 16-hour day window from 8am to midnight). Filled segments are emerald
 * and animate in bottom-to-top with a stagger. Each filled segment has a
 * subtle shimmer. 1px gaps between segments create a "battery level" look.
 */
export function DayChipWater2({
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
  const filledSegments = Math.round(fillPercent / SEGMENT_PERCENT);
  const d = new Date(day + "T00:00");
  const weekday = new Intl.DateTimeFormat("es-ES", { weekday: "short" }).format(d);

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: SHIMMER_CSS }} />
      <motion.button
        onClick={() => {
          haptic("light");
          onSelect();
        }}
        animate={{ scale: isSelected ? 1.06 : 1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ type: "spring", stiffness: 500, damping: 14, mass: 0.6 }}
        className={`relative flex h-14 w-12 shrink-0 flex-col items-center justify-center overflow-hidden rounded-lg border bg-white dark:bg-zinc-900 ${
          isSelected
            ? "border-zinc-900 dark:border-white"
            : "border-zinc-200 dark:border-zinc-800"
        }`}
      >
        {/* Stepped block fill segments (stacked bottom-to-top) */}
        <div
          key={filledSegments}
          className="absolute inset-0 flex flex-col-reverse gap-px"
        >
          {Array.from({ length: SEGMENTS }).map((_, i) => {
            const isFilled = i < filledSegments;
            return (
              <div
                key={i}
                className="relative flex-1 overflow-hidden bg-zinc-100 dark:bg-zinc-800/30"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: isFilled ? 1 : 0 }}
                  transition={{
                    delay: i * 0.08,
                    duration: 0.3,
                    ease: "easeOut",
                  }}
                  className={`absolute inset-0 ${
                    isSelected
                      ? "bg-emerald-500/90 dark:bg-emerald-500/80"
                      : "bg-emerald-500/70 dark:bg-emerald-400/60"
                  }`}
                >
                  <div className="water2-shimmer absolute inset-0" />
                </motion.div>
              </div>
            );
          })}
        </div>

        {/* Today dot */}
        {isToday && !isSelected && (
          <span className="absolute right-1 top-1 z-10 h-1.5 w-1.5 rounded-full bg-emerald-500" />
        )}

        {/* Text overlay */}
        <div className="relative z-10 flex flex-col items-center">
          <span
            className={`text-[10px] font-medium uppercase opacity-70 ${
              isSelected ? "text-white" : "text-zinc-700 dark:text-zinc-200"
            }`}
          >
            {weekday}
          </span>
          <span
            className={`text-base font-bold leading-tight ${
              isSelected ? "text-white" : "text-zinc-800 dark:text-zinc-100"
            }`}
          >
            {dayNum}
          </span>
        </div>
      </motion.button>
    </>
  );
}
