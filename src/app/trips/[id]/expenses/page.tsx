import { getExpenses, getTripBalances, getTripDebts, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ExpenseForm } from "@/components/expense-form";
import { DeleteButton, EmptyState } from "@/components/ui";
import { deleteExpense, toggleSplitSettled } from "@/lib/actions";
import { EXPENSE_CATEGORY_LABELS, type Expense, type Profile } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/format";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽️",
  transport: "🚌",
  accommodation: "🏨",
  activity: "🎟️",
  other: "📦",
};

const CATEGORY_ICON: Record<string, string> = {
  food: "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7",
  transport: "M4 16l2-6h12l2 6M4 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M4 16h16M18 16v3a1 1 0 001 1h1a1 1 0 001-1v-1M7 10V7a2 2 0 012-2h6a2 2 0 012 2v3",
  accommodation: "M3 21V8l9-5 9 5v13M3 21h18M9 21v-6h6v6M9 11h.01M15 11h.01",
  activity: "M4 8V6a2 2 0 012-2h12a2 2 0 012 2v2M4 8h16M4 8v10a2 2 0 002 2h12a2 2 0 002-2V8M8 12h8M8 16h5",
  other: "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z",
};

export default async function ExpensesPage({
  params,
}: PageProps<"/trips/[id]/expenses">) {
  const { id } = await params;
  const [expenses, members, balances, debts, user] = await Promise.all([
    getExpenses(id),
    getTripMembers(id),
    getTripBalances(id),
    getTripDebts(id),
    getCurrentUser(),
  ]);

  const memberProfiles = members
    .map((m) => m.profile)
    .filter((p): p is NonNullable<typeof p> => p !== null && p !== undefined);

  const totalAmount = expenses.reduce((sum, e) => sum + e.amount, 0);
  const currency = expenses[0]?.currency ?? "BRL";

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-zinc-900">Gastos</h2>
        {expenses.length > 0 && (
          <span className="text-sm font-medium text-emerald-700">
            Total: {formatCurrency(totalAmount, currency)}
          </span>
        )}
      </div>

      {/* Resumen de saldos */}
      {balances.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-sm font-semibold text-zinc-700">Saldos</h3>
          <div className="space-y-2">
            {balances
              .sort((a, b) => b.net - a.net)
              .map((b) => (
                <div key={b.profile.id} className="flex items-center justify-between text-sm">
                  <span className="text-zinc-700">{b.profile.name ?? "Usuario"}</span>
                  <span
                    className={`font-medium ${
                      b.net > 0.01
                        ? "text-emerald-600"
                        : b.net < -0.01
                          ? "text-red-500"
                          : "text-zinc-400"
                    }`}
                  >
                    {b.net > 0.01 ? "+" : ""}
                    {formatCurrency(b.net, currency)}
                  </span>
                </div>
              ))}
          </div>
          <p className="mt-3 text-xs text-zinc-400">
            💚 Le deben dinero · 🔴 Debe dinero
          </p>
        </div>
      )}

      {/* Quién debe a quién */}
      {debts.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 shadow-sm">
          <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-amber-800">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
              <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Quién debe a quién
          </h3>
          <div className="space-y-2">
            {debts.map((d, i) => (
              <div key={i} className="flex items-center gap-2 text-sm">
                <span className="flex-1 truncate font-medium text-zinc-700">
                  {d.from.name ?? "Usuario"}
                </span>
                <span className="flex items-center gap-1 text-xs text-amber-600">
                  debe
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
                <span className="flex-1 truncate text-right font-medium text-zinc-700">
                  {d.to.name ?? "Usuario"}
                </span>
                <span className="ml-2 shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                  {formatCurrency(d.amount, currency)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de gastos */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title="Sin gastos registrados"
          description="Registra los gastos del viaje y repártelos entre todos."
        />
      ) : (
        <div className="space-y-2.5">
          {expenses.map((e) => (
            <ExpenseCard
              key={e.id}
              expense={e}
              tripId={id}
              currentUserId={user?.id ?? ""}
            />
          ))}
        </div>
      )}

      <ExpenseForm tripId={id} members={memberProfiles} />
    </div>
  );
}

