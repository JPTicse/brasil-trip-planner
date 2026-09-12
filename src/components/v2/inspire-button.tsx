"use client";

import { useState } from "react";
import { InspireModal } from "@/components/v2/inspire-modal";
import type { Inspiration } from "@/lib/types";

export function InspireButton({
  inspirations,
  tripId,
  tripDestination,
  tripStartDate,
  tripEndDate,
}: {
  inspirations: Inspiration[];
  tripId: string;
  tripDestination: string;
  tripStartDate?: string;
  tripEndDate?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-violet-300 hover:bg-violet-50 active:scale-95 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-700 dark:hover:bg-violet-900/20"
      >
        <span className="text-sm">✨</span>
        Inspirar
      </button>

      <InspireModal
        open={open}
        onClose={() => setOpen(false)}
        inspirations={inspirations}
        tripId={tripId}
        tripDestination={tripDestination}
        tripStartDate={tripStartDate}
        tripEndDate={tripEndDate}
      />
    </>
  );
}
