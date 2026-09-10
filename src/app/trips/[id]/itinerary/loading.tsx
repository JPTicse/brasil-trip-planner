export default function Loading() {
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div className="h-7 w-24 animate-pulse rounded bg-zinc-200" />
        <div className="h-5 w-16 animate-pulse rounded bg-zinc-200" />
      </div>

      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 animate-pulse rounded-full bg-zinc-200" />
          <div className="h-4 w-32 animate-pulse rounded bg-zinc-200" />
        </div>

        <div className="ml-4 space-y-2 border-l-2 border-zinc-100 pl-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="overflow-hidden rounded-xl border border-zinc-100 bg-white">
              <div className="h-1 w-full animate-pulse bg-zinc-100" />
              <div className="p-3">
                <div className="flex items-start gap-2.5">
                  <div className="h-9 w-9 animate-pulse rounded-lg bg-zinc-100" />
                  <div className="flex-1 space-y-1.5">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-zinc-100" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-zinc-100" />
                  </div>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-zinc-50 pt-2">
                  <div className="h-5 w-20 animate-pulse rounded-full bg-zinc-100" />
                  <div className="h-5 w-16 animate-pulse rounded-full bg-zinc-100" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
