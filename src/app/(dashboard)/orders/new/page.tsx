import { OrderForm } from "@/components/orders/order-form";
import { PageHeader } from "@/components/page-header";
import { EmptyState } from "@/components/ui/feedback";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { money } from "@/lib/format";

export default async function NewOrderPage() {
  await requireUser();
  const [customers, products, coupons] = await Promise.all([
    prisma.customer.findMany({ orderBy: { name: "asc" } }),
    prisma.product.findMany({
      where: { status: "ACTIVE" },
      include: { sizes: { orderBy: { size: "asc" } } },
      orderBy: { name: "asc" },
    }),
    prisma.coupon.findMany({ where: { status: "ACTIVE" }, orderBy: { code: "asc" } }),
  ]);

  return (
    <div>
      <PageHeader title="Create order" description="Stock is checked and reduced only if the whole order succeeds." />
      {customers.length === 0 || products.length === 0 ? (
        <EmptyState
          title="Add a customer and a product first."
          description="An order needs at least one customer and one active product."
        />
      ) : (
        <OrderForm
          customers={customers.map((customer) => ({ id: customer.id, name: customer.name }))}
          products={products.map((product) => ({
            id: product.id,
            name: product.name,
            sku: product.sku,
            kind: product.kind,
            price: money(product.price),
            discountPercent: product.discountPercent,
            stockQuantity: product.stockQuantity,
            sizes: product.sizes.map((size) => ({
              id: size.id,
              size: size.size,
              price: money(size.price),
              discountPercent: size.discountPercent,
              stockQuantity: size.stockQuantity,
            })),
          }))}
          coupons={coupons.map((coupon) => ({
            code: coupon.code,
            percent: coupon.percent,
            startsAt: coupon.startsAt?.toISOString() ?? null,
            endsAt: coupon.endsAt?.toISOString() ?? null,
          }))}
        />
      )}
    </div>
  );
}
