import Link from "next/link";
import { cn } from "@/lib/utils";

export function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div className={cn("rounded-xl border border-border bg-card", className)} {...props} />
  );
}

export function Badge({
  className,
  tone = "slate",
  children,
}: {
  className?: string;
  tone?: "slate" | "green" | "amber" | "red" | "blue";
  children: React.ReactNode;
}) {
  const tones = {
    slate: "bg-[#efe8dc] text-[#3f3830]",
    green: "bg-[#e4efe8] text-[#1f3d32]",
    amber: "bg-[#f3ead4] text-[#6b4e16]",
    red: "bg-[#f6e4e1] text-[#9f2d2d]",
    blue: "bg-[#e4efe8] text-[#1f3d32]",
  };
  return (
    <span className={cn("inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium", tones[tone], className)}>
      {children}
    </span>
  );
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center">
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
      {actionHref && actionLabel ? (
        <Link
          href={actionHref}
          className="mt-4 inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
        >
          {actionLabel}
        </Link>
      ) : null}
    </div>
  );
}

export function AccessDenied() {
  return (
    <EmptyState
      title="Access denied"
      description="Your role does not include this page. Ask an admin if you need access."
      actionHref="/dashboard"
      actionLabel="Back to dashboard"
    />
  );
}

export function Pagination({
  page,
  pageCount,
  params,
  pageKey = "page",
}: {
  page: number;
  pageCount: number;
  params: Record<string, string | undefined>;
  pageKey?: string;
}) {
  function href(nextPage: number) {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      if (value) search.set(key, value);
    }
    search.set(pageKey, String(nextPage));
    return `?${search.toString()}`;
  }

  if (pageCount <= 1) return null;

  return (
    <nav className="flex items-center justify-between gap-3 text-sm" aria-label="Pagination">
      <p className="text-muted-foreground">
        Page {page} of {pageCount}
      </p>
      <div className="flex gap-2">
        <Link
          aria-disabled={page <= 1}
          className={cn(
            "rounded-md border border-border bg-card px-3 py-1.5",
            page <= 1 && "pointer-events-none opacity-40",
          )}
          href={href(page - 1)}
        >
          Previous
        </Link>
        <Link
          aria-disabled={page >= pageCount}
          className={cn(
            "rounded-md border border-border bg-card px-3 py-1.5",
            page >= pageCount && "pointer-events-none opacity-40",
          )}
          href={href(page + 1)}
        >
          Next
        </Link>
      </div>
    </nav>
  );
}
