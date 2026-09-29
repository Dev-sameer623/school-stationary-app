import { Prisma, type OrderStatus } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { stockStatus } from "@/lib/format";

export type ReportFilters = {
  from?: Date;
  to?: Date;
  productId?: string;
  categoryId?: string;
  userId?: string;
  status?: OrderStatus;
};

function orderWhere(filters: ReportFilters): Prisma.OrderWhereInput {
  const where: Prisma.OrderWhereInput = {};
  if (filters.from || filters.to) {
    where.createdAt = { gte: filters.from, lte: filters.to };
  }
  if (filters.userId) where.createdById = filters.userId;
  if (filters.status) where.status = filters.status;
  if (filters.productId || filters.categoryId) {
    where.items = {
      some: {
        ...(filters.productId ? { productId: filters.productId } : {}),
        ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
      },
    };
  }
  return where;
}

export async function salesReport(filters: ReportFilters) {
  return prisma.order.findMany({
    where: orderWhere(filters),
    include: {
      customer: true,
      createdBy: { select: { name: true } },
      items: { include: { product: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}

export async function stockReport(filters: ReportFilters) {
  const products = await prisma.product.findMany({
    where: {
      ...(filters.productId ? { id: filters.productId } : {}),
      ...(filters.categoryId ? { categoryId: filters.categoryId } : {}),
    },
    include: { category: true, sizes: { orderBy: { size: "asc" } } },
    orderBy: { name: "asc" },
  });

  return products.map((product) => ({
    ...product,
    stockStatus: stockStatus(product.stockQuantity, product.minimumStock),
  }));
}

export async function movementReport(filters: ReportFilters) {
  return prisma.stockTransaction.findMany({
    where: {
      ...(filters.productId ? { productId: filters.productId } : {}),
      ...(filters.userId ? { userId: filters.userId } : {}),
      ...(filters.categoryId ? { product: { categoryId: filters.categoryId } } : {}),
      ...(filters.from || filters.to
        ? { createdAt: { gte: filters.from, lte: filters.to } }
        : {}),
    },
    include: {
      product: true,
      user: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 200,
  });
}
