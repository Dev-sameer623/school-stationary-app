import Link from "next/link";
import { notFound } from "next/navigation";
import { requireShopCustomer } from "@/actions/shop";
import { OrderBadge } from "@/components/status-badge";
import { formatInr, money } from "@/lib/format";
import { getOrder } from "@/lib/services/orders";

export default async function CustomerOrderPage({
  params,
  searchParams,
}: {
  params: Promise<{ orderNumber: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const customer = await requireShopCustomer("/account/orders");
  const { orderNumber } = await params;
  const query = await searchParams;
  const order = await getOrder(decodeURIComponent(orderNumber));
  if (!order || order.customerId !== customer.id) notFound();
  const justPlaced = query.placed === "1";

  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      {justPlaced ? (
        <p className="mb-4 rounded-2xl bg-primary px-4 py-3 text-primary-foreground">
          Order placed. We will prepare it before you arrive. Pay {formatInr(money(order.total))} when you collect it.
        </p>
      ) : null}
      <h1 className="font-serif text-4xl">{order.orderNumber}</h1>
      <div className="mt-3 flex items-center gap-3">
        <OrderBadge status={order.status} audience="customer" />
        <span className="text-sm text-muted-foreground">Amount due {formatInr(money(order.total))}</span>
      </div>
      {[order.studentName, order.studentClass, order.studentSection].filter(Boolean).length > 0 ? (
        <p className="mt-4 text-sm">
          Student: {[order.studentName, order.studentClass, order.studentSection].filter(Boolean).join(" · ")}
        </p>
      ) : null}
      {order.pickupNote ? <p className="mt-4 text-sm">Visit note: {order.pickupNote}</p> : null}
      {order.status === "COMPLETED" && order.paymentMethod ? (
        <p className="mt-2 text-sm">Paid at the shop by {order.paymentMethod === "CASH" ? "cash" : "UPI"}.</p>
      ) : null}
      <ul className="mt-6 divide-y divide-border rounded-2xl border border-border bg-card">
        {order.items.map((item) => (
          <li key={item.id} className="flex justify-between gap-3 px-4 py-3 text-sm">
            <span>
              {item.product.name}
              {item.sizeLabel ? ` · ${item.sizeLabel}` : ""} × {item.quantity}
            </span>
            <span>{formatInr(money(item.total))}</span>
          </li>
        ))}
      </ul>
      <Link href="/account/orders" className="mt-4 inline-block text-sm text-primary">
        Back to my orders
      </Link>
    </article>
  );
}
