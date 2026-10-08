"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { completeOrderAction } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";

export function CollectOrder({ orderId, orderNumber }: { orderId: string; orderNumber: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"CASH" | "UPI">("CASH");
  const [pending, startTransition] = useTransition();

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Collect payment
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form
            role="dialog"
            aria-modal="true"
            aria-labelledby="collect-title"
            className="grid w-full max-w-md gap-3 rounded-xl bg-card p-5 shadow-lg"
            onSubmit={(event) => {
              event.preventDefault();
              startTransition(async () => {
                const result = await completeOrderAction(orderId, method);
                if (!result.ok) toast.error(result.message);
                else {
                  toast.success(result.message ?? "Collected.");
                  router.refresh();
                  setOpen(false);
                }
              });
            }}
          >
            <h2 id="collect-title" className="text-lg font-semibold">
              Collect {orderNumber}
            </h2>
            <p className="text-sm text-muted-foreground">
              Record how the customer paid at the shop. The amount due does not change.
            </p>
            <div className="grid gap-1.5">
              <Label htmlFor="paymentMethod">Paid by</Label>
              <Select id="paymentMethod" value={method} onChange={(event) => setMethod(event.target.value as "CASH" | "UPI")}>
                <option value="CASH">Cash</option>
                <option value="UPI">UPI</option>
              </Select>
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Keep
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? "Saving..." : "Record payment"}
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
