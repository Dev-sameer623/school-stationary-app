"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { loadCartQuote } from "@/actions/shop";
import { readCart, writeCart, type CartLine } from "@/components/shop/cart-store";
import { Button } from "@/components/ui/button";
import { formatInr } from "@/lib/format";

type Quoted = Awaited<ReturnType<typeof loadCartQuote>>[number];

export function CartView() {
  const [lines, setLines] = useState<Quoted[]>([]);

  useEffect(() => {
    let active = true;
    loadCartQuote(readCart()).then((quoted) => {
      if (active) setLines(quoted);
    });
    return () => {
      active = false;
    };
  }, []);

  function update(next: CartLine[]) {
    writeCart(next);
    loadCartQuote(next).then(setLines);
  }

  const total = lines.reduce((sum, line) => sum + line.total, 0);

  if (lines.length === 0) {
    return (
      <p className="text-muted-foreground">
        Your cart is empty. <Link className="text-primary" href="/">Browse products</Link>
      </p>
    );
  }

  return (
    <div className="grid gap-4">
      <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
        {lines.map((line) => (
          <li key={`${line.productId}-${line.productSizeId ?? ""}`} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
            <div>
              <p className="font-medium">{line.name}</p>
              <p className="text-sm text-muted-foreground">
                {line.sizeLabel ? `Size ${line.sizeLabel} · ` : ""}
                {formatInr(line.unit)} each
                {line.quantity > line.available ? ` · only ${line.available} in stock` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={line.quantity}
                aria-label={`Quantity for ${line.name}`}
                className="h-10 w-20 rounded-md border border-border px-2"
                onChange={(event) => {
                  const quantity = Number(event.target.value);
                  if (quantity < 1) return;
                  update(
                    lines.map((item) =>
                      item.productId === line.productId && item.productSizeId === line.productSizeId
                        ? { productId: item.productId, productSizeId: item.productSizeId, quantity }
                        : { productId: item.productId, productSizeId: item.productSizeId, quantity: item.quantity },
                    ),
                  );
                }}
              />
              <p className="w-24 text-right">{formatInr(line.total)}</p>
              <button
                type="button"
                className="text-sm text-destructive"
                onClick={() =>
                  update(
                    lines
                      .filter((item) => !(item.productId === line.productId && item.productSizeId === line.productSizeId))
                      .map((item) => ({ productId: item.productId, productSizeId: item.productSizeId, quantity: item.quantity })),
                  )
                }
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between">
        <p className="text-lg font-semibold">Subtotal {formatInr(total)}</p>
        <Button asChild>
          <Link href="/checkout">Checkout</Link>
        </Button>
      </div>
      <p className="text-sm text-muted-foreground">A coupon, if you have one, is applied at checkout. Pay when you collect the goods.</p>
    </div>
  );
}
