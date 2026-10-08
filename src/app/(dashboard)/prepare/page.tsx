import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { OrderBadge } from "@/components/status-badge";
import { formatDateTime } from "@/lib/format";
import { requireUser } from "@/lib/auth/session";
import { listPrepareOrders } from "@/lib/services/orders";

function studentLabel(order: { studentName: string | null; studentClass: string | null; studentSection: string | null }) {
  return [order.studentName, order.studentClass, order.studentSection].filter(Boolean).join(" · ");
}

function OrderList({
  orders,
}: {
  orders: Awaited<ReturnType<typeof listPrepareOrders>>["pending"];
}) {
  if (orders.length === 0) return <p className="text-sm text-muted-foreground">None.</p>;
  return (
    <ul className="divide-y divide-border rounded-xl border border-border bg-card">
      {orders.map((order) => {
        const student = studentLabel(order);
        return (
          <li key={order.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
            <div>
              <Link href={`/orders/${order.orderNumber}`} className="font-medium text-primary">
                {order.orderNumber}
              </Link>
              <p>{order.customer.name}{student ? ` · ${student}` : ""}</p>
              <p className="text-muted-foreground">{formatDateTime(order.createdAt)}</p>
              {order.pickupNote ? <p>Visit note: {order.pickupNote}</p> : null}
            </div>
            <OrderBadge status={order.status} />
          </li>
        );
      })}
    </ul>
  );
}

export default async function PreparePage() {
  await requireUser();
  const { pending, ready, waiting } = await listPrepareOrders();

  return (
    <div className="grid gap-8">
      <PageHeader title="To prepare" description="Pack online orders, then hand them over when the customer pays at the shop." />
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Waiting to be packed</h2>
        <OrderList orders={pending} />
      </section>
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Waiting for pickup</h2>
        <OrderList orders={ready} />
      </section>
      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Not collected</h2>
        <p className="text-sm text-muted-foreground">Pending or ready for more than 3 days. Cancel an order to return its stock.</p>
        <OrderList orders={waiting} />
      </section>
    </div>
  );
}
