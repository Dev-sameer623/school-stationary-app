import { prisma } from "@/lib/db/prisma";
import { priceAfterPercent } from "@/lib/pricing";
import { money } from "@/lib/format";
import type { CartLine } from "@/components/shop/cart-store";

export async function listShopCategories() {
  return prisma.category.findMany({
    where: { products: { some: { status: "ACTIVE" } } },
    orderBy: { name: "asc" },
    select: { id: true, name: true, imageUrl: true },
  });
}

export async function listShopProducts(categoryId?: string, query?: string) {
  const term = query?.trim();
  return prisma.product.findMany({
    where: {
      status: "ACTIVE",
      ...(categoryId ? { categoryId } : {}),
      ...(term ? { name: { contains: term, mode: "insensitive" } } : {}),
    },
    include: {
      category: { select: { id: true, name: true } },
      sizes: { orderBy: { size: "asc" } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getShopProduct(id: string) {
  return prisma.product.findFirst({
    where: { id, status: "ACTIVE" },
    include: {
      category: { select: { id: true, name: true } },
      sizes: { orderBy: { size: "asc" } },
    },
  });
}

export function displayPrice(listPrice: { toString(): string } | number, percent: number) {
  return priceAfterPercent(money(listPrice), percent);
}

export async function quoteCart(lines: CartLine[]) {
  const ids = [...new Set(lines.map((line) => line.productId))];
  const products = await prisma.product.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    include: { sizes: true },
  });
  const byId = new Map(products.map((product) => [product.id, product]));
  return lines.map((line) => {
    const product = byId.get(line.productId);
    if (!product) return { ...line, name: "Unavailable", sizeLabel: null, unit: 0, total: 0, available: 0 };
    const size = line.productSizeId ? product.sizes.find((item) => item.id === line.productSizeId) : undefined;
    const unit = size ? displayPrice(size.price, size.discountPercent) : displayPrice(product.price, product.discountPercent);
    const available = size ? size.stockQuantity : product.stockQuantity;
    return {
      ...line,
      name: product.name,
      sizeLabel: size?.size ?? null,
      unit,
      total: Math.round(unit * line.quantity * 100) / 100,
      available,
    };
  });
}

export function remainingStock(product: {
  kind: string;
  stockQuantity: number;
  sizes: Array<{ stockQuantity: number }>;
}) {
  if (product.kind === "UNIFORM" && product.sizes.length > 0) {
    return product.sizes.reduce((sum, size) => sum + size.stockQuantity, 0);
  }
  return product.stockQuantity;
}

export function productFromPrice(product: {
  kind: string;
  price: { toString(): string } | number;
  discountPercent: number;
  sizes: Array<{ price: { toString(): string } | number; discountPercent: number }>;
}) {
  if (product.kind === "UNIFORM" && product.sizes.length > 0) {
    return Math.min(...product.sizes.map((size) => displayPrice(size.price, size.discountPercent)));
  }
  return displayPrice(product.price, product.discountPercent);
}
