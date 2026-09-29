import "dotenv/config";
import bcrypt from "bcryptjs";
import { subDays } from "date-fns";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";
import { createOrder } from "../src/lib/services/orders";
import { createProduct } from "../src/lib/services/catalog";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

const DEV_PASSWORD = "DevPassword123!";

async function main() {
  await prisma.stockTransaction.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.product.deleteMany();
  await prisma.category.deleteMany();
  await prisma.customer.deleteMany();
  await prisma.user.deleteMany();

  const passwordHash = await bcrypt.hash(DEV_PASSWORD, 10);
  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@example.com",
      passwordHash,
      role: "ADMIN",
    },
  });
  const manager = await prisma.user.create({
    data: {
      name: "Store Manager",
      email: "manager@example.com",
      passwordHash,
      role: "MANAGER",
    },
  });

  const categoryNames = [
    ["Pens", "Ballpoint and gel pens", "/images/catalog/pen.png"],
    ["Notebooks", "Exercise books and registers", "/images/catalog/notebook.png"],
    ["Pencils", "Writing pencils", "/images/catalog/pencil.png"],
    ["Erasers", "Rubber erasers", "/images/catalog/eraser.png"],
    ["Art Supplies", "Colour and drawing materials", "/images/catalog/watercolour.png"],
    ["Files", "Folders and files", "/images/catalog/file.png"],
    ["School Bags", "Bags and pouches", "/images/catalog/bag.png"],
    ["Other", "Other stationery", "/images/catalog/sharpener.png"],
    ["Uniforms", "School shirts, skirts, and other dress", "/images/catalog/shirt.png"],
  ] as const;

  const categories = new Map<string, string>();
  for (const [name, description, imageUrl] of categoryNames) {
    const category = await prisma.category.create({ data: { name, description, imageUrl } });
    categories.set(name, category.id);
  }

  const products = [
    ["PEN001", "Blue Pen", "Standard blue pen", "Pens", 10, 270, 20, "/images/catalog/pen.png"],
    ["NB001", "Notebook", "200 page notebook", "Notebooks", 50, 35, 25, "/images/catalog/notebook.png"],
    ["ER001", "Eraser", "Soft eraser", "Erasers", 5, 5, 10, "/images/catalog/eraser.png"],
    ["PCL001", "HB Pencil", "Pack of one HB pencil", "Pencils", 8, 120, 30, "/images/catalog/pencil.png"],
    ["ART001", "Watercolour Set", "12 colour set", "Art Supplies", 180, 15, 5, "/images/catalog/watercolour.png"],
    ["FIL001", "A4 File", "Spring file", "Files", 25, 40, 10, "/images/catalog/file.png"],
    ["BAG001", "School Bag", "Medium school bag", "School Bags", 450, 8, 5, "/images/catalog/bag.png"],
    ["OTH001", "Sharpener", "Metal sharpener", "Other", 7, 60, 15, "/images/catalog/sharpener.png"],
  ] as const;

  const productIds = new Map<string, string>();
  for (const [sku, name, description, category, price, stockQuantity, minimumStock, imageUrl] of products) {
    const product = await createProduct(
      {
        sku,
        name,
        description,
        categoryId: categories.get(category)!,
        kind: "STATIONERY",
        price,
        stockQuantity,
        minimumStock,
        status: "ACTIVE",
        sizes: [],
      },
      admin.id,
    );
    productIds.set(sku, product.id);
    await prisma.product.update({ where: { id: product.id }, data: { imageUrl } });
  }

  await createProduct(
    {
      sku: "SHR001",
      name: "School Shirt",
      description: "White short-sleeve school shirt",
      categoryId: categories.get("Uniforms")!,
      kind: "UNIFORM",
      price: 0,
      stockQuantity: 0,
      minimumStock: 0,
      status: "ACTIVE",
      sizes: [
        { size: "26", price: 420, stockQuantity: 8, minimumStock: 2 },
        { size: "28", price: 450, stockQuantity: 10, minimumStock: 3 },
        { size: "30", price: 480, stockQuantity: 6, minimumStock: 2 },
        { size: "32", price: 510, stockQuantity: 4, minimumStock: 2 },
      ],
    },
    admin.id,
  );
  await prisma.product.update({ where: { sku: "SHR001" }, data: { imageUrl: "/images/catalog/shirt.png" } });
  await createProduct(
    {
      sku: "SKT001",
      name: "School Skirt",
      description: "Navy school skirt",
      categoryId: categories.get("Uniforms")!,
      kind: "UNIFORM",
      price: 0,
      stockQuantity: 0,
      minimumStock: 0,
      status: "ACTIVE",
      sizes: [
        { size: "24", price: 380, stockQuantity: 6, minimumStock: 2 },
        { size: "26", price: 410, stockQuantity: 8, minimumStock: 2 },
        { size: "28", price: 440, stockQuantity: 5, minimumStock: 2 },
      ],
    },
    admin.id,
  );
  await prisma.product.update({ where: { sku: "SKT001" }, data: { imageUrl: "/images/catalog/skirt.png" } });

  const riya = await prisma.customer.create({
    data: {
      name: "Riya Sharma",
      phone: "9876543210",
      email: "riya@example.com",
      address: "12 School Lane, Pune",
    },
  });
  const arjun = await prisma.customer.create({
    data: {
      name: "Arjun Patel",
      phone: "9123456780",
      email: "arjun@example.com",
      address: "44 Station Road, Pune",
    },
  });
  await prisma.customer.create({
    data: {
      name: "School Office",
      phone: "0201234567",
      email: "office@school.example",
      address: "Main campus",
    },
  });

  const penOrder = await createOrder(
    {
      customerId: riya.id,
      items: [{ productId: productIds.get("PEN001")!, quantity: 20 }],
    },
    manager.id,
  );
  const notebookOrder = await createOrder(
    {
      customerId: arjun.id,
      items: [
        { productId: productIds.get("NB001")!, quantity: 10 },
        { productId: productIds.get("PCL001")!, quantity: 5 },
      ],
    },
    admin.id,
  );
  const eraserOrder = await createOrder(
    {
      customerId: riya.id,
      items: [{ productId: productIds.get("ER001")!, quantity: 5 }],
    },
    manager.id,
  );

  await prisma.order.update({
    where: { id: penOrder.id },
    data: { status: "COMPLETED", createdAt: subDays(new Date(), 2) },
  });
  await prisma.order.update({
    where: { id: notebookOrder.id },
    data: { status: "COMPLETED", createdAt: subDays(new Date(), 1) },
  });
  await prisma.order.update({
    where: { id: eraserOrder.id },
    data: { createdAt: new Date() },
  });

  console.log("Seeded School Stationery Manager.");
  console.log("Local development only:");
  console.log("  admin@example.com / DevPassword123!");
  console.log("  manager@example.com / DevPassword123!");
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
