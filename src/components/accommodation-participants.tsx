"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { joinAccommodation, leaveAccommodation, setAccommodationParticipants } from "@/lib/actions";
import { AnimatedActionButton } from "@/components/animated-action-button";
import { Modal } from "@/components/modal";
import { SubmitButton } from "@/components/submit-button";
import { formatDateShort } from "@/lib/format";
import type { Accommodation, Profile } from "@/lib/types";

export function JoinAccommodationButton({
  accommodation,
  tripId,
  isJoined,
  myAccommodations,
  className,
}: {
  accommodation: Accommodation;
  tripId: string;
  isJoined: boolean;
  myAccommodations: Accommodation[];
  className?: string;
}) {
  const [showConflict, setShowConflict] = useState(false);
  const conflicts = myAccommodations.filter(
    (candidate) =>
      candidate.id !== accommodation.id &&
      candidate.check_in &&
      candidate.check_out &&
      accommodation.check_in &&
      accommodation.check_out &&
      candidate.check_in < accommodation.check_out &&
      accommodation.check_in < candidate.check_out,
  );

  const handleJoinClick = (event: React.MouseEvent) => {
    if (isJoined || conflicts.length === 0) return;
    event.preventDefault();
    setShowConflict(true);
  };

  return (
    <>
      <div onClick={handleJoinClick}>
        <AnimatedActionButton
          action={isJoined ? leaveAccommodation : joinAccommodation}
          variant={isJoined ? "leave" : "join"}
          label={isJoined ? "En mi estancia — salir" : "Unirme"}
          fields={[
            { name: "accommodation_id", value: accommodation.id },
            { name: "trip_id", value: tripId },
          ]}
          className={className ?? "w-full py-2"}
        />
      </div>

      <Modal open={showConflict} onClose={() => setShowConflict(false)} zIndex={90}>
        <div className="px-5 pb-5 pt-2">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
            <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 9v2m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4a2 2 0 00-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h3 className="text-center text-base font-bold text-zinc-900 dark:text-zinc-100">
            Fechas de alojamiento solapadas
          </h3>
          <p className="mt-1 text-center text-sm text-zinc-500 dark:text-zinc-400">
            Ya estás unido a {conflicts.length === 1 ? "otro alojamiento" : "otros alojamientos"} durante estas fechas.
          </p>
          <div className="mt-3 space-y-2">
            {conflicts.map((conflict) => (
              <div key={conflict.id} className="rounded-xl border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-800 dark:bg-zinc-800/50">
                <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{conflict.name}</p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatDateShort(conflict.check_in)} → {formatDateShort(conflict.check_out)}
                </p>
              </div>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <button
              type="button"
              onClick={() => setShowConflict(false)}
              className="flex-1 rounded-xl border border-zinc-200 py-3 text-sm font-semibold text-zinc-700 dark:border-zinc-700 dark:text-zinc-200"
            >
              Cancelar
            </button>
            <form action={joinAccommodation} className="flex flex-1">
              <input type="hidden" name="accommodation_id" value={accommodation.id} />
              <input type="hidden" name="trip_id" value={tripId} />
              <button type="submit" className="w-full rounded-xl bg-amber-500 py-3 text-sm font-semibold text-white">
                Unirme igual
              </button>
            </form>
          </div>
        </div>
      </Modal>
    </>
  );
}

export function ManageAccommodationParticipants({
  accommodation,
  members,
}: {
  accommodation: Accommodation;
  members: Profile[];
}) {
  const router = useRouter();
  const participantIds = accommodation.participants?.map((participant) => participant.user_id) ?? [];
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string[]>(participantIds);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openModal = () => {
    setSelected(participantIds);
    setError(null);
    setOpen(true);
  };

  const toggleMember = (userId: string) => {
    setSelected((current) =>
      current.includes(userId)
        ? current.filter((id) => id !== userId)
        : [...current, userId],
    );
  };

  const handleSubmit = async (formData: FormData) => {
    setPending(true);
    setError(null);
    formData.set("user_ids", JSON.stringify(selected));
    try {
      await setAccommodationParticipants(formData);
      setOpen(false);
      router.refresh();
      toast.success("Personas del alojamiento actualizadas");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "No se pudo actualizar");
    } finally {
      setPending(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={openModal}
        className="flex items-center gap-1 rounded-lg bg-zinc-100 px-2 py-1 text-[10px] font-semibold text-zinc-600 transition hover:bg-zinc-200 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8}>
          <path d="M16 21v-2a4 4 0 00-4-4H6a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zM22 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Gestionar personas
      </button>

      <Modal open={open} onClose={() => setOpen(false)} zIndex={70}>
        <div className="flex items-center justify-between px-5 pb-2">
          <div>
            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Personas alojadas</h3>
            <p className="max-w-[260px] truncate text-[11px] text-zinc-400">{accommodation.name}</p>
          </div>
          <button type="button" onClick={() => setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <form action={handleSubmit} className="space-y-3 px-5 pb-5">
          <input type="hidden" name="accommodation_id" value={accommodation.id} />
          <input type="hidden" name="trip_id" value={accommodation.trip_id} />
          <div className="max-h-[50dvh] space-y-2 overflow-y-auto">
            {members.map((member) => {
              const checked = selected.includes(member.id);
              const initials = (member.name ?? "Usuario")
                .split(" ")
                .map((part) => part[0])
                .slice(0, 2)
                .join("")
                .toUpperCase();
              return (
                <label key={member.id} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${checked ? "border-emerald-300 bg-emerald-50 dark:border-emerald-700 dark:bg-emerald-900/20" : "border-zinc-200 dark:border-zinc-700"}`}>
                  <input type="checkbox" checked={checked} onChange={() => toggleMember(member.id)} className="h-4 w-4 accent-emerald-600" />
                  <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-zinc-400 text-[10px] font-bold text-white">
                    {member.avatar_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={member.avatar_url} alt="" className="h-full w-full object-cover" />
                    ) : initials}
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-zinc-800 dark:text-zinc-100">
                    {member.name ?? "Usuario"}
                  </span>
                  {checked && (
                    <svg className="h-4 w-4 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                      <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </label>
              );
            })}
          </div>

          {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-600 dark:bg-red-900/20 dark:text-red-400">{error}</p>}

          <div className="flex gap-2 border-t border-zinc-100 pt-3 dark:border-zinc-800">
            <SubmitButton pending={pending} className="flex-1">Guardar personas</SubmitButton>
            <button type="button" onClick={() => setOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-3 text-sm font-medium text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
              Cancelar
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}
