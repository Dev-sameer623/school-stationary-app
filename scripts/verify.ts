import "dotenv/config";
import { prisma } from "../src/lib/db/prisma";
import { createOrder } from "../src/lib/services/orders";
import { previewProductCsv } from "../src/lib/services/csv";

async function main() {
  const pen = await prisma.product.findUnique({ where: { sku: "PEN001" } });
  const notebook = await prisma.product.findUnique({ where: { sku: "NB001" } });
  const eraser = await prisma.product.findUnique({ where: { sku: "ER001" } });
  if (!pen || !notebook || !eraser) throw new Error("Seed products missing");
  if (pen.stockQuantity !== 250) throw new Error(`Blue pen stock ${pen.stockQuantity}, expected 250`);
  if (notebook.stockQuantity !== 25) throw new Error(`Notebook stock ${notebook.stockQuantity}, expected 25`);
  if (eraser.stockQuantity !== 0) throw new Error(`Eraser stock ${eraser.stockQuantity}, expected 0`);

  const manager = await prisma.user.findUnique({ where: { email: "manager@example.com" } });
  const customer = await prisma.customer.findFirst();
  if (!manager || !customer) throw new Error("Seed user or customer missing");

  const before = eraser.stockQuantity;
  let rejected = false;
  try {
    await createOrder(
      { customerId: customer.id, items: [{ productId: eraser.id, quantity: 11 }] },
      manager.id,
    );
  } catch (error) {
    rejected = error instanceof Error && error.message.includes("stock");
  }
  const after = await prisma.product.findUnique({ where: { id: eraser.id } });
  if (!rejected) throw new Error("Oversized order was not rejected");
  if (after?.stockQuantity !== before) throw new Error("Failed order changed stock");

  const missing = await previewProductCsv("sku,name\nX,Y\n").catch((error: Error) => error.message);
  if (typeof missing !== "string" || !missing.includes("Missing columns")) {
    throw new Error("Missing columns were not reported");
  }

  const rows = await previewProductCsv(
    "sku,name,description,price,stockQuantity,minimumStock,category\nPEN001,Blue Pen,dup,-1,1.5,-2,Unknown\nPEN001,Blue Pen,dup,10,5,1,Pens\n",
  );
  const messages = rows.flatMap((row) => row.errors).join(" ");
  for (const expected of ["Price", "Stock quantity", "Minimum stock", "Unknown category", "Duplicate SKU"]) {
    if (!messages.includes(expected)) throw new Error(`CSV did not report ${expected}`);
  }

  console.log("Stock and CSV checks passed.");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });
