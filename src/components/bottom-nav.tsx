"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "itinerary", label: "Itinerario", icon: CalendarIcon },
  { href: "accommodations", label: "Hoteles", icon: BedIcon },
  { href: "transport", label: "Transporte", icon: PlaneIcon },
  { href: "expenses", label: "Gastos", icon: WalletIcon },
  { href: "members", label: "Miembros", icon: UsersIcon },
] as const;

export function BottomNav({ tripId }: { tripId: string }) {
  const pathname = usePathname();
  const basePath = `/trips/${tripId}`;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200 bg-white/95 backdrop-blur-md pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto flex max-w-md items-stretch justify-between">
        {TABS.map((tab) => {
          const href = `${basePath}/${tab.href}`;
          const active = pathname === href || pathname.startsWith(href + "/");
          const Icon = tab.icon;
          return (
            <Link
              key={tab.href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2.5 text-[10px] font-medium transition-colors ${
                active ? "text-emerald-600" : "text-zinc-400"
              }`}
            >
              <Icon className="h-5 w-5" filled={active} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

function CalendarIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" strokeLinecap="round" />
    </svg>
  );
}

function BedIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M2 4v16M2 8h18a2 2 0 0 1 2 2v10M2 17h20M6 8a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2v0a2 2 0 0 0-2-2H6z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PlaneIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5-.3.7-.2 1.4.3 1.9l4.4 4.4-2.6 2.6-2.4-.6c-.5-.1-1 .1-1.2.5l-.5 1 3.4 1.8 1.8 3.4 1-.5c.4-.2.6-.7.5-1.2l-.6-2.4 2.6-2.6 4.4 4.4c.5.5 1.2.6 1.9.3.4-.2.6-.6.5-1.1z" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function WalletIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function UsersIcon({ className, filled }: { className?: string; filled?: boolean }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={filled ? 0 : 2}>
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
