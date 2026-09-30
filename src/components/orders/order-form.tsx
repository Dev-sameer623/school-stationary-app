"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useFieldArray, useForm, useWatch, type Resolver } from "react-hook-form";
import { toast } from "sonner";
import { saveOrder } from "@/actions/orders";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select } from "@/components/ui/field";
import { formatInr } from "@/lib/format";
import { priceAfterPercent } from "@/lib/pricing";
import { orderSchema } from "@/lib/validations";
import type { z } from "zod";

type Values = z.infer<typeof orderSchema>;

type SaleProduct = {
  id: string;
  name: string;
  sku: string;
  kind: "STATIONERY" | "UNIFORM";
  price: number;
  discountPercent: number;
  stockQuantity: number;
  sizes: Array<{ id: string; size: string; price: number; discountPercent: number; stockQuantity: number }>;
};

type CouponPreview = {
  code: string;
  percent: number;
  startsAt: string | null;
  endsAt: string | null;
};

export function OrderForm({
  customers,
  products,
  coupons,
}: {
  customers: Array<{ id: string; name: string }>;
  products: SaleProduct[];
  coupons: CouponPreview[];
}) {
  const router = useRouter();
  const form = useForm<Values>({
    resolver: zodResolver(orderSchema) as Resolver<Values>,
    defaultValues: {
      customerId: customers[0]?.id ?? "",
      couponCode: "",
      items: [{ productId: products[0]?.id ?? "", productSizeId: "", quantity: 1 }],
    },
  });
  const items = useFieldArray({ control: form.control, name: "items" });
  const watched = useWatch({ control: form.control, name: "items" });
  const couponCode = useWatch({ control: form.control, name: "couponCode" });
  const lines = (watched ?? []).map((item) => {
    const product = products.find((entry) => entry.id === item.productId);
    const size = product?.sizes.find((entry) => entry.id === item.productSizeId);
    const listUnit = product?.kind === "UNIFORM" ? (size?.price ?? 0) : (product?.price ?? 0);
    const percent = product?.kind === "UNIFORM" ? (size?.discountPercent ?? 0) : (product?.discountPercent ?? 0);
    const quantity = Number(item.quantity || 0);
    const discountedUnit = priceAfterPercent(listUnit, percent);
    return {
      list: Math.round(listUnit * quantity * 100) / 100,
      discounted: Math.round(discountedUnit * quantity * 100) / 100,
    };
  });
  const listTotal = lines.reduce((sum, line) => sum + line.list, 0);
  const discountedSubtotal = lines.reduce((sum, line) => sum + line.discounted, 0);
  const typedCode = couponCode?.trim().toUpperCase() ?? "";
  const now = new Date();
  const coupon = coupons.find((entry) => entry.code === typedCode);
  const couponReady =
    !typedCode ||
    (coupon &&
      (!coupon.startsAt || now >= new Date(coupon.startsAt)) &&
      (!coupon.endsAt || now <= new Date(coupon.endsAt)));
  const couponPercent = typedCode && coupon && couponReady ? coupon.percent : 0;
  const amountDue = priceAfterPercent(discountedSubtotal, couponPercent);

  async function onSubmit(values: Values) {
    for (const item of values.items) {
      const product = products.find((entry) => entry.id === item.productId);
      if (product?.kind === "UNIFORM" && !item.productSizeId) {
        toast.error(`Choose a size for ${product.name}.`);
        return;
      }
    }
    const result = await saveOrder(values);
    if (!result.ok || !result.data) {
      toast.error(result.ok ? "Could not create the order." : result.message);
      return;
    }
    toast.success(result.message);
    router.push(`/orders/${result.data.orderNumber}`);
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid max-w-3xl gap-4 rounded-xl border border-border bg-card p-5">
      <div className="grid gap-1.5">
        <Label htmlFor="customerId">Customer</Label>
        <Select id="customerId" {...form.register("customerId")}>
          {customers.map((customer) => (
            <option key={customer.id} value={customer.id}>
              {customer.name}
            </option>
          ))}
        </Select>
        <FieldError message={form.formState.errors.customerId?.message} />
      </div>
      <div className="grid gap-3">
        {items.fields.map((field, index) => {
          const selected = products.find((product) => product.id === watched?.[index]?.productId);
          return (
            <div key={field.id} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_8rem_8rem_auto]">
              <div className="grid gap-1.5">
                <Label htmlFor={`product-${index}`}>Product</Label>
                <Select
                  id={`product-${index}`}
                  {...form.register(`items.${index}.productId`, {
                    onChange: () => form.setValue(`items.${index}.productSizeId`, ""),
                  })}
                >
                  {products.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.sku})
                      {product.kind === "UNIFORM" ? " — sizes" : ` — ${product.stockQuantity} in stock`}
                    </option>
                  ))}
                </Select>
              </div>
              {selected?.kind === "UNIFORM" ? (
                <div className="grid gap-1.5">
                  <Label htmlFor={`size-${index}`}>Size</Label>
                  <Select id={`size-${index}`} {...form.register(`items.${index}.productSizeId`)}>
                    <option value="">Choose</option>
                    {selected.sizes.map((size) => (
                      <option key={size.id} value={size.id}>
                        {size.size} — {formatInr(priceAfterPercent(size.price, size.discountPercent))} ({size.stockQuantity})
                      </option>
                    ))}
                  </Select>
                </div>
              ) : (
                <div className="grid gap-1.5">
                  <Label>Size</Label>
                  <Input value="—" readOnly />
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor={`qty-${index}`}>Quantity</Label>
                <Input id={`qty-${index}`} type="number" min="1" step="1" {...form.register(`items.${index}.quantity`)} />
                <FieldError message={form.formState.errors.items?.[index]?.quantity?.message} />
              </div>
              <div className="flex items-end">
                <Button type="button" variant="outline" onClick={() => items.remove(index)} disabled={items.fields.length === 1}>
                  Remove
                </Button>
              </div>
            </div>
          );
        })}
        <Button
          type="button"
          variant="outline"
          onClick={() => items.append({ productId: products[0]?.id ?? "", productSizeId: "", quantity: 1 })}
        >
          Add item
        </Button>
        <FieldError message={form.formState.errors.items?.message} />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="couponCode">Coupon code</Label>
        <Input id="couponCode" {...form.register("couponCode")} placeholder="Optional" />
        {typedCode && !couponReady ? <FieldError message="This coupon cannot be used." /> : null}
      </div>
      <div className="max-w-xs space-y-1 text-sm">
        <p className="flex justify-between"><span>List total</span><span>{formatInr(listTotal)}</span></p>
        <p className="flex justify-between"><span>After item discounts</span><span>{formatInr(discountedSubtotal)}</span></p>
        {couponPercent > 0 ? (
          <p className="flex justify-between"><span>Coupon {coupon?.code} ({couponPercent}%)</span><span>{formatInr(discountedSubtotal - amountDue)}</span></p>
        ) : null}
        <p className="flex justify-between font-serif text-lg"><span>Amount due</span><span>{formatInr(amountDue)}</span></p>
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={form.formState.isSubmitting || products.length === 0 || customers.length === 0}>
          Create order
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
