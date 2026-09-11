"use client";

import { useState, useCallback, useEffect } from "react";
import { NewActivityWizard } from "@/components/new-activity-wizard";
import { useDockVisible } from "@/components/use-dock-visible";

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
  const dockVisible = useDockVisible();

  const handleOpen = useCallback(() => {
    document.body.setAttribute("data-pause-polling", "true");
    document.body.style.overflow = "hidden";
    document.body.style.position = "fixed";
    document.body.style.inset = "0";
    setOpen(true);
  }, []);

  const handleClose = useCallback(() => {
    document.body.setAttribute("data-pause-polling", "false");
    document.body.style.overflow = "";
    document.body.style.position = "";
    document.body.style.inset = "";
    setOpen(false);
  }, []);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.inset = "";
    };
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        className={`fixed right-6 z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
          dockVisible ? "bottom-20" : "bottom-6"
        }`}
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
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto flex max-h-[88dvh] max-w-md flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl dark:bg-zinc-900">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200 dark:bg-zinc-700" />
            </div>
            <div className="flex-1 overflow-y-auto overscroll-contain">
              <NewActivityWizard
                tripId={tripId}
                tripDestination={tripDestination ?? "Brasil"}
                tripStartDate={tripStartDate}
                tripEndDate={tripEndDate}
                onClose={handleClose}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
