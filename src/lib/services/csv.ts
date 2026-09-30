import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db/prisma";
import { AppError } from "@/lib/errors";
import { formatDate, money, stockStatus, stockStatusLabel } from "@/lib/format";
import { priceAfterPercent } from "@/lib/pricing";

const PRODUCT_COLUMNS = [
  "sku",
  "name",
  "description",
  "price",
  "stockQuantity",
  "minimumStock",
  "category",
] as const;

export type ProductCsvRow = {
  rowNumber: number;
  sku: string;
  name: string;
  description: string;
  price: string;
  stockQuantity: string;
  minimumStock: string;
  category: string;
  errors: string[];
  action: "insert" | "update" | "invalid";
};

export function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          field += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        field += char;
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field.trim());
      field = "";
    } else if (char === "\n") {
      row.push(field.trim());
      field = "";
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
    } else if (char !== "\r") {
      field += char;
    }
  }

  row.push(field.trim());
  if (row.some((cell) => cell.length > 0)) rows.push(row);
  return rows;
}

export function toCsv(headers: string[], rows: Array<Array<string | number>>) {
  const escape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`;
  return [headers.map(escape).join(","), ...rows.map((row) => row.map(escape).join(","))].join(
    "\n",
  );
}

export async function previewProductCsv(text: string): Promise<ProductCsvRow[]> {
  const table = parseCsv(text);
  if (table.length === 0) throw new AppError("The CSV file is empty.");

  const headers = table[0].map((header) => header.trim());
  const missing = PRODUCT_COLUMNS.filter((column) => !headers.includes(column));
  if (missing.length > 0) {
    throw new AppError(`Missing columns: ${missing.join(", ")}.`);
  }

  const indexes = Object.fromEntries(headers.map((header, index) => [header, index])) as Record<
    string,
    number
  >;
  const categories = await prisma.category.findMany();
  const categoryNames = new Map(categories.map((category) => [category.name.toLowerCase(), category]));
  const existing = await prisma.product.findMany({ select: { sku: true } });
  const existingSkus = new Set(existing.map((product) => product.sku.toUpperCase()));
  const seen = new Set<string>();

  return table.slice(1).map((cells, index) => {
    const value = (column: (typeof PRODUCT_COLUMNS)[number]) => cells[indexes[column]] ?? "";
    const sku = value("sku").toUpperCase();
    const errors: string[] = [];
    const price = Number(value("price"));
    const stockQuantity = Number(value("stockQuantity"));
    const minimumStock = Number(value("minimumStock"));

    if (!sku) errors.push("SKU is required.");
    if (!value("name")) errors.push("Name is required.");
    if (!Number.isFinite(price) || price < 0) errors.push("Price must be 0 or more.");
    if (!Number.isInteger(stockQuantity) || stockQuantity < 0) {
      errors.push("Stock quantity must be a whole number of 0 or more.");
    }
    if (!Number.isInteger(minimumStock) || minimumStock < 0) {
      errors.push("Minimum stock must be a whole number of 0 or more.");
    }
    if (!categoryNames.has(value("category").toLowerCase())) {
      errors.push("Unknown category.");
    }
    if (sku && seen.has(sku)) errors.push("Duplicate SKU in this file.");
    if (sku) seen.add(sku);

    return {
      rowNumber: index + 2,
      sku,
      name: value("name"),
      description: value("description"),
      price: value("price"),
      stockQuantity: value("stockQuantity"),
      minimumStock: value("minimumStock"),
      category: value("category"),
      errors,
      action: errors.length > 0 ? "invalid" : existingSkus.has(sku) ? "update" : "insert",
    };
  });
}

export async function importProductCsv(text: string, userId: string) {
  const rows = await previewProductCsv(text);
  if (rows.length === 0) throw new AppError("The CSV file has no data rows.");
  if (rows.some((row) => row.errors.length > 0)) {
    throw new AppError("Fix the validation errors before importing.");
  }

  const categories = await prisma.category.findMany();
  const categoryNames = new Map(categories.map((category) => [category.name.toLowerCase(), category.id]));

  await prisma.$transaction(async (tx) => {
    for (const row of rows) {
      const categoryId = categoryNames.get(row.category.toLowerCase());
      if (!categoryId) throw new AppError(`Unknown category: ${row.category}.`);
      const price = Number(row.price);
      const stockQuantity = Number(row.stockQuantity);
      const minimumStock = Number(row.minimumStock);
      const existing = await tx.product.findUnique({ where: { sku: row.sku } });

      if (!existing) {
        const product = await tx.product.create({
          data: {
            sku: row.sku,
            name: row.name,
            description: row.description || null,
            categoryId,
            price,
            stockQuantity,
            minimumStock,
          },
        });
        if (stockQuantity > 0) {
          await tx.stockTransaction.create({
            data: {
              productId: product.id,
              userId,
              type: "IN",
              quantity: stockQuantity,
              previousStock: 0,
              newStock: stockQuantity,
              reason: "CSV import",
            },
          });
        }
        continue;
      }

      await tx.product.update({
        where: { id: existing.id },
        data: {
          name: row.name,
          description: row.description || null,
          categoryId,
          price,
          minimumStock,
          stockQuantity,
        },
      });

      if (existing.stockQuantity !== stockQuantity) {
        await tx.stockTransaction.create({
          data: {
            productId: existing.id,
            userId,
            type: "ADJUSTMENT",
            quantity: Math.abs(stockQuantity - existing.stockQuantity),
            previousStock: existing.stockQuantity,
            newStock: stockQuantity,
            reason: "CSV import",
          },
        });
      }
    }
  });

  return rows.length;
}

export async function exportCsv(resource: string) {
  if (resource === "products") {
    const products = await prisma.product.findMany({
      include: { category: true, sizes: true },
      orderBy: { sku: "asc" },
    });
    return toCsv(
      ["sku", "name", "description", "price", "discountPercent", "discountedPrice", "stockQuantity", "minimumStock", "category", "status"],
      products.map((product) => {
        const discounted =
          product.kind === "UNIFORM" && product.sizes.length > 0
            ? Math.min(
                ...product.sizes.map((size) => priceAfterPercent(money(size.price), size.discountPercent)),
              )
            : priceAfterPercent(money(product.price), product.discountPercent);
        return [
          product.sku,
          product.name,
          product.description ?? "",
          money(product.price),
          product.discountPercent,
          discounted,
          product.stockQuantity,
          product.minimumStock,
          product.category.name,
          stockStatusLabel(stockStatus(product.stockQuantity, product.minimumStock)),
        ];
      }),
    );
  }

  if (resource === "customers") {
    const customers = await prisma.customer.findMany({ orderBy: { name: "asc" } });
    return toCsv(
      ["name", "phone", "email", "address"],
      customers.map((customer) => [
        customer.name,
        customer.phone ?? "",
        customer.email ?? "",
        customer.address ?? "",
      ]),
    );
  }

  if (resource === "orders") {
    const orders = await prisma.order.findMany({
      include: { customer: true, createdBy: true, items: { include: { product: true } } },
      orderBy: { createdAt: "desc" },
    });
    return toCsv(
      ["orderNumber", "date", "customer", "lines", "listTotal", "couponCode", "couponPercent", "total", "createdBy", "status"],
      orders.map((order) => [
        order.orderNumber,
        formatDate(order.createdAt),
        order.customer.name,
        order.items
          .map((item) => `${item.product.name}${item.sizeLabel ? ` size ${item.sizeLabel}` : ""} x ${item.quantity}`)
          .join("; "),
        money(order.subtotal),
        order.couponCode ?? "",
        order.couponPercent,
        money(order.total),
        order.createdBy.name,
        order.status,
      ]),
    );
  }

  if (resource === "stock") {
    const products = await prisma.product.findMany({
      include: { sizes: { orderBy: { size: "asc" } } },
      orderBy: { name: "asc" },
    });
    const rows = products.flatMap((product) =>
      product.kind === "UNIFORM" && product.sizes.length > 0
        ? product.sizes.map((size) => [
            product.sku,
            product.name,
            size.size,
            size.stockQuantity,
            size.minimumStock,
            stockStatusLabel(stockStatus(size.stockQuantity, size.minimumStock)),
          ])
        : [[
            product.sku,
            product.name,
            "",
            product.stockQuantity,
            product.minimumStock,
            stockStatusLabel(stockStatus(product.stockQuantity, product.minimumStock)),
          ]],
    );
    return toCsv(["sku", "product", "size", "currentStock", "minimumStock", "status"], rows);
  }

  if (resource === "stock-transactions") {
    const rows = await prisma.stockTransaction.findMany({
      include: { product: true, user: true },
      orderBy: { createdAt: "desc" },
    });
    return toCsv(
      ["date", "product", "size", "sku", "type", "quantity", "previousStock", "newStock", "reason", "user"],
      rows.map((row) => [
        formatDate(row.createdAt),
        row.product.name,
        row.sizeLabel ?? "",
        row.product.sku,
        row.type,
        row.quantity,
        row.previousStock,
        row.newStock,
        row.reason,
        row.user.name,
      ]),
    );
  }

  throw new AppError("Unknown export.");
}

export function decimal(value: Prisma.Decimal | number) {
  return money(value);
}