function ExpenseCard({
  expense,
  tripId,
  currentUserId,
}: {
  expense: Expense;
  tripId: string;
  currentUserId: string;
}) {
  const allSplits = expense.splits ?? [];
  const isPayer = expense.paid_by === currentUserId;
  const settledCount = allSplits.filter((s) => s.settled).length;
  const allSettled = allSplits.length > 0 && settledCount === allSplits.length;

  // Ordenar: el que pagó primero, luego los demás (pendientes antes de saldados)
  const splits = [...allSplits].sort((a, b) => {
    if (a.user_id === expense.paid_by) return -1;
    if (b.user_id === expense.paid_by) return 1;
    if (a.settled !== b.settled) return a.settled ? 1 : -1;
    return 0;
  });

  return (
    <div className={`rounded-xl border bg-white p-3 shadow-sm transition ${
      allSettled ? "border-emerald-200" : "border-zinc-200"
    }`}>
      {/* Header compacto */}
      <div className="flex items-center gap-2.5">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          allSettled ? "bg-emerald-100" : "bg-zinc-100"
        }`}>
          <svg className={`h-4.5 w-4.5 ${allSettled ? "text-emerald-600" : "text-zinc-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d={CATEGORY_ICON[expense.category] ?? CATEGORY_ICON.other} />
          </svg>
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-semibold text-zinc-900">{expense.description}</h4>
            {allSettled && (
              <span className="shrink-0 rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-medium text-emerald-700">
                ✓
              </span>
            )}
          </div>
          <p className="truncate text-[11px] text-zinc-400">
            {EXPENSE_CATEGORY_LABELS[expense.category]} · {formatDate(expense.date)}
            {expense.payer && ` · ${expense.payer.name ?? "miembro"}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="text-sm font-bold text-emerald-700">
            {formatCurrency(expense.amount, expense.currency)}
          </p>
        </div>
        {isPayer && (
          <form action={deleteExpense}>
            <input type="hidden" name="expense_id" value={expense.id} />
            <input type="hidden" name="trip_id" value={tripId} />
            <button
              type="submit"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 transition hover:bg-red-50 hover:text-red-500"
              title="Eliminar gasto"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </form>
        )}
      </div>

      {/* Reparto */}
      {splits.length > 0 && (
        <div className="mt-2.5 border-t border-zinc-100 pt-2">
          <div className="mb-1.5 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              {settledCount}/{splits.length} pagado{settledCount !== 1 ? "s" : ""}
            </p>
            {isPayer && !allSettled && (
              <span className="text-[10px] text-zinc-400">Marca quién te ha pagado</span>
            )}
          </div>
          <div className="space-y-1">
            {splits.map((split) => {
              const name = split.profile?.name ?? "Usuario";
              const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
              const isOwnSplit = split.user_id === expense.paid_by;

              return (
                <div
                  key={split.id}
                  className={`flex items-center justify-between rounded-lg px-2 py-1.5 transition ${
                    isOwnSplit
                      ? "bg-emerald-50"
                      : split.settled
                        ? "bg-emerald-50/50"
                        : "bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-[9px] font-semibold text-white">
                      {split.profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={split.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${
                        split.settled || isOwnSplit ? "text-zinc-600" : "text-zinc-800"
                      }`}>
                        {name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {isOwnSplit ? "Pagó el gasto" : formatCurrency(split.amount, expense.currency)}
                      </p>
                    </div>
                  </div>

                  {isOwnSplit ? (
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
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
                        className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-semibold transition ${
                          split.settled
                            ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                            : "bg-zinc-200 text-zinc-600 hover:bg-emerald-100 hover:text-emerald-700"
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
                            Marcar
                          </>
                        )}
                      </button>
                    </form>
                  ) : split.settled ? (
                    <span className="flex items-center gap-0.5 text-[10px] font-medium text-emerald-600">
                      <svg className="h-2.5 w-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Pagado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-400">Pendiente</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function WalletIcon() {
  return (
    <svg className="h-12 w-12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
