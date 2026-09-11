"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "",
  pending: pendingProp,
}: {
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
}) {
  const { pending } = useFormStatus();
  const isPending = pendingProp ?? pending;
  return (
    <button
      type="submit"
      disabled={isPending}
      className={`flex flex-1 items-center justify-center rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {isPending ? "Guardando..." : children}
    </button>
  );
}
