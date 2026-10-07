"use client";

import { useEffect } from "react";
import { IDLE_MS } from "@/lib/customer-auth/constants";

export function IdleLogout({ href }: { href: string }) {
  useEffect(() => {
    let timer = 0;
    const reset = () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        window.location.assign(href);
      }, IDLE_MS);
    };
    const events = ["pointerdown", "keydown", "scroll"] as const;
    for (const event of events) window.addEventListener(event, reset, { passive: true });
    reset();
    return () => {
      window.clearTimeout(timer);
      for (const event of events) window.removeEventListener(event, reset);
    };
  }, [href]);

  return null;
}
