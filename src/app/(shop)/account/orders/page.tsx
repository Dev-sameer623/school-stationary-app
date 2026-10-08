import Link from "next/link";
import { requireShopCustomer } from "@/actions/shop";
import { OrderBadge } from "@/components/status-badge";
import { formatDate, formatInr, money } from "@/lib/format";
import { listCustomerOrders } from "@/lib/services/orders";

export default async function MyOrdersPage() {
  const customer = await requireShopCustomer("/account/orders");
  const orders = await listCustomerOrders(customer.id);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-serif text-4xl">My orders</h1>
      {orders.length === 0 ? (
        <p className="text-muted-foreground">You have not placed an order yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-2xl border border-border bg-card">
          {orders.map((order) => (
            <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <Link href={`/account/orders/${order.orderNumber}`} className="font-medium text-primary">
                  {order.orderNumber}
                </Link>
                <p className="text-sm text-muted-foreground">{formatDate(order.createdAt)}</p>
              </div>
              <div className="flex items-center gap-3">
                <span>{formatInr(money(order.total))}</span>
                <OrderBadge status={order.status} audience="customer" />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
