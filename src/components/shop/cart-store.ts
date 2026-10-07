export type CartLine = {
  productId: string;
  productSizeId?: string;
  quantity: number;
};

const KEY = "shop-cart";

export function readCart(): CartLine[] {
  if (typeof window === "undefined") return [];
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) || "[]") as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((line) => {
      if (!line || typeof line !== "object") return [];
      const item = line as Partial<CartLine>;
      if (typeof item.productId !== "string" || typeof item.quantity !== "number" || item.quantity < 1) return [];
      return [{ productId: item.productId, productSizeId: item.productSizeId || undefined, quantity: item.quantity }];
    });
  } catch {
    return [];
  }
}

export function writeCart(lines: CartLine[]) {
  window.localStorage.setItem(KEY, JSON.stringify(lines));
  window.dispatchEvent(new Event("shop-cart"));
}

export function addCartLine(line: CartLine) {
  const lines = readCart();
  const match = lines.find(
    (item) => item.productId === line.productId && (item.productSizeId || "") === (line.productSizeId || ""),
  );
  if (match) match.quantity += line.quantity;
  else lines.push(line);
  writeCart(lines);
}

export function clearCart() {
  writeCart([]);
}
