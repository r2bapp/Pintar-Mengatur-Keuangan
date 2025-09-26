"use client"

export function CardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border bg-card p-4 shadow-sm">
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
          <div className="mt-3 h-6 w-32 bg-muted rounded animate-pulse" />
          <div className="mt-2 h-3 w-20 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-3">
            <div className="h-6 w-6 rounded-full bg-muted animate-pulse" />
            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
          </div>
          <div className="h-4 w-24 bg-muted rounded animate-pulse" />
        </div>
      ))}
    </div>
  )
}

export function ChartSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="h-6 w-40 bg-muted rounded animate-pulse mb-4" />
      <div className="h-[220px] md:h-[260px] lg:h-[300px] bg-muted rounded animate-pulse" />
    </div>
  )
}
