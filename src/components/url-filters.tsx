"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRef } from "react";

const PRESERVED = new Set(["historyPage"]);

export function UrlFilters({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function apply(form: HTMLFormElement) {
    const params = new URLSearchParams();
    for (const [key, value] of searchParams.entries()) {
      if (PRESERVED.has(key)) params.set(key, value);
    }
    for (const [key, value] of new FormData(form).entries()) {
      const text = String(value).trim();
      if (!text || text === "ALL") continue;
      params.set(key, text);
    }
    const query = params.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    const currentQuery = searchParams.toString();
    const current = currentQuery ? `${pathname}?${currentQuery}` : pathname;
    if (next === current) return;
    router.replace(next, { scroll: false });
  }

  function schedule(form: HTMLFormElement, immediate: boolean) {
    if (timer.current) clearTimeout(timer.current);
    if (immediate) {
      apply(form);
      return;
    }
    timer.current = setTimeout(() => apply(form), 300);
  }

  return (
    <form
      className={className}
      onSubmit={(event) => {
        event.preventDefault();
        schedule(event.currentTarget, true);
      }}
      onChange={(event) => {
        const target = event.target;
        if (!(target instanceof HTMLInputElement || target instanceof HTMLSelectElement)) return;
        const immediate = target instanceof HTMLSelectElement || target.type === "date";
        schedule(event.currentTarget, immediate);
      }}
    >
      {children}
    </form>
  );
}
