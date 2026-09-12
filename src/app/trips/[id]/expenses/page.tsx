import { CachedImage } from "@/components/cached-image";
import { getExpenses, getTripBalances, getTripDebts, getTripMembers } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { ExpenseForm } from "@/components/expense-form";
import { EmptyState } from "@/components/ui";
import { LiveIndicator } from "@/components/live-indicator";
import { BalancesModal, DebtsModal } from "@/components/expense-modals";
import { ExpenseDetailModal } from "@/components/expense-detail-modal";
import { DeleteExpenseButton } from "@/components/delete-expense-button";
import { EXPENSE_CATEGORY_LABELS, type Expense } from "@/lib/types";
import { formatDate, formatCurrency } from "@/lib/format";

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

  return (
    <div className="space-y-4">
      {/* Header compacto con botones de popup */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-zinc-900">Gastos</h2>
          <LiveIndicator />
        </div>
        <div className="flex items-center gap-2">
          {balances.length > 0 && (
            <BalancesModal balancesByCurrency={balances} />
          )}
          {debts.length > 0 && (
            <DebtsModal debtsByCurrency={debts} />
          )}
        </div>
      </div>

      {/* Lista de gastos compacta */}
      {expenses.length === 0 ? (
        <EmptyState
          icon={<WalletIcon />}
          title="Sin gastos registrados"
          description="Registra los gastos del viaje y repártelos entre todos."
        />
      ) : (
        <div className="space-y-2">
          {expenses.map((e) => (
            <CompactExpenseCard
              key={e.id}
              expense={e}
              tripId={id}
              currentUserId={user?.id ?? ""}
            />
          ))}
        </div>
      )}

      <ExpenseForm tripId={id} members={memberProfiles} currentUserId={user?.id ?? ""} />
    </div>
  );
}

function CompactExpenseCard({
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
  const pendingCount = allSplits.length - settledCount;

  // Avatares: pagador primero, luego pendientes, luego saldados (máx 5 visibles)
  const sortedSplits = [...allSplits].sort((a, b) => {
    if (a.user_id === expense.paid_by) return -1;
    if (b.user_id === expense.paid_by) return 1;
    if (a.settled !== b.settled) return a.settled ? 1 : -1;
    return 0;
  });
  const visibleSplits = sortedSplits.slice(0, 5);
  const extraCount = sortedSplits.length - visibleSplits.length;

  return (
    <div className={`rounded-xl border bg-white shadow-sm transition ${
      allSettled ? "border-emerald-200" : "border-zinc-200"
    }`}>
      {/* Fila principal: icono + info + monto + eliminar */}
      <div className="flex items-center gap-2.5 p-3">
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
          allSettled ? "bg-emerald-100" : "bg-zinc-100"
        }`}>
          <svg className={`h-4 w-4 ${allSettled ? "text-emerald-600" : "text-zinc-500"}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            <path d={CATEGORY_ICON[expense.category] ?? CATEGORY_ICON.other} />
          </svg>
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <h4 className="truncate text-sm font-semibold text-zinc-900">{expense.description}</h4>
            {allSettled && (
              <svg className="h-3.5 w-3.5 shrink-0 text-emerald-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <p className="truncate text-[11px] text-zinc-400">
            {EXPENSE_CATEGORY_LABELS[expense.category]} · {expense.payer?.name ?? "miembro"}
          </p>
        </div>

        <p className="shrink-0 text-sm font-bold text-emerald-700">
          {formatCurrency(expense.amount, expense.currency)}
        </p>

        {isPayer && (
          <DeleteExpenseButton
            expenseId={expense.id}
            tripId={tripId}
            expenseTitle={expense.description}
          />
        )}
      </div>

      {/* Fila de avatares compacta */}
      {allSplits.length > 0 && (
        <ExpenseDetailModal
          expense={expense}
          tripId={tripId}
          currentUserId={currentUserId}
          trigger={
            <div className="flex cursor-pointer items-center gap-2 border-t border-zinc-100 px-3 py-2 transition hover:bg-zinc-50">
              {/* Avatares de estado */}
              <div className="flex -space-x-1.5">
                {visibleSplits.map((split) => {
                  const name = split.profile?.name ?? "Usuario";
                  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  const isPayerSplit = split.user_id === expense.paid_by;
                  const isSettled = split.settled || isPayerSplit;

                  return (
                    <div
                      key={split.id}
                      className={`relative flex h-6 w-6 items-center justify-center overflow-hidden rounded-full border-2 text-[8px] font-semibold text-white ${
                        isSettled
                          ? "border-emerald-400 bg-emerald-500"
                          : "border-zinc-300 bg-zinc-400"
                      }`}
                      title={`${name}: ${isSettled ? "pagado" : "pendiente"}`}
                    >
                      {split.profile?.avatar_url ? (
                        <CachedImage src={split.profile.avatar_url} alt="" className="object-cover" sizes="100px" />
                      ) : (
                        initials
                      )}
                      {isSettled && (
                        <span className="absolute -bottom-0.5 -right-0.5 flex h-3 w-3 items-center justify-center rounded-full bg-emerald-500 ring-1 ring-white">
                          <svg className="h-2 w-2 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={4}>
                            <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </span>
                      )}
                    </div>
                  );
                })}
                {extraCount > 0 && (
                  <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-200 bg-zinc-100 text-[8px] font-semibold text-zinc-500">
                    +{extraCount}
                  </div>
                )}
              </div>

              {/* Estado resumido */}
              <span className="text-[11px] text-zinc-400">
                {pendingCount > 0 ? (
                  <>
                    <span className="font-medium text-amber-600">{pendingCount}</span> pendiente{pendingCount !== 1 ? "s" : ""}
                  </>
                ) : (
                  <span className="font-medium text-emerald-600">Todos pagaron</span>
                )}
              </span>

              {/* Icono de detalle */}
              <svg className="ml-auto h-4 w-4 text-zinc-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          }
        />
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
