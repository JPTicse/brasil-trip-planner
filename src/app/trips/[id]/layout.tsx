import { notFound } from "next/navigation";
import Link from "next/link";
import { getTrip } from "@/lib/data";
import { getCurrentUser } from "@/lib/auth";
import { BottomNav } from "@/components/bottom-nav";
import { UserMenu } from "@/components/user-menu";
import { formatDateRange } from "@/lib/format";

export default async function TripLayout({
  children,
  params,
}: LayoutProps<"/trips/[id]">) {
  const { id } = await params;
  const trip = await getTrip(id);
  if (!trip) notFound();

  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-zinc-50">
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-white/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-2">
            <Link
              href="/trips"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-600 hover:bg-zinc-100"
            >
              <BackIcon />
            </Link>
            <div className="min-w-0">
              <h1 className="truncate text-base font-bold text-zinc-900">
                {trip.name}
              </h1>
              {(trip.start_date || trip.end_date) && (
                <p className="truncate text-xs text-zinc-400">
                  {formatDateRange(trip.start_date, trip.end_date)}
                </p>
              )}
            </div>
          </div>
          <UserMenu profile={user?.profile ?? null} email={user?.email ?? ""} />
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-5 pb-24">{children}</main>

      <BottomNav tripId={id} />
    </div>
  );
}

function BackIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
