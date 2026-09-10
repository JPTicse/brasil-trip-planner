"use client";

import { useActionState, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createExpense } from "@/lib/actions";
import { Field, TextInput, Select } from "@/components/ui";
import { SubmitButton } from "@/components/submit-button";
import { CURRENCIES, EXPENSE_CATEGORY_LABELS, type Profile } from "@/lib/types";

export function ExpenseForm({
  tripId,
  members,
  currentUserId,
}: {
  tripId: string;
  members: Profile[];
  currentUserId: string;
}) {
  const [open, setOpen] = useState(false);

  // Otros miembros (excluyendo al usuario actual para evitar duplicado "Yo")
  const otherMembers = members.filter((m) => m.id !== currentUserId);

  const handleSuccess = useCallback(() => {
    setOpen(false);
  }, []);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-emerald-300 bg-emerald-50/50 py-3 text-sm font-medium text-emerald-700 transition hover:bg-emerald-50 active:scale-[0.98]"
      >
        <PlusIcon /> Añadir gasto
      </button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />

      {/* Bottom sheet modal */}
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl animate-in slide-in-from-bottom">
        {/* Handle bar */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-zinc-200" />
        </div>

        <div className="flex items-center justify-between px-5 pb-2">
          <h3 className="text-base font-bold text-zinc-900">Nuevo gasto</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <ExpenseFormInner
          tripId={tripId}
          otherMembers={otherMembers}
          onSuccess={handleSuccess}
        />
      </div>
    </>
  );
}

function ExpenseFormInner({
  tripId,
  otherMembers,
  onSuccess,
}: {
  tripId: string;
  otherMembers: Profile[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [state, formAction] = useActionState(
    async (_prev: string | null, formData: FormData) => {
      try {
        await createExpense(formData);
        return null;
      } catch (e) {
        return e instanceof Error ? e.message : "Error al crear gasto";
      }
    },
    null,
  );

  // Cerrar modal automáticamente cuando el gasto se crea con éxito
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (submitted && state === null) {
      // Refrescar datos del servidor antes de cerrar
      router.refresh();
      onSuccess();
    }
  }, [submitted, state, onSuccess, router]);

  return (
    <form
      action={(formData) => {
        setSubmitted(true);
        formAction(formData);
      }}
      className="max-h-[70vh] space-y-3 overflow-y-auto px-5 pb-6 pt-1"
    >
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="split_mode" value="equal" />

      <Field label="Descripción *">
        <TextInput name="description" required placeholder="Ej: Cena en rodizio" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Importe *">
          <TextInput name="amount" type="number" step="0.01" required placeholder="0.00" />
        </Field>
        <Field label="Moneda">
          <Select name="currency" defaultValue="BRL">
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </Field>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Pagado por">
          <Select name="paid_by" defaultValue="">
            <option value="">Yo</option>
            {otherMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.name ?? "Usuario"}</option>
            ))}
          </Select>
        </Field>
        <Field label="Categoría">
          <Select name="category" defaultValue="other">
            {Object.entries(EXPENSE_CATEGORY_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Fecha">
        <TextInput name="date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} />
      </Field>

      <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
        💡 El gasto se repartirá a partes iguales entre todos los miembros del viaje.
      </div>

      {state && (
        <p className="text-sm text-red-600">{state}</p>
      )}

      <SubmitButton className="w-full">Añadir gasto</SubmitButton>
    </form>
  );
}

function PlusIcon() {
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
      <path d="M12 5v14M5 12h14" strokeLinecap="round" />
    </svg>
  );
}
