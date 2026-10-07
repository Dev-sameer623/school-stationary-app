export function ProductGridSkeleton() {
  return (
    <section id="products" className="scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8" aria-hidden>
      <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-5">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="overflow-hidden rounded-2xl border border-border bg-card">
            <div className="aspect-[3/4] animate-pulse bg-muted" />
            <div className="grid gap-2 p-3">
              <div className="h-3 w-16 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded bg-muted" />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
