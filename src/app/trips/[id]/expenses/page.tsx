import { getExpenses, getTripBalances, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ExpenseForm } from "@/components/expense-form";
import { DeleteButton, EmptyState } from "@/components/ui";
import { deleteExpense, toggleSplitSettled } from "@/lib/actions";
import { EXPENSE_CATEGORY_LABELS, type Expense } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/format";

const CATEGORY_EMOJI: Record<string, string> = {
  food: "🍽️",
  transport: "🚌",
  accommodation: "🏨",
  activity: "🎟️",
  other: "📦",
};

export default async function ExpensesPage({
  params,
}: PageProps<"/trips/[id]/expenses">) {
  const { id } = await params;
  const [expenses, members, balances, user] = await Promise.all([
    getExpenses(id),
    getTripMembers(id),
    getTripBalances(id),
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

      {/* Lista de gastos */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title="Sin gastos registrados"
          description="Registra los gastos del viaje y repártelos entre todos."
        />
      ) : (
        <div className="space-y-3">
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
  const splits = expense.splits ?? [];
  const isPayer = expense.paid_by === currentUserId;
  const settledCount = splits.filter((s) => s.settled).length;
  const allSettled = splits.length > 0 && settledCount === splits.length;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span>{CATEGORY_EMOJI[expense.category] ?? "📦"}</span>
            <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[10px] font-medium text-zinc-500">
              {EXPENSE_CATEGORY_LABELS[expense.category]}
            </span>
            {allSettled && (
              <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-medium text-emerald-700">
                ✓ Saldado
              </span>
            )}
          </div>
          <h4 className="mt-1 font-medium text-zinc-900">{expense.description}</h4>
          <p className="mt-0.5 text-xs text-zinc-400">
            {formatDate(expense.date)}
            {expense.payer && ` · Pagó ${expense.payer.name ?? "miembro"}`}
          </p>
          <p className="mt-1 text-lg font-bold text-emerald-700">
            {formatCurrency(expense.amount, expense.currency)}
          </p>
        </div>
        <form action={deleteExpense}>
          <input type="hidden" name="expense_id" value={expense.id} />
          <input type="hidden" name="trip_id" value={tripId} />
          <DeleteButton>Eliminar</DeleteButton>
        </form>
      </div>

      {/* Reparto */}
      {splits.length > 0 && (
        <div className="mt-3 border-t border-zinc-100 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-medium uppercase tracking-wide text-zinc-400">
              Reparto ({settledCount}/{splits.length} pagado{settledCount !== 1 ? "s" : ""})
            </p>
            {isPayer && !allSettled && (
              <span className="text-[10px] text-zinc-400">
                Tú pagaste — marca quién te ha pagado
              </span>
            )}
          </div>
          <div className="space-y-1.5">
            {splits.map((split) => {
              const name = split.profile?.name ?? "Usuario";
              const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

              return (
                <div
                  key={split.id}
                  className={`flex items-center justify-between rounded-lg px-2.5 py-2 transition ${
                    split.settled
                      ? "bg-emerald-50"
                      : "bg-zinc-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-[10px] font-semibold text-white">
                      {split.profile?.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={split.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        initials
                      )}
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${
                        split.settled ? "text-zinc-500" : "text-zinc-800"
                      }`}>
                        {name}
                      </p>
                      <p className="text-[10px] text-zinc-400">
                        {split.user_id === expense.paid_by
                          ? "Pagó el gasto"
                          : formatCurrency(split.amount, expense.currency)}
                      </p>
                    </div>
                  </div>

                  {split.user_id === expense.paid_by ? (
                    <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
                      ✓ Pagó
                    </span>
                  ) : isPayer ? (
                    <form action={toggleSplitSettled}>
                      <input type="hidden" name="split_id" value={split.id} />
                      <input type="hidden" name="trip_id" value={tripId} />
                      <input type="hidden" name="settled" value={String(split.settled)} />
                      <button
                        type="submit"
                        className={`flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-semibold transition ${
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
                            Marcar pagado
                          </>
                        )}
                      </button>
                    </form>
                  ) : split.settled ? (
                    <span className="flex items-center gap-1 text-[10px] font-medium text-emerald-600">
                      <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3}>
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      Pagado
                    </span>
                  ) : (
                    <span className="text-[10px] font-medium text-zinc-400">
                      Pendiente
                    </span>
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
