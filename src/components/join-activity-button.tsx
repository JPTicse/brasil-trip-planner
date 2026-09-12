"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { joinActivity, leaveActivity } from "@/lib/actions";
import { detectConflicts } from "@/lib/conflicts";
import { formatTime } from "@/lib/format";
import { ACTIVITY_TYPE_LABELS, type Activity } from "@/lib/types";
import { AnimatedActionButton } from "@/components/animated-action-button";

const TYPE_EMOJI: Record<string, string> = {
  visit: "👀",
  tour: "🚌",
  meal: "🍽️",
  event: "🎉",
  free: "🌿",
  transport: "✈️",
};

export function JoinActivityButton({
  activity,
  tripId,
  isJoined,
  myActivities,
  className,
}: {
  activity: Activity;
  tripId: string;
  isJoined: boolean;
  myActivities?: Activity[];
  className?: string;
}) {
  const [showConflict, setShowConflict] = useState(false);
  const [conflicts, setConflicts] = useState<Activity[]>([]);

  const handleJoinClick = (e: React.MouseEvent) => {
    if (isJoined) return; // salir no necesita conflicto
    const found = detectConflicts(activity, myActivities ?? []);
    if (found.length > 0) {
      e.preventDefault();
      setConflicts(found);
      setShowConflict(true);
    }
  };

  return (
    <>
      <div onClick={handleJoinClick}>
        <AnimatedActionButton
          action={isJoined ? leaveActivity : joinActivity}
          variant={isJoined ? "leave" : "join"}
          label={isJoined ? "Unido — salir" : "Unirme"}
          fields={[
            { name: "activity_id", value: activity.id },
            { name: "trip_id", value: tripId },
          ]}
          className={className ?? "w-full py-3"}
        />
      </div>

      {showConflict && createPortal(
        <div
          className="fixed inset-0 flex items-end justify-center sm:items-center"
          style={{ zIndex: 90 }}
        >
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/70"
            onPointerDown={(e) => {
              if (e.target === e.currentTarget) setShowConflict(false);
            }}
          />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-3xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-300 dark:bg-zinc-700" />
            </div>
            <div className="px-5 pb-5 pt-2">
              <div className="mb-3 flex justify-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
                  <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>
              <h3 className="text-center text-base font-bold text-zinc-900 dark:text-zinc-100">
                Se solapa con otros planes
              </h3>
              <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
                Tienes {conflicts.length} {conflicts.length === 1 ? "plan" : "planes"} a la misma hora:
              </p>

              <div className="mt-3 space-y-2">
                {conflicts.map((c) => (
                  <div key={c.id} className="flex items-center gap-2.5 rounded-xl border border-zinc-100 bg-zinc-50 p-2.5 dark:border-zinc-800 dark:bg-zinc-800/50">
                    <span className="text-lg">{TYPE_EMOJI[c.type] ?? "👀"}</span>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{c.title}</p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {c.start_time ? formatTime(c.start_time) : ""}{c.end_time ? ` – ${formatTime(c.end_time)}` : ""}
                        {c.location ? ` · ${c.location}` : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-5 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowConflict(false)}
                  className="flex-1 rounded-xl border border-zinc-200 bg-white py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
                >
                  Cancelar
                </button>
                <form
                  action={joinActivity}
                  className="flex flex-1"
                >
                  <input type="hidden" name="activity_id" value={activity.id} />
                  <input type="hidden" name="trip_id" value={tripId} />
                  <button
                    type="submit"
                    onClick={() => setShowConflict(false)}
                    className="flex w-full items-center justify-center rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-amber-600 active:scale-95"
                  >
                    Unirme igual
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
