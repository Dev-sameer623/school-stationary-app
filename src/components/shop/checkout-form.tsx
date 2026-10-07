"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { placeOnlineOrder } from "@/actions/shop";
import { clearCart, readCart } from "@/components/shop/cart-store";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Textarea } from "@/components/ui/field";

export function CheckoutForm({ customer }: { customer: { name: string; email: string | null; phone: string | null } }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [errors, setErrors] = useState<Record<string, string[]>>({});

  return (
    <form
      className="grid max-w-lg gap-4"
      onSubmit={async (event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        setPending(true);
        const result = await placeOnlineOrder({
          pickupNote: form.get("pickupNote"),
          couponCode: form.get("couponCode"),
          items: readCart(),
        });
        setPending(false);
        if (!result.ok) {
          setErrors(result.fieldErrors ?? {});
          toast.error(result.message);
          return;
        }
        clearCart();
        router.push(`/account/orders/${result.data?.orderNumber}?placed=1`);
      }}
    >
      <div className="rounded-2xl border border-border bg-card p-4 text-sm">
        <p className="font-medium">{customer.name}</p>
        <p className="text-muted-foreground">{customer.email}</p>
        <p className="text-muted-foreground">{customer.phone || "No phone on the account"}</p>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="pickupNote">When will you visit?</Label>
        <Textarea id="pickupNote" name="pickupNote" placeholder="Today after 4 pm" />
        <FieldError message={errors.pickupNote?.[0]} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="couponCode">Coupon</Label>
        <Input id="couponCode" name="couponCode" placeholder="Optional" />
        <FieldError message={errors.couponCode?.[0]} />
      </div>
      <FieldError message={errors.items?.[0]} />
      <Button type="submit" disabled={pending}>
        {pending ? "Placing order..." : "Place order"}
      </Button>
      <p className="text-sm text-muted-foreground">No payment now. The shop prepares the order, and you pay when you collect it.</p>
    </form>
  );
}
