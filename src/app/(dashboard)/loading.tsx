export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading">
      <div className="h-8 w-48 animate-pulse rounded bg-[#e7dfd1]" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="h-24 animate-pulse rounded-xl bg-[#e7dfd1]" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-[#e7dfd1]" />
    </div>
  );
}
