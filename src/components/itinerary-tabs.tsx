"use client";

import { useState } from "react";
import { ItineraryTimeline } from "@/components/itinerary-timeline";
import { ItineraryMap } from "@/components/itinerary-map";
import { ActivityCard } from "@/components/activity-card";
import { type Activity } from "@/lib/types";

type Tab = "day" | "map" | "list";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "day", label: "Día", icon: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" },
  { id: "map", label: "Mapa", icon: "M9 20l-5.4-2.7A1 1 0 013 16.4V5.6a1 1 0 011.4-.9L9 7m0 13V7m0 13l6-3m0-10v10m0-10l5.4-2.7A1 1 0 0121 4.6v10.8a1 1 0 01-.6.9L15 18m-6-11l6-3" },
  { id: "list", label: "Lista", icon: "M4 6h16M4 12h16M4 18h16" },
];

// Defaultear a hoy si está dentro del viaje
function getDefaultDay(days: string[]): string {
  const today = new Date().toISOString().slice(0, 10);
  return days.includes(today) ? today : (days.length > 0 ? days[0] : "");
}

export function ItineraryTabs({
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
    <div className="space-y-3">
      {/* Toggle de vistas */}
      <div className="flex gap-1 rounded-xl bg-zinc-100 p-1 dark:bg-zinc-800">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold transition ${
                isActive
                  ? "bg-white text-emerald-600 shadow-sm dark:bg-zinc-900 dark:text-emerald-400"
                  : "text-zinc-500 dark:text-zinc-400"
              }`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d={t.icon} strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Contenido según tab */}
      {tab === "day" && (
        <ItineraryTimeline
          activities={activities}
          tripId={tripId}
          currentUserId={currentUserId}
          days={days}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      {tab === "map" && (
        <ItineraryMap
          activities={activities}
          tripId={tripId}
          currentUserId={currentUserId}
          days={days}
          selectedDay={selectedDay}
          onSelectDay={setSelectedDay}
        />
      )}

      {tab === "list" && (
        <div className="space-y-4">
          {days.map((day) => {
            const dayActivities = activities.filter((a) => a.date === day);
            if (dayActivities.length === 0) return null;
            return (
              <div key={day} className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="flex h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  <span className="text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-300">
                    {new Intl.DateTimeFormat("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    }).format(new Date(day + "T00:00"))}
                  </span>
                  <div className="ml-2 h-px flex-1 bg-zinc-100 dark:bg-zinc-700" />
                </div>
                <div className="space-y-2">
                  {dayActivities.map((a) => (
                    <ActivityCard
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
