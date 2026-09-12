"use client";

import { useState } from "react";
import { ItineraryTimelineV2 } from "@/components/v2/itinerary-timeline-v2";
import { ItineraryMapV2 } from "@/components/v2/itinerary-map-v2";
import { ActivityCardV2 } from "@/components/v2/activity-card-v2";
import { type Activity } from "@/lib/types";

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
      <div className="flex gap-1 rounded-xl bg-stone-100 p-1 dark:bg-stone-800/50">
        {TABS.map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 rounded-lg py-2 text-sm font-medium transition ${
                isActive
                  ? "bg-white text-stone-900 shadow-sm dark:bg-stone-900 dark:text-stone-50"
                  : "text-stone-500 dark:text-stone-400"
              }`}
            >
              {t.label}
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
                  <span className="text-xs font-medium uppercase tracking-wider text-stone-400 dark:text-stone-500">
                    {new Intl.DateTimeFormat("es-ES", {
                      weekday: "long",
                      day: "numeric",
                      month: "short",
                    }).format(new Date(day + "T00:00"))}
                  </span>
                  <div className="h-px flex-1 bg-stone-100 dark:bg-stone-800" />
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
