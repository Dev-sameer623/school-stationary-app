import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { refreshProductTotals } from "@/lib/services/catalog";
import { AppError } from "@/lib/errors";
import { PAGE_SIZE } from "@/lib/utils";
import type { OrderInput } from "@/lib/validations";
import type { OrderStatus } from "@/generated/prisma/client";

export async function listOrders(filters: {
  query: string;
  status?: OrderStatus | "ALL";
  from?: Date;
  to?: Date;
  page: number;
}) {
  const where: Prisma.OrderWhereInput = {};
  if (filters.status && filters.status !== "ALL") where.status = filters.status;
  if (filters.from || filters.to) {
    where.createdAt = {
      gte: filters.from,
      lte: filters.to,
    };
  }
  if (filters.query) {
    where.OR = [
      { orderNumber: { contains: filters.query, mode: "insensitive" } },
      { customer: { name: { contains: filters.query, mode: "insensitive" } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.order.findMany({
      where,
      include: {
        customer: true,
        createdBy: { select: { name: true } },
        items: true,
      },
      orderBy: { createdAt: "desc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.order.count({ where }),
  ]);

  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getOrder(orderNumber: string) {
  return prisma.order.findUnique({
    where: { orderNumber },
    include: {
      customer: true,
      createdBy: { select: { name: true, role: true } },
      items: { include: { product: true } },
    },
  });
}

function applyPercent(amount: Prisma.Decimal, percent: number) {
  return amount.mul(100 - percent).div(100).toDecimalPlaces(2);
}

function mergeItems(items: OrderInput["items"]) {
  const merged = new Map<string, OrderInput["items"][number]>();
  for (const item of items) {
    const key = `${item.productId}:${item.productSizeId || ""}`;
    const current = merged.get(key);
    if (current) current.quantity += item.quantity;
    else merged.set(key, { ...item, productSizeId: item.productSizeId || undefined });
  }
  return [...merged.values()];
}

export async function createOrder(input: OrderInput, userId: string) {
  const lines = mergeItems(input.items);

  return prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUnique({ where: { id: input.customerId } });
    if (!customer) throw new AppError("Customer not found.");

    await tx.$executeRaw`SELECT pg_advisory_xact_lock(1001)`;

    const productIds = [...new Set(lines.map((line) => line.productId))];
    const products = await tx.$queryRaw<
      Array<{
        id: string;
        stockQuantity: number;
        price: Prisma.Decimal;
        discountPercent: number;
        status: string;
        name: string;
        kind: string;
      }>
    >`
      SELECT id, "stockQuantity", price, "discountPercent", status, name, kind
      FROM "Product"
      WHERE id IN (${Prisma.join(productIds)})
      FOR UPDATE
    `;
    if (products.length !== productIds.length) {
      throw new AppError("One or more products were not found.");
    }
    const byId = new Map(products.map((product) => [product.id, product]));

    const sizeIds = lines.flatMap((line) => (line.productSizeId ? [line.productSizeId] : []));
    const sizes =
      sizeIds.length === 0
        ? []
        : await tx.$queryRaw<
            Array<{
              id: string;
              productId: string;
              size: string;
              price: Prisma.Decimal;
              discountPercent: number;
              stockQuantity: number;
            }>
          >`
            SELECT id, "productId", size, price, "discountPercent", "stockQuantity"
            FROM "ProductSize"
            WHERE id IN (${Prisma.join(sizeIds)})
            FOR UPDATE
          `;
    const sizeById = new Map(sizes.map((size) => [size.id, size]));

    for (const line of lines) {
      const product = byId.get(line.productId);
      if (!product) throw new AppError("One or more products were not found.");
      if (product.status !== "ACTIVE") {
        throw new AppError(`${product.name} is not available for sale.`);
      }
      if (product.kind === "UNIFORM") {
        const size = line.productSizeId ? sizeById.get(line.productSizeId) : undefined;
        if (!size || size.productId !== product.id) {
          throw new AppError(`Choose a size for ${product.name}.`);
        }
        if (size.stockQuantity < line.quantity) {
          throw new AppError(
            `${product.name} size ${size.size} only has ${size.stockQuantity} in stock.`,
          );
        }
      } else if (product.stockQuantity < line.quantity) {
        throw new AppError(`${product.name} only has ${product.stockQuantity} in stock.`);
      }
    }

    const code = input.couponCode?.trim();
    const coupon = code
      ? await tx.coupon.findUnique({ where: { code: code.toUpperCase() } })
      : null;
    if (code) {
      if (!coupon) throw new AppError("Coupon not found.");
      if (coupon.status !== "ACTIVE") throw new AppError("This coupon is not active.");
      const now = new Date();
      if (coupon.startsAt && now < coupon.startsAt) throw new AppError("This coupon is not valid yet.");
      if (coupon.endsAt && now > coupon.endsAt) throw new AppError("This coupon has expired.");
    }

    const count = await tx.order.count();
    const orderNumber = `ORD-${1001 + count}`;
    let listTotal = new Prisma.Decimal(0);
    let discountedSubtotal = new Prisma.Decimal(0);
    const itemData = lines.map((line) => {
      const product = byId.get(line.productId)!;
      const size = line.productSizeId ? sizeById.get(line.productSizeId) : undefined;
      const unitPrice = new Prisma.Decimal(size ? size.price : product.price);
      const discountPercent = size ? size.discountPercent : product.discountPercent;
      const discountedUnitPrice = applyPercent(unitPrice, discountPercent);
      const total = discountedUnitPrice.mul(line.quantity).toDecimalPlaces(2);
      listTotal = listTotal.add(unitPrice.mul(line.quantity).toDecimalPlaces(2));
      discountedSubtotal = discountedSubtotal.add(total);
      return {
        productId: line.productId,
        productSizeId: size?.id,
        sizeLabel: size?.size,
        quantity: line.quantity,
        unitPrice,
        discountPercent,
        discountedUnitPrice,
        total,
      };
    });

    const payable = coupon ? applyPercent(discountedSubtotal, coupon.percent) : discountedSubtotal;
    const order = await tx.order.create({
      data: {
        orderNumber,
        customerId: customer.id,
        createdById: userId,
        status: "PENDING",
        subtotal: listTotal,
        discountedSubtotal,
        couponId: coupon?.id,
        couponCode: coupon?.code,
        couponPercent: coupon?.percent ?? 0,
        couponAmount: discountedSubtotal.minus(payable),
        total: payable,
        items: { create: itemData },
      },
    });

    for (const line of lines) {
      const product = byId.get(line.productId)!;
      const size = line.productSizeId ? sizeById.get(line.productSizeId) : undefined;
      if (size) {
        const newStock = size.stockQuantity - line.quantity;
        size.stockQuantity = newStock;
        await tx.productSize.update({
          where: { id: size.id },
          data: { stockQuantity: newStock },
        });
        await refreshProductTotals(tx, product.id);
        await tx.stockTransaction.create({
          data: {
            productId: product.id,
            productSizeId: size.id,
            sizeLabel: size.size,
            userId,
            type: "OUT",
            quantity: line.quantity,
            previousStock: newStock + line.quantity,
            newStock,
            reason: `Order ${orderNumber}`,
          },
        });
      } else {
        const newStock = product.stockQuantity - line.quantity;
        product.stockQuantity = newStock;
        await tx.product.update({
          where: { id: product.id },
          data: { stockQuantity: newStock },
        });
        await tx.stockTransaction.create({
          data: {
            productId: product.id,
            userId,
            type: "OUT",
            quantity: line.quantity,
            previousStock: newStock + line.quantity,
            newStock,
            reason: `Order ${orderNumber}`,
          },
        });
      }
    }

    return order;
  });
}

export async function cancelOrder(orderId: string, userId: string) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
      include: { items: true },
    });
    if (!order) throw new AppError("Order not found.");
    if (order.status === "CANCELLED") {
      throw new AppError("This order is already cancelled.");
    }

    const productIds = [...new Set(order.items.map((item) => item.productId))];
    await tx.$queryRaw`
      SELECT id FROM "Product" WHERE id IN (${Prisma.join(productIds)}) FOR UPDATE
    `;
    const sizeIds = order.items.flatMap((item) => (item.productSizeId ? [item.productSizeId] : []));
    if (sizeIds.length > 0) {
      await tx.$queryRaw`
        SELECT id FROM "ProductSize" WHERE id IN (${Prisma.join(sizeIds)}) FOR UPDATE
      `;
    }

    for (const item of order.items) {
      if (item.productSizeId) {
        const size = await tx.productSize.findUnique({ where: { id: item.productSizeId } });
        if (!size) throw new AppError("A size on this order no longer exists.");
        const newStock = size.stockQuantity + item.quantity;
        await tx.productSize.update({
          where: { id: size.id },
          data: { stockQuantity: newStock },
        });
        await refreshProductTotals(tx, item.productId);
        await tx.stockTransaction.create({
          data: {
            productId: item.productId,
            productSizeId: size.id,
            sizeLabel: item.sizeLabel ?? size.size,
            userId,
            type: "IN",
            quantity: item.quantity,
            previousStock: size.stockQuantity,
            newStock,
            reason: `Cancel order ${order.orderNumber}`,
          },
        });
        continue;
      }

      const product = await tx.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new AppError("A product on this order no longer exists.");
      const newStock = product.stockQuantity + item.quantity;
      await tx.product.update({
        where: { id: product.id },
        data: { stockQuantity: newStock },
      });
      await tx.stockTransaction.create({
        data: {
          productId: product.id,
          userId,
          type: "IN",
          quantity: item.quantity,
          previousStock: product.stockQuantity,
          newStock,
          reason: `Cancel order ${order.orderNumber}`,
        },
      });
    }

    return tx.order.update({
      where: { id: order.id },
      data: { status: "CANCELLED" },
    });
  });
}

export async function completeOrder(orderId: string) {
  const order = await prisma.order.findUnique({ where: { id: orderId } });
  if (!order) throw new AppError("Order not found.");
  if (order.status !== "PENDING") {
    throw new AppError("Only a pending order can be completed.");
  }
  return prisma.order.update({
    where: { id: order.id },
    data: { status: "COMPLETED" },
  });
}
