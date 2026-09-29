import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { refreshProductTotals } from "@/lib/services/catalog";
import { AppError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/utils";
import type { StockChangeInput } from "@/lib/validations";

export async function listStock(query: string, page: number) {
  const where: Prisma.ProductWhereInput = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { sku: { contains: query, mode: "insensitive" } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { sizes: { orderBy: { size: "asc" } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function listStockHistory(page: number) {
  const [items, total] = await Promise.all([
    prisma.stockTransaction.findMany({
      include: {
        product: true,
        user: { select: { name: true, role: true } },
      },
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.stockTransaction.count(),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function changeStock(input: StockChangeInput, userId: string) {
  return prisma.$transaction(async (tx) => {
    const rows = await tx.$queryRaw<
      Array<{ id: string; stockQuantity: number; name: string; kind: string }>
    >`
      SELECT id, "stockQuantity", name, kind
      FROM "Product"
      WHERE id = ${input.productId}
      FOR UPDATE
    `;
    const product = rows[0];
    if (!product) throw new AppError("Product not found.");
    if (product.kind === "UNIFORM" && !input.productSizeId) {
      throw new AppError("Choose a size before changing stock.");
    }

    if (input.productSizeId) {
      const sizes = await tx.$queryRaw<
        Array<{ id: string; size: string; stockQuantity: number; productId: string }>
      >`
        SELECT id, size, "stockQuantity", "productId"
        FROM "ProductSize"
        WHERE id = ${input.productSizeId}
        FOR UPDATE
      `;
      const size = sizes[0];
      if (!size || size.productId !== product.id) throw new AppError("Size not found.");
      let newStock = size.stockQuantity;
      let recorded = input.quantity;
      if (input.type === "IN") newStock = size.stockQuantity + input.quantity;
      else if (input.type === "OUT") newStock = size.stockQuantity - input.quantity;
      else {
        newStock = input.quantity;
        recorded = Math.abs(newStock - size.stockQuantity);
      }
      if (newStock < 0) throw new AppError("Stock cannot go below zero.");
      await tx.productSize.update({ where: { id: size.id }, data: { stockQuantity: newStock } });
      await refreshProductTotals(tx, product.id);
      await tx.stockTransaction.create({
        data: {
          productId: product.id,
          productSizeId: size.id,
          sizeLabel: size.size,
          userId,
          type: input.type,
          quantity: recorded,
          previousStock: size.stockQuantity,
          newStock,
          reason: input.reason,
        },
      });
      return { name: `${product.name} size ${size.size}`, previousStock: size.stockQuantity, newStock };
    }

    let newStock = product.stockQuantity;
    let recorded = input.quantity;
    if (input.type === "IN") newStock = product.stockQuantity + input.quantity;
    else if (input.type === "OUT") newStock = product.stockQuantity - input.quantity;
    else {
      newStock = input.quantity;
      recorded = Math.abs(newStock - product.stockQuantity);
    }
    if (newStock < 0) throw new AppError("Stock cannot go below zero.");
    await tx.product.update({ where: { id: product.id }, data: { stockQuantity: newStock } });
    await tx.stockTransaction.create({
      data: {
        productId: product.id,
        userId,
        type: input.type,
        quantity: recorded,
        previousStock: product.stockQuantity,
        newStock,
        reason: input.reason,
      },
    });
    return { name: product.name, previousStock: product.stockQuantity, newStock };
  });
}
