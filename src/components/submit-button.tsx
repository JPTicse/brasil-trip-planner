"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  className = "",
  pending: pendingProp,
  loadingText,
}: {
  children: React.ReactNode;
  className?: string;
  pending?: boolean;
  loadingText?: string;
}) {
  const { pending } = useFormStatus();
  const isPending = pendingProp ?? pending;
  return (
    <button
      type="submit"
      disabled={isPending}
      className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg bg-emerald-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-700 active:scale-[0.98] disabled:opacity-50 ${className}`}
    >
      {isPending && (
        <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5}>
          <path d="M21 12a9 9 0 11-6.219-8.56" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      )}
      {isPending ? (loadingText ?? "Guardando...") : children}
    </button>
  );
}
