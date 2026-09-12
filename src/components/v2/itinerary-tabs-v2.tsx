"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ItineraryTimelineV2 } from "@/components/v2/itinerary-timeline-v2";
import { ItineraryMapV2 } from "@/components/v2/itinerary-map-v2";
import { ActivityCardV2 } from "@/components/v2/activity-card-v2";
import { type Activity } from "@/lib/types";
import { haptic } from "@/lib/haptics";

type Tab = "day" | "map" | "list";

const TABS: { id: Tab; label: string }[] = [
  { id: "day", label: "Día" },
  { id: "map", label: "Mapa" },
  { id: "list", label: "Lista" },
];

function getDefaultDay(days: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  return days.includes(today) ? today : (days.length > 0 ? days[0] : "");
}

export function ItineraryTabsV2({
  activities,
  tripId,
  currentUserId,
  days,
}: {
  activities: Activity[];
  tripId: string;
  currentUserId: string;
  days: string[];
}) {
  const [tab, setTab] = useState<Tab>("day");
  const [selectedDay, setSelectedDay] = useState<string>(getDefaultDay(days));

  return (
    <div className="space-y-4">
      {/* Toggle de vistas — solo texto, sin iconos */}
      <div className="flex gap-1 rounded-xl border border-zinc-200 bg-zinc-100 p-1 dark:border-zinc-700 dark:bg-zinc-900">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                haptic("light");
                setTab(t.id);
              }}
              className={`relative flex-1 rounded-lg py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "text-emerald-600 dark:text-emerald-400"
                  : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-100"
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="activeTabIndicator"
                  className="absolute inset-0 rounded-lg bg-white shadow-sm dark:bg-zinc-800"
                  transition={{ type: "spring", stiffness: 400, damping: 32 }}
                />
              )}
              <span className="relative z-10">{t.label}</span>
            </button>
          );
        })}
      </div>

      {tab === "day" && (
        <ItineraryTimelineV2
          activities={activities}
          tripId={tripId}
          currentUserId={currentUserId}
          days={days}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      {tab === "map" && (
        <ItineraryMapV2
          activities={activities}
          tripId={tripId}
          currentUserId={currentUserId}
          days={days}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      {tab === "list" && (
        <div className="space-y-6">
          {days.map((day) => {
            const dayActivities = activities.filter((a) => a.date === day);
            if (dayActivities.length === 0) return null;
            return (
              <div key={day} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
                    {new Intl.DateTimeFormat("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    }).format(new Date(day + "T00:00"))}
                  </span>
                  <div className="h-px flex-1 bg-zinc-100 dark:bg-zinc-800" />
                </div>
                <div className="space-y-3">
                  {dayActivities.map((a) => (
                    <ActivityCardV2
                      key={a.id}
                      activity={a}
                      tripId={tripId}
                      currentUserId={currentUserId}
                      myActivities={activities}
                    />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
