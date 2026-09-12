"use client";

import { useState } from "react";
import { toggleSplitSettled } from "@/lib/actions";
import { formatCurrency } from "@/lib/format";
import type { Expense, Profile } from "@/lib/types";
import { Modal } from "@/components/modal";

const CATEGORY_ICON: Record<string, string> = {
  food: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  transport: "M4 16l2-6h12l2 6M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M4 16h16M18 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3",
  accommodation: "M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6M9 11h.01M15 11h.01",
  activity: "M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2M4 8h16M4 8v10a2 2 0 002 2h12a2 2 0 002-2V8M8 12h8M8 16h5",
  other: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
};

export function ExpenseDetailModal({
  expense,
  tripId,
  currentUserId,
  trigger,
}: {
  expense: Expense;
  tripId: string;
  currentUserId: string;
  trigger: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const allSplits = expense.splits ?? [];
  const isPayer = expense.paid_by === currentUserId;
  const settledCount = allSplits.filter((s) => s.settled).length;
  const allSettled = allSplits.length > 0 && settledCount === allSplits.length;

  // Ordenar: pagador primero, luego pendientes, luego saldados
  const splits = [...allSplits].sort((a, b) => {
    if (a.user_id === expense.paid_by) return -1;
    if (b.user_id === expense.paid_by) return 1;
    if (a.settled !== b.settled) return a.settled ? 1 : -1;
    return 0;
  });

  return (
    <>
      <div
        onClick={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button, a, [role='button'], input, select, textarea, form")) return;
          setOpen(true);
        }}
      >
        {trigger}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} zIndex={50}>
        <div className="flex shrink-0 items-center justify-between px-5 pb-2">
          <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Detalle del gasto</h3>
          <button
            onClick={() => setOpen(false)}
            className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100 dark:text-zinc-500 dark:hover:bg-zinc-800"
          >
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-6">
          {/* Header del gasto */}
          <div className="mb-4 flex items-center gap-3 rounded-xl bg-zinc-50 p-3 dark:bg-zinc-800">
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${
              allSettled ? "bg-emerald-100" : "bg-white dark:bg-zinc-900"
            }`}>
              <svg className={`h-5 w-5 ${allSettled ? "text-emerald-600" : "text-zinc-500 dark:text-zinc-400"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
                <path d={CATEGORY_ICON[expense.category] ?? CATEGORY_ICON.other} />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="truncate font-semibold text-zinc-900 dark:text-zinc-100">{expense.description}</h4>
              <p className="text-xs text-zinc-400 dark:text-zinc-500">
                {expense.payer?.name ?? "Usuario"} · {settledCount}/{splits.length} pagados
              </p>
            </div>
            <p className="text-lg font-bold text-emerald-700">
              {formatCurrency(expense.amount, expense.currency)}
            </p>
          </div>

          {/* Lista de splits detallada */}
          <div className="space-y-1.5">
            {splits.map((split) => {
              const name = split.profile?.name ?? "Usuario";
              const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              const isOwnSplit = split.user_id === expense.paid_by;

              return (
                <div
                  key={split.id}
                  className={`flex items-center justify-between rounded-lg px-3 py-2.5 transition ${
                    isOwnSplit
                      ? "bg-emerald-50"
                      : split.settled
                        ? "bg-emerald-50/50"
                        : "bg-zinc-50 dark:bg-zinc-800"
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                      {split.profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={split.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium ${
                        split.settled || isOwnSplit ? "text-zinc-600 dark:text-zinc-300" : "text-zinc-900 dark:text-zinc-100"
                      }`}>
                        {name}
                      </p>
                      <p className="text-[11px] text-zinc-400 dark:text-zinc-500">
                        {isOwnSplit ? "Pagó el gasto" : formatCurrency(split.amount, expense.currency)}
                      </p>
                    </div>
                  </div>

                  {isOwnSplit ? (
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2.5 py-1 text-[10px] font-medium text-emerald-700">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Pagó
                    </span>
                  ) : isPayer ? (
                    <form action={toggleSplitSettled}>
                      <input type="hidden" name="split_id" value={split.id} />
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="settled" value={String(split.settled)} />
                      <button
                        type="submit"
                        className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-semibold transition ${
                          split.settled
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-zinc-200 text-zinc-600 hover:bg-emerald-100 hover:text-emerald-700 dark:bg-zinc-700 dark:text-zinc-300"
                        }`}
                      >
                        {split.settled ? (
                          <>
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                              <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            Pagado
                          </>
                        ) : (
                          <>
                            <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                              <circle cx="12" cy="12" r="9" />
                            </svg>
                            Marcar pagado
                          </>
                        )}
                      </button>
                    </form>
                  ) : split.settled ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Pagado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500">Pendiente</span>
                  )}
                </div>
              );
            })}
          </div>

          {isPayer && !allSettled && (
            <p className="mt-3 text-center text-xs text-zinc-400 dark:text-zinc-500">
              👆 Marca quién te ha pagado su parte
            </p>
          )}
        </div>
      </Modal>
    </>
  );
}
