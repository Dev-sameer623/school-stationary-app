import Link from "next/link";
import { notFound } from "next/navigation";
import { CustomerForm } from "@/components/customers/customer-form";
import { PageHeader } from "@/components/page-header";
import { OrderBadge } from "@/components/status-badge";
import { requireUser } from "@/lib/auth/session";
import { formatDate, formatInr, money } from "@/lib/format";
import { getCustomer } from "@/lib/services/customers";

export default async function CustomerPage({ params }: { params: Promise<{ id: string }> }) {
  await requireUser();
  const { id } = await params;
  const customer = await getCustomer(id);
  if (!customer) notFound();

  return (
    <div className="grid gap-8 xl:grid-cols-[22rem_1fr]">
      <div>
        <PageHeader title={customer.name} description="Update contact details." />
        <CustomerForm
          customer={{
            id: customer.id,
            name: customer.name,
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
          }}
        />
      </div>
      <div>
        <h2 className="mb-3 text-lg font-semibold">Orders</h2>
        {customer.orders.length === 0 ? (
          <p className="text-sm text-muted-foreground">This customer has no orders yet.</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border bg-card">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-border bg-muted text-muted-foreground">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">List total</th>
                  <th className="px-4 py-3">Amount due</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody>
                {customer.orders.map((order) => (
                  <tr key={order.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3">
                      <Link className="font-medium text-primary" href={`/orders/${order.orderNumber}`}>
                        {order.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                    <td className="px-4 py-3">{formatInr(money(order.subtotal))}</td>
                    <td className="px-4 py-3">{formatInr(money(order.total))}</td>
                    <td className="px-4 py-3"><OrderBadge status={order.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
