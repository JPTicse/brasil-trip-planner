"use client";

import { deleteExpense } from "@/lib/actions";
import { ConfirmButton } from "@/components/confirm-button";

export function DeleteExpenseButton({
  expenseId,
  tripId,
  expenseTitle,
}: {
  expenseId: string;
  tripId: string;
  expenseTitle: string;
}) {
  return (
    <ConfirmButton
      action={deleteExpense}
      fields={[
        { name: "expense_id", value: expenseId },
        { name: "trip_id", value: tripId },
      ]}
      confirmTitle="¿Eliminar gasto?"
      confirmMessage={`"${expenseTitle}" se eliminará permanentemente. Las deudas relacionadas se recalcularán.`}
      confirmLabel="Eliminar"
      variant="danger"
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-300 transition hover:bg-red-50 hover:text-red-500"
    >
      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
        <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2M10 11v6M14 11v6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </ConfirmButton>
  );
}
