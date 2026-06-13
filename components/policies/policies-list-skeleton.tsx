export function PoliciesListSkeleton() {
  return (
    <div className="space-y-3 p-4 sm:p-6">
      {[1, 2, 3].map((item) => (
        <div
          key={item}
          className="h-24 animate-pulse rounded-[var(--radius-inner)] bg-white/50"
        />
      ))}
    </div>
  )
}
