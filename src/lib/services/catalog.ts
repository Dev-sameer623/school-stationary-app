import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { deleteStoredImage } from "@/lib/images";
import type { StockStatus } from "@/lib/format";
import { PAGE_SIZE } from "@/lib/utils";
import type { CategoryInput, ProductInput, ProductUpdateInput } from "@/lib/validations";

function uniqueMessage(error: unknown, label: string): never {
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    throw new AppError(`${label} already exists.`);
  }
  throw error;
}

export async function listCategories(query: string, page: number) {
  const where: Prisma.CategoryWhereInput = query
    ? { name: { contains: query, mode: "insensitive" } }
    : {};
  const [items, total] = await Promise.all([
    prisma.category.findMany({
      where,
      include: { _count: { select: { products: true } } },
      orderBy: { name: "asc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.category.count({ where }),
  ]);
  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function createCategory(input: CategoryInput) {
  try {
    return await prisma.category.create({
      data: {
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    uniqueMessage(error, "A category with this name");
  }
}

export async function updateCategory(id: string, input: CategoryInput) {
  try {
    return await prisma.category.update({
      where: { id },
      data: {
        name: input.name,
        description: input.description || null,
      },
    });
  } catch (error) {
    uniqueMessage(error, "A category with this name");
  }
}

export async function deleteCategory(id: string) {
  const category = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { products: true } } },
  });
  if (!category) throw new AppError("Category not found.");
  if (category._count.products > 0) {
    throw new AppError("Move or delete the products in this category before deleting it.");
  }
  await prisma.category.delete({ where: { id } });
  await deleteStoredImage(category.imageUrl);
}

export async function setCategoryImage(id: string, imageUrl: string | null) {
  const category = await prisma.category.findUnique({ where: { id }, select: { imageUrl: true } });
  if (!category) throw new AppError("Category not found.");
  const updated = await prisma.category.update({ where: { id }, data: { imageUrl } });
  if (category.imageUrl !== imageUrl) await deleteStoredImage(category.imageUrl);
  return updated;
}

async function productIdsForStock(status: StockStatus) {
  const condition =
    status === "OUT_OF_STOCK"
      ? Prisma.sql`"stockQuantity" <= 0`
      : status === "LOW_STOCK"
        ? Prisma.sql`"stockQuantity" > 0 AND "stockQuantity" <= "minimumStock"`
        : Prisma.sql`"stockQuantity" > "minimumStock"`;

  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT id FROM "Product" WHERE ${condition}
  `;
  return rows.map((row) => row.id);
}

export async function listProducts(filters: {
  query: string;
  categoryId?: string;
  stockStatus?: StockStatus | "ALL";
  page: number;
}) {
  const where: Prisma.ProductWhereInput = {};
  if (filters.query) {
    where.OR = [
      { name: { contains: filters.query, mode: "insensitive" } },
      { sku: { contains: filters.query, mode: "insensitive" } },
    ];
  }
  if (filters.categoryId) where.categoryId = filters.categoryId;
  if (filters.stockStatus && filters.stockStatus !== "ALL") {
    const ids = await productIdsForStock(filters.stockStatus);
    where.id = { in: ids };
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: { category: true },
      orderBy: { name: "asc" },
      skip: (filters.page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
    prisma.product.count({ where }),
  ]);

  return { items, total, pageCount: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getProduct(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: { category: true, sizes: { orderBy: { size: "asc" } } },
  });
}

export async function refreshProductTotals(tx: Prisma.TransactionClient, productId: string) {
  const product = await tx.product.findUnique({
    where: { id: productId },
    select: { kind: true },
  });
  if (!product || product.kind !== "UNIFORM") return;
  const sizes = await tx.productSize.findMany({ where: { productId } });
  const rolled = rollupSizes(
    sizes.map((size) => ({
      price: Number(size.price),
      stockQuantity: size.stockQuantity,
      minimumStock: size.minimumStock,
    })),
  );
  await tx.product.update({ where: { id: productId }, data: rolled });
}

function rollupSizes(sizes: Array<{ price: number; stockQuantity: number; minimumStock: number }>) {
  const stockQuantity = sizes.reduce((sum, size) => sum + size.stockQuantity, 0);
  const price = Math.min(...sizes.map((size) => size.price));
  const anyLow = sizes.some(
    (size) => size.stockQuantity > 0 && size.stockQuantity <= size.minimumStock,
  );
  return {
    price,
    stockQuantity,
    minimumStock: stockQuantity > 0 && anyLow ? stockQuantity : 0,
  };
}

export async function createProduct(input: ProductInput, userId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const uniform = input.kind === "UNIFORM";
      const rolled = uniform ? rollupSizes(input.sizes) : null;
      const product = await tx.product.create({
        data: {
          sku: input.sku.toUpperCase(),
          name: input.name,
          description: input.description || null,
          categoryId: input.categoryId,
          kind: input.kind,
          price: rolled?.price ?? input.price,
          stockQuantity: rolled?.stockQuantity ?? input.stockQuantity,
          minimumStock: rolled?.minimumStock ?? input.minimumStock,
          status: input.status,
        },
      });

      if (uniform) {
        for (const size of input.sizes) {
          const created = await tx.productSize.create({
            data: {
              productId: product.id,
              size: size.size,
              price: size.price,
              stockQuantity: size.stockQuantity,
              minimumStock: size.minimumStock,
            },
          });
          if (size.stockQuantity > 0) {
            await tx.stockTransaction.create({
              data: {
                productId: product.id,
                productSizeId: created.id,
                sizeLabel: created.size,
                userId,
                type: "IN",
                quantity: size.stockQuantity,
                previousStock: 0,
                newStock: size.stockQuantity,
                reason: "Initial stock",
              },
            });
          }
        }
      } else if (input.stockQuantity > 0) {
        await tx.stockTransaction.create({
          data: {
            productId: product.id,
            userId,
            type: "IN",
            quantity: input.stockQuantity,
            previousStock: 0,
            newStock: input.stockQuantity,
            reason: "Initial stock",
          },
        });
      }

      return product;
    });
  } catch (error) {
    uniqueMessage(error, "SKU");
  }
}

export async function updateProduct(id: string, input: ProductUpdateInput, userId: string) {
  try {
    return await prisma.$transaction(async (tx) => {
      const current = await tx.product.findUnique({
        where: { id },
        include: { sizes: true },
      });
      if (!current) throw new AppError("Product not found.");

      if (input.kind === "STATIONERY") {
        return tx.product.update({
          where: { id },
          data: {
            sku: input.sku.toUpperCase(),
            name: input.name,
            description: input.description || null,
            categoryId: input.categoryId,
            kind: "STATIONERY",
            price: input.price,
            minimumStock: input.minimumStock,
            status: input.status,
          },
        });
      }

      const existing = new Map(current.sizes.map((size) => [size.id, size]));
      for (const size of input.sizes) {
        if (size.id && existing.has(size.id)) {
          await tx.productSize.update({
            where: { id: size.id },
            data: { size: size.size, price: size.price, minimumStock: size.minimumStock },
          });
        } else {
          const created = await tx.productSize.create({
            data: {
              productId: id,
              size: size.size,
              price: size.price,
              stockQuantity: size.stockQuantity,
              minimumStock: size.minimumStock,
            },
          });
          if (size.stockQuantity > 0) {
            await tx.stockTransaction.create({
              data: {
                productId: id,
                productSizeId: created.id,
                sizeLabel: created.size,
                userId,
                type: "IN",
                quantity: size.stockQuantity,
                previousStock: 0,
                newStock: size.stockQuantity,
                reason: "Initial stock",
              },
            });
          }
        }
      }

      const sizes = await tx.productSize.findMany({ where: { productId: id } });
      const rolled = rollupSizes(
        sizes.map((size) => ({
          price: Number(size.price),
          stockQuantity: size.stockQuantity,
          minimumStock: size.minimumStock,
        })),
      );
      return tx.product.update({
        where: { id },
        data: {
          sku: input.sku.toUpperCase(),
          name: input.name,
          description: input.description || null,
          categoryId: input.categoryId,
          kind: "UNIFORM",
          price: rolled.price,
          stockQuantity: rolled.stockQuantity,
          minimumStock: rolled.minimumStock,
          status: input.status,
        },
      });
    });
  } catch (error) {
    uniqueMessage(error, "SKU");
  }
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: { _count: { select: { orderItems: true } } },
  });
  if (!product) throw new AppError("Product not found.");
  if (product._count.orderItems > 0) {
    throw new AppError("This product is on an order and cannot be deleted.");
  }
  await prisma.product.delete({ where: { id } });
  await deleteStoredImage(product.imageUrl);
}

export async function setProductImage(id: string, imageUrl: string | null) {
  const product = await prisma.product.findUnique({ where: { id }, select: { imageUrl: true } });
  if (!product) throw new AppError("Product not found.");
  const updated = await prisma.product.update({ where: { id }, data: { imageUrl } });
  if (product.imageUrl !== imageUrl) await deleteStoredImage(product.imageUrl);
  return updated;
}
