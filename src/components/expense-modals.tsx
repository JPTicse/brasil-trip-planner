"use client";

import { useState } from "react";
import type { Balance, Debt } from "@/lib/data";
import { formatCurrency } from "@/lib/format";

export function BalancesModal({
  balances,
  currency,
}: {
  balances: Balance[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-700 transition hover:border-emerald-300 hover:bg-emerald-50 active:scale-95"
      >
        <svg className="h-3.5 w-3.5 text-emerald-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
        </svg>
        Saldos
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h3 className="text-base font-bold text-zinc-900">Saldos del viaje</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto px-5 pb-6">
              {balances
                .sort((a, b) => b.net - a.net)
                .map((b) => {
                  const name = b.profile.name ?? "Usuario";
                  const initials = name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                  return (
                    <div key={b.profile.id} className="flex items-center gap-3 rounded-lg bg-zinc-50 px-3 py-2.5">
                      <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-xs font-semibold text-white">
                        {b.profile.avatar_url ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={b.profile.avatar_url} alt="" className="h-full w-full object-cover" />
                        ) : (
                          initials
                        )}
                      </div>
                      <span className="flex-1 text-sm font-medium text-zinc-800">{name}</span>
                      <span className={`text-sm font-bold ${
                        b.net > 0.01 ? "text-emerald-600" : b.net < -0.01 ? "text-red-500" : "text-zinc-400"
                      }`}>
                        {b.net > 0.01 ? "+" : ""}{formatCurrency(b.net, currency)}
                      </span>
                    </div>
                  );
                })}
              <p className="pt-2 text-center text-xs text-zinc-400">
                💚 Le deben dinero · 🔴 Debe dinero
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export function DebtsModal({
  debts,
  currency,
}: {
  debts: Debt[];
  currency: string;
}) {
  const [open, setOpen] = useState(false);

  if (debts.length === 0) return null;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 transition hover:bg-amber-100 active:scale-95"
      >
        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
          <path d="M17 1l4 4-4 4M3 11V9a4 4 0 014-4h14M7 23l-4-4 4-4M21 13v2a4 4 0 01-4 4H3" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        Deudas
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md rounded-t-2xl bg-white shadow-2xl">
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-zinc-200" />
            </div>
            <div className="flex items-center justify-between px-5 pb-2">
              <h3 className="text-base font-bold text-zinc-900">Quién debe a quién</h3>
              <button
                onClick={() => setOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-100"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            </div>
            <div className="max-h-[60vh] space-y-2 overflow-y-auto px-5 pb-6">
              {debts.map((d, i) => {
                const fromName = d.from.name ?? "Usuario";
                const toName = d.to.name ?? "Usuario";
                const fromInitials = fromName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
                const toInitials = toName.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

                return (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-amber-50/50 px-3 py-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-red-400 text-[10px] font-semibold text-white">
                      {d.from.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.from.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        fromInitials
                      )}
                    </div>
                    <div className="min-w-0 flex-1 text-center">
                      <p className="truncate text-xs font-medium text-zinc-700">{fromName}</p>
                      <div className="flex items-center justify-center gap-1 text-[10px] text-amber-600">
                        <span>debe</span>
                        <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                          <path d="M5 12h14M12 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                      <p className="truncate text-xs font-medium text-zinc-700">{toName}</p>
                    </div>
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-emerald-500 text-[10px] font-semibold text-white">
                      {d.to.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={d.to.avatar_url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        toInitials
                      )}
                    </div>
                    <span className="ml-1 shrink-0 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-bold text-amber-700">
                      {formatCurrency(d.amount, currency)}
                    </span>
                  </div>
                );
              })}
              <p className="pt-2 text-center text-xs text-zinc-400">
                Transacciones minimizadas para saldar todas las deudas
              </p>
            </div>
          </div>
        </>
      )}
    </>
  );
}
