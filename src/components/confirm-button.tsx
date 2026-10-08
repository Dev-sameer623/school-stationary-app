"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { ActionResult } from "@/types/action";

export function ConfirmButton({
  label,
  title,
  description,
  confirmLabel,
  onConfirm,
  redirectTo,
  tone = "danger",
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<ActionResult>;
  redirectTo?: string;
  tone?: "danger" | "default";
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button type="button" variant={tone === "default" ? "default" : "destructive"} size="sm" onClick={() => setOpen(true)}>
        {label}
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-md rounded-xl bg-card p-5 shadow-lg">
            <h2 id="confirm-title" className="text-lg font-semibold">
              {title}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">{description}</p>
            <div className="mt-5 flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Keep
              </Button>
              <Button
                type="button"
                variant={tone === "default" ? "default" : "destructive"}
                disabled={pending}
                onClick={() => {
                  startTransition(async () => {
                    const result = await onConfirm();
                    if (!result.ok) toast.error(result.message);
                    else {
                      toast.success(result.message ?? "Done.");
                      if (redirectTo) router.push(redirectTo);
                      else router.refresh();
                    }
                    setOpen(false);
                  });
                }}
              >
                {confirmLabel}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
