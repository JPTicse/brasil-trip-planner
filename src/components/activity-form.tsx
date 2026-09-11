"use client";

import { useState, useCallback } from "react";
import { NewActivityWizard } from "@/components/new-activity-wizard";

export function ActivityForm({
  tripId,
  tripDestination,
  tripStartDate,
  tripEndDate,
}: {
  tripId: string;
  tripDestination?: string;
  tripStartDate?: string;
  tripEndDate?: string;
}) {
  const [open, setOpen] = useState(false);

  const handleOpen = useCallback(() => {
    document.body.setAttribute("data-pause-polling", "true");
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    document.body.setAttribute("data-pause-polling", "false");
    setOpen(false);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 transition hover:scale-110 active:scale-95"
        aria-label="Nuevo plan"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md max-h-[88dvh] rounded-t-3xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            <NewActivityWizard
              tripId={tripId}
              tripDestination={tripDestination ?? "Brasil"}
              tripStartDate={tripStartDate}
              tripEndDate={tripEndDate}
              onClose={handleClose}
            />
          </div>
        </>
      )}
    </>
  );
}
