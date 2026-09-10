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
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl">
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
          allMembers={members}
          otherMembers={otherMembers}
          onSuccess={handleSuccess}
        />
      </div>
    </>
  );
}

function ExpenseFormInner({
  tripId,
  allMembers,
  otherMembers,
  onSuccess,
}: {
  tripId: string;
  allMembers: Profile[];
  otherMembers: Profile[];
  onSuccess: () => void;
}) {
  const router = useRouter();
  const [splitMode, setSplitMode] = useState<"equal" | "custom">("equal");
  const [amount, setAmount] = useState("");
  const [customAmounts, setCustomAmounts] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

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

  useEffect(() => {
    if (submitted && state === null) {
      router.refresh();
      onSuccess();
    }
  }, [submitted, state, onSuccess, router]);

  const totalAmount = parseFloat(amount) || 0;
  const customSum = allMembers.reduce(
    (sum, m) => sum + (parseFloat(customAmounts[m.id] || "0") || 0),
    0,
  );
  const remaining = Math.round((totalAmount - customSum) * 100) / 100;
  const customValid = Math.abs(remaining) < 0.01 && totalAmount > 0;

  // Distribuir equitativamente cuando se cambia a custom
  const fillEqual = () => {
    if (totalAmount <= 0 || allMembers.length === 0) return;
    const per = Math.round((totalAmount / allMembers.length) * 100) / 100;
    const amounts: Record<string, string> = {};
    allMembers.forEach((m, i) => {
      // El último absorbe el redondeo
      if (i === allMembers.length - 1) {
        amounts[m.id] = (Math.round((totalAmount - per * (allMembers.length - 1)) * 100) / 100).toString();
      } else {
        amounts[m.id] = per.toString();
      }
    });
    setCustomAmounts(amounts);
  };

  return (
    <form
      action={(formData) => {
        if (splitMode === "custom" && !customValid) return;
        setSubmitted(true);
        formAction(formData);
      }}
      className="max-h-[70vh] space-y-3 overflow-y-auto px-5 pb-6 pt-1"
    >
      <input type="hidden" name="trip_id" value={tripId} />
      <input type="hidden" name="split_mode" value={splitMode} />

      <Field label="Descripción *">
        <TextInput name="description" required placeholder="Ej: Cena en rodizio" />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Importe *">
          <TextInput
            name="amount"
            type="number"
            step="0.01"
            required
            placeholder="0.00"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
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

      {/* Selector de modo de reparto */}
      <div>
        <p className="mb-1.5 text-xs font-medium text-zinc-600">Reparto</p>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setSplitMode("equal")}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              splitMode === "equal"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M12 4v16M4 12h16" strokeLinecap="round" />
            </svg>
            Dividir igual
          </button>
          <button
            type="button"
            onClick={() => {
              setSplitMode("custom");
              if (Object.keys(customAmounts).length === 0) fillEqual();
            }}
            className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition ${
              splitMode === "custom"
                ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                : "border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
            }`}
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
            </svg>
            Personalizado
          </button>
        </div>
      </div>

      {/* Reparto personalizado */}
      {splitMode === "custom" && (
        <div className="space-y-2 rounded-lg bg-zinc-50 p-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-zinc-600">Asignar a cada persona</p>
            <button
              type="button"
              onClick={fillEqual}
              className="text-[10px] font-medium text-emerald-600 hover:text-emerald-700"
            >
              Repartir igual
            </button>
          </div>

          {allMembers.map((m) => {
            const name = m.name ?? "Usuario";
            const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
            return (
              <div key={m.id} className="flex items-center gap-2">
                <div className="flex h-7 w-7 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-[9px] font-semibold text-white">
                  {m.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={m.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials
                  )}
                </div>
                <span className="flex-1 truncate text-xs text-zinc-700">{name}</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={customAmounts[m.id] || ""}
                  onChange={(e) => setCustomAmounts({ ...customAmounts, [m.id]: e.target.value })}
                  name={`split_${m.id}`}
                  className="w-20 rounded-lg border border-zinc-200 px-2 py-1 text-right text-xs text-zinc-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            );
          })}

          {/* Barra de progreso / validación */}
          <div className={`mt-2 flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium ${
            customValid
              ? "bg-emerald-100 text-emerald-700"
              : remaining > 0
                ? "bg-amber-100 text-amber-700"
                : "bg-red-100 text-red-700"
          }`}>
            <span>
              {customValid
                ? "✓ Cuadra con el total"
                : remaining > 0
                  ? `Falta: ${remaining.toFixed(2)}`
                  : `Sobra: ${Math.abs(remaining).toFixed(2)}`}
            </span>
            <span>
              {customSum.toFixed(2)} / {totalAmount.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {/* Info para modo equal */}
      {splitMode === "equal" && (
        <div className="rounded-lg bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
          💡 El gasto se repartirá a partes iguales entre todos los miembros ({allMembers.length}).
        </div>
      )}

      {state && (
        <p className="text-sm text-red-600">{state}</p>
      )}

      <SubmitButton
        className={`w-full ${splitMode === "custom" && !customValid ? "opacity-50" : ""}`}
      >
        {splitMode === "custom" && !customValid
          ? "Los montos no cuadran"
          : "Añadir gasto"}
      </SubmitButton>
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
