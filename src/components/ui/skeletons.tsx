import { cn } from "@/lib/utils/cn";

// ── Base skeleton pulse ──────────────────────────────────────────
function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("skeleton", className)} {...props} />;
}

// ── Dashboard skeleton ───────────────────────────────────────────
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-pulse">
      {/* Top row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-base p-5 flex flex-col items-center gap-4">
          <Skeleton className="w-24 h-4 rounded" />
          <Skeleton className="w-44 h-44 rounded-full" />
          <Skeleton className="w-20 h-6 rounded-full" />
        </div>
        <div className="lg:col-span-2 card-base p-5 space-y-3">
          <Skeleton className="w-32 h-5 rounded" />
          <Skeleton className="w-full h-10 rounded-lg" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="w-full h-14 rounded-xl" />)}
          </div>
          <Skeleton className="w-full h-10 rounded-lg" />
        </div>
      </div>
      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="card-base p-4 space-y-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-16 h-7 rounded" />
            <Skeleton className="w-24 h-3 rounded" />
          </div>
        ))}
      </div>
      {/* Bottom row */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 card-base p-5">
          <Skeleton className="w-32 h-5 rounded mb-4" />
          <Skeleton className="w-full h-44 rounded-lg" />
        </div>
        <div className="lg:col-span-2 card-base p-5 space-y-2">
          <Skeleton className="w-24 h-5 rounded mb-4" />
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="w-full h-14 rounded-xl" />)}
        </div>
      </div>
    </div>
  );
}

// ── Tasks skeleton ───────────────────────────────────────────────
export function TasksSkeleton() {
  return (
    <div className="flex gap-6 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="flex justify-between mb-4">
          <Skeleton className="w-64 h-9 rounded-lg" />
          <Skeleton className="w-24 h-9 rounded-lg" />
        </div>
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card-base p-4 flex items-start gap-3">
            <Skeleton className="w-5 h-5 rounded-full flex-shrink-0 mt-0.5" />
            <div className="flex-1 space-y-2">
              <Skeleton className="w-3/4 h-4 rounded" />
              <div className="flex gap-3">
                <Skeleton className="w-12 h-3 rounded" />
                <Skeleton className="w-16 h-3 rounded" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Analytics skeleton ───────────────────────────────────────────
export function AnalyticsSkeleton() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="card-base p-4 space-y-2">
            <Skeleton className="w-8 h-8 rounded-lg" />
            <Skeleton className="w-16 h-6 rounded" />
            <Skeleton className="w-20 h-3 rounded" />
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card-base p-5 flex flex-col items-center gap-3">
          <Skeleton className="w-44 h-44 rounded-full" />
        </div>
        <div className="lg:col-span-2 card-base p-5">
          <Skeleton className="w-32 h-5 rounded mb-4" />
          <Skeleton className="w-full h-44 rounded-lg" />
        </div>
      </div>
      <div className="card-base p-5">
        <Skeleton className="w-32 h-5 rounded mb-4" />
        <div className="space-y-1">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
            <div key={i} className="flex gap-1">
              <Skeleton className="w-6 h-3 rounded" />
              {Array.from({ length: 7 }).map((_, j) => (
                <Skeleton key={j} className="flex-1 aspect-square rounded-sm" />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Focus skeleton ───────────────────────────────────────────────
export function FocusSkeleton() {
  return (
    <div className="flex gap-6 w-full animate-pulse">
      <div className="flex-1 flex flex-col items-center justify-center gap-6">
        <Skeleton className="w-48 h-4 rounded-full" />
        <Skeleton className="w-64 h-64 rounded-full" />
        <Skeleton className="w-40 h-12 rounded-full" />
      </div>
      <div className="w-80 flex-shrink-0 card-base p-4 space-y-3">
        <Skeleton className="w-32 h-5 rounded" />
        <div className="flex-1 space-y-3 py-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className={cn("flex gap-2", i % 2 === 0 && "justify-end")}>
              <Skeleton className={cn("h-12 rounded-2xl", i % 2 === 0 ? "w-48" : "w-56")} />
            </div>
          ))}
        </div>
        <Skeleton className="w-full h-10 rounded-xl" />
      </div>
    </div>
  );
}

// ── Generic card skeleton ────────────────────────────────────────
export function CardSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="card-base p-5 space-y-3 animate-pulse">
      <Skeleton className="w-32 h-5 rounded" />
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-4 rounded", i === lines - 1 ? "w-3/4" : "w-full")} />
      ))}
    </div>
  );
}

export { Skeleton };
