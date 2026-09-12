"use client";

import { CachedImage } from "@/components/cached-image";
import { signOut } from "@/lib/auth-actions";
import type { Profile } from "@/lib/types";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/theme-toggle";

export function UserMenu({ profile, email }: { profile: Profile | null; email: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const initials = (profile?.name ?? email)
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div ref={ref} className="relative flex items-center gap-1">
      <ThemeToggle />
      <button
        onClick={() => setOpen(!open)}
        className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-emerald-600 text-sm font-semibold text-white ring-2 ring-white dark:ring-zinc-800"
      >
        {profile?.avatar_url ? (
          <CachedImage src={profile.avatar_url} alt="" className="object-cover" sizes="100px" />
        ) : (
          initials
        )}
      </button>
      {open && (
        <div className="absolute right-0 top-11 z-50 w-56 rounded-xl border border-zinc-200 bg-white p-2 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
          <div className="border-b border-zinc-100 px-3 py-2 dark:border-zinc-800">
            <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{profile?.name ?? "Usuario"}</p>
            <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{email}</p>
          </div>
          <button
            onClick={() => signOut()}
            className="mt-1 w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cerrar sesión
          </button>
        </div>
      )}
    </div>
  );
}
