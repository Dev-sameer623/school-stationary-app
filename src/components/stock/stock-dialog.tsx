"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { saveStockChange } from "@/actions/stock";
import { Button } from "@/components/ui/button";
import { FieldError, Input, Label, Select, Textarea } from "@/components/ui/field";

export function StockDialog({
  product,
}: {
  product: { id: string; name: string; stockQuantity: number; productSizeId?: string };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string>();
  const [pending, setPending] = useState(false);

  async function onSubmit(formData: FormData) {
    setPending(true);
    const result = await saveStockChange({
      productId: product.id,
      productSizeId: product.productSizeId ?? "",
      type: formData.get("type"),
      quantity: formData.get("quantity"),
      reason: formData.get("reason"),
    });
    setPending(false);
    if (!result.ok) {
      setError(result.message);
      toast.error(result.message);
      return;
    }
    toast.success(result.message);
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <Button type="button" size="sm" variant="outline" onClick={() => setOpen(true)}>
        Update
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form action={onSubmit} className="grid w-full max-w-md gap-3 rounded-xl bg-card p-5">
            <h2 className="text-lg font-semibold">Update {product.name}</h2>
            <p className="text-sm text-muted-foreground">Current stock: {product.stockQuantity}</p>
            <div className="grid gap-1.5">
              <Label htmlFor={`type-${product.id}`}>Type</Label>
              <Select id={`type-${product.id}`} name="type" defaultValue="IN">
                <option value="IN">Add stock (IN)</option>
                <option value="OUT">Remove stock (OUT)</option>
                <option value="ADJUSTMENT">Set stock (ADJUSTMENT)</option>
              </Select>
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`qty-${product.id}`}>Quantity</Label>
              <Input id={`qty-${product.id}`} name="quantity" type="number" min="0" step="1" required />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor={`reason-${product.id}`}>Reason</Label>
              <Textarea id={`reason-${product.id}`} name="reason" required placeholder="Delivery, damage, count correction..." />
            </div>
            <FieldError message={error} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Close
              </Button>
              <Button type="submit" disabled={pending}>
                Save
              </Button>
            </div>
          </form>
        </div>
      ) : null}
    </>
  );
}
