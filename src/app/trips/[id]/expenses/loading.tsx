export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="h-5 w-16 animate-pulse rounded bg-zinc-200" />
      </div>
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-zinc-100 bg-white p-3">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-100" />
              <div className="flex-1 space-y-1.5">
                <div className="h-4 w-1/3 animate-pulse rounded bg-zinc-100" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-zinc-100" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
