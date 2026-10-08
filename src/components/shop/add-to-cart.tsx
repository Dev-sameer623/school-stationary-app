"use client";

import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { addCartLine } from "@/components/shop/cart-store";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/field";

export function AddToCart({
  signedIn,
  productId,
  kind,
  stock,
  sizes,
}: {
  signedIn: boolean;
  productId: string;
  kind: "STATIONERY" | "UNIFORM";
  stock: number;
  sizes: Array<{ id: string; size: string; stockQuantity: number; priceLabel: string }>;
}) {
  const [sizeId, setSizeId] = useState(sizes[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const loginHref = `/account/login?next=${encodeURIComponent(`/shop/${productId}`)}`;
  const anyLeft = kind === "UNIFORM" ? sizes.some((size) => size.stockQuantity > 0) : stock > 0;
  const selected = sizes.find((size) => size.id === sizeId);
  const available = kind === "UNIFORM" ? (selected?.stockQuantity ?? 0) : stock;

  if (!anyLeft) return null;

  if (!signedIn) {
    return (
      <Button asChild>
        <Link href={loginHref}>Log in to add to cart</Link>
      </Button>
    );
  }

  return (
    <form
      className="grid max-w-sm gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        if (available < 1) return;
        if (kind === "UNIFORM" && !sizeId) {
          toast.error("Choose a size.");
          return;
        }
        addCartLine({ productId, productSizeId: kind === "UNIFORM" ? sizeId : undefined, quantity });
        toast.success("Added to cart.");
      }}
    >
      {kind === "UNIFORM" ? (
        <div className="grid gap-1.5">
          <Label htmlFor="size">Size</Label>
          <Select
            id="size"
            value={sizeId}
            onChange={(event) => {
              const nextId = event.target.value;
              setSizeId(nextId);
              const nextAvailable = sizes.find((size) => size.id === nextId)?.stockQuantity ?? 0;
              setQuantity((current) => Math.max(1, Math.min(current, nextAvailable || 1)));
            }}
          >
            {sizes.map((size) => (
              <option key={size.id} value={size.id}>
                {size.size} · {size.priceLabel} · {size.stockQuantity > 0 ? `${size.stockQuantity} in stock` : "Out of stock"}
              </option>
            ))}
          </Select>
          <p className="text-sm text-muted-foreground">{available > 0 ? `${available} in stock` : "Out of stock"}</p>
        </div>
      ) : null}
      {available > 0 ? (
        <>
          <div className="grid gap-1.5">
            <Label htmlFor="quantity">Quantity</Label>
            <input
              id="quantity"
              type="number"
              min={1}
              max={available}
              value={quantity}
              onChange={(event) => setQuantity(Number(event.target.value))}
              className="h-10 w-24 rounded-md border border-border bg-card px-3 text-sm"
            />
          </div>
          <Button type="submit">Add to cart</Button>
        </>
      ) : null}
    </form>
  );
}
