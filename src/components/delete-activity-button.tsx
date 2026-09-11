"use client";

import { deleteActivity } from "@/lib/actions";
import { ConfirmButton } from "@/components/confirm-button";
import type { Activity } from "@/lib/types";

export function DeleteActivityButton({
  activity,
  tripId,
  className = "",
  children,
}: {
  activity: Activity;
  tripId: string;
  className?: string;
  children: React.ReactNode;
}) {
  const participants = activity.participants ?? [];
  const count = participants.length;

  const message = count > 0
    ? `Se eliminará del itinerario de ${count} ${count === 1 ? "persona" : "personas"} que ya se unieron.`
    : "Se eliminará del itinerario.";

  const detail = count > 0 ? (
    <div className="space-y-2">
      <p className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
        Participantes unidos:
      </p>
      <div className="flex flex-wrap items-center gap-2">
        {participants.slice(0, 6).map((p) => (
          <div key={p.user_id} className="flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white px-2 py-1 dark:border-zinc-700 dark:bg-zinc-900">
            <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100 text-[10px] font-bold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
              {(p.profile?.name ?? "?").charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[80px] truncate text-xs text-zinc-700 dark:text-zinc-300">
              {p.profile?.name ?? "Miembro"}
            </span>
          </div>
        ))}
        {participants.length > 6 && (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">+{participants.length - 6} más</span>
        )}
      </div>
    </div>
  ) : null;

  return (
    <ConfirmButton
      action={deleteActivity}
      fields={[
        { name: "activity_id", value: activity.id },
        { name: "trip_id", value: tripId },
      ]}
      confirmTitle={`¿Eliminar "${activity.title}"?`}
      confirmMessage={message}
      confirmLabel="Eliminar"
      variant="danger"
      className={className}
      detail={detail}
    >
      {children}
    </ConfirmButton>
  );
}
