import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import { prisma } from "@/lib/db/prisma";
import { money } from "@/lib/format";

export async function getDashboard() {
  const todayStart = startOfDay(new Date());
  const rangeStart = startOfDay(subDays(new Date(), 13));

  const [
    totalProducts,
    stockSum,
    lowStock,
    outOfStock,
    inStock,
    totalOrders,
    todaysOrders,
    totalCustomers,
    recentOrders,
    topProducts,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.product.aggregate({ _sum: { stockQuantity: true } }),
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count
      FROM "Product"
      WHERE "stockQuantity" > 0 AND "stockQuantity" <= "minimumStock"
    `,
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM "Product" WHERE "stockQuantity" <= 0
    `,
    prisma.$queryRaw<Array<{ count: number }>>`
      SELECT COUNT(*)::int AS count FROM "Product" WHERE "stockQuantity" > "minimumStock"
    `,
    prisma.order.count(),
    prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
    prisma.customer.count(),
    prisma.order.findMany({
      where: { createdAt: { gte: rangeStart }, status: { not: "CANCELLED" } },
      select: { createdAt: true, total: true },
    }),
    prisma.$queryRaw<Array<{ name: string; quantity: number }>>`
      SELECT p.name, SUM(oi.quantity)::int AS quantity
      FROM "OrderItem" oi
      JOIN "Product" p ON p.id = oi."productId"
      JOIN "Order" o ON o.id = oi."orderId"
      WHERE o.status <> 'CANCELLED'
      GROUP BY p.id, p.name
      ORDER BY quantity DESC
      LIMIT 5
    `,
  ]);

  const byDay = new Map<string, { orders: number; sales: number }>();
  for (const order of recentOrders) {
    const key = format(order.createdAt, "yyyy-MM-dd");
    const current = byDay.get(key) ?? { orders: 0, sales: 0 };
    current.orders += 1;
    current.sales += money(order.total);
    byDay.set(key, current);
  }

  const series = eachDayOfInterval({ start: rangeStart, end: new Date() }).map((day) => {
    const key = format(day, "yyyy-MM-dd");
    const point = byDay.get(key) ?? { orders: 0, sales: 0 };
    return { day: format(day, "d MMM"), orders: point.orders, sales: point.sales };
  });

  return {
    totalProducts,
    totalStockItems: stockSum._sum.stockQuantity ?? 0,
    lowStock: lowStock[0]?.count ?? 0,
    totalOrders,
    todaysOrders,
    totalCustomers,
    series,
    topProducts,
    stockStatus: [
      { name: "In Stock", value: inStock[0]?.count ?? 0 },
      { name: "Low Stock", value: lowStock[0]?.count ?? 0 },
      { name: "Out of Stock", value: outOfStock[0]?.count ?? 0 },
    ],
  };
}
