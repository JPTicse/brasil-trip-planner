"use client";

import { useState } from "react";
import { NewActivityWizard } from "@/components/new-activity-wizard";
import { useDockVisible } from "@/components/use-dock-visible";
import { Modal } from "@/components/modal";

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

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`fixed right-6 z-[45] flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500 text-white shadow-xl shadow-emerald-500/30 transition-all duration-300 hover:scale-110 active:scale-95 ${
          dockVisible ? "bottom-20" : "bottom-6"
        }`}
        aria-label="Nuevo plan"
      >
        <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <Modal open={open} onClose={() => setOpen(false)} zIndex={50}>
        <NewActivityWizard
          tripId={tripId}
          tripDestination={tripDestination ?? "Brasil"}
          tripStartDate={tripStartDate}
          tripEndDate={tripEndDate}
          onClose={() => setOpen(false)}
        />
      </Modal>
    </>
  );
}
