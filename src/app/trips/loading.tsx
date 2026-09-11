export default function TripsLoading() {
  return (
    <div className="flex min-h-dvh flex-col bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-zinc-200 bg-zinc-50/95 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/95">
        <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
          <div className="h-5 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        </div>
      </header>

      <main className="mx-auto w-full max-w-md flex-1 space-y-6 px-4 py-6 pb-24">
        <section>
          <div className="mb-3 h-4 w-24 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="space-y-3">
            <SkeletonTripCard />
            <SkeletonTripCard />
            <SkeletonTripCard />
          </div>
        </section>
      </main>
    </div>
  );
}

function SkeletonTripCard() {
  return (
    <div className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-start justify-between">
        <div className="flex-1 space-y-2">
          <div className="h-4 w-3/4 rounded bg-zinc-200 dark:bg-zinc-800" />
          <div className="h-3 w-1/2 rounded bg-zinc-100 dark:bg-zinc-800" />
        </div>
        <div className="ml-2 h-6 w-14 rounded-full bg-zinc-100 dark:bg-zinc-800" />
      </div>
      <div className="mt-3 h-3 w-1/3 rounded bg-zinc-100 dark:bg-zinc-800" />
    </div>
  );
}
