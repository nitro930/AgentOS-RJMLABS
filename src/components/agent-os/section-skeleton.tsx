'use client'

export function SectionSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header skeleton */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1e1f2b]" />
          <div className="space-y-2">
            <div className="h-4 w-40 rounded bg-[#1e1f2b]" />
            <div className="h-3 w-24 rounded bg-[#252636]" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-8 w-20 rounded-lg bg-[#1e1f2b]" />
          <div className="h-8 w-8 rounded-lg bg-[#1e1f2b]" />
        </div>
      </div>

      {/* Stats bar skeleton */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-[#1e1f2b] border border-[#2d2e3d]/50" />
        ))}
      </div>

      {/* Card skeletons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl bg-[#1e1f2b] border border-[#2d2e3d]/50 p-4 space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-[#252636]" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3.5 w-24 rounded bg-[#252636]" />
                <div className="h-2.5 w-16 rounded bg-[#252636]" />
              </div>
            </div>
            <div className="h-2.5 w-full rounded bg-[#252636]" />
            <div className="h-2.5 w-3/4 rounded bg-[#252636]" />
            <div className="flex items-center gap-2 pt-1">
              <div className="h-5 w-14 rounded-full bg-[#252636]" />
              <div className="h-5 w-14 rounded-full bg-[#252636]" />
            </div>
          </div>
        ))}
      </div>

      {/* Table skeleton */}
      <div className="rounded-xl bg-[#1e1f2b] border border-[#2d2e3d]/50 overflow-hidden">
        {/* Table header */}
        <div className="flex items-center gap-4 px-4 py-3 border-b border-[#2d2e3d]/50">
          <div className="h-3 w-20 rounded bg-[#252636]" />
          <div className="h-3 w-24 rounded bg-[#252636]" />
          <div className="h-3 w-16 rounded bg-[#252636]" />
          <div className="h-3 w-20 rounded bg-[#252636]" />
          <div className="ml-auto h-3 w-12 rounded bg-[#252636]" />
        </div>
        {/* Table rows */}
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 px-4 py-3 border-b border-[#2d2e3d]/30 last:border-b-0"
          >
            <div className="w-7 h-7 rounded-full bg-[#252636]" />
            <div className="h-3 w-28 rounded bg-[#252636]" />
            <div className="h-3 w-20 rounded bg-[#252636]" />
            <div className="h-5 w-12 rounded-full bg-[#252636]" />
            <div className="ml-auto h-3 w-16 rounded bg-[#252636]" />
          </div>
        ))}
      </div>
    </div>
  )
}
