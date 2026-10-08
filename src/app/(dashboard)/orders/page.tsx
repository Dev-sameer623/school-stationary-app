import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { OrderBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Pagination } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { UrlFilters } from "@/components/url-filters";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { formatDate, formatInr, money } from "@/lib/format";
import { listOrders } from "@/lib/services/orders";
import { pageNumber, readParam } from "@/lib/utils";
import { endOfDay, startOfDay } from "date-fns";
import type { OrderStatus } from "@/generated/prisma/client";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const status = (readParam(params.status) ?? "ALL") as OrderStatus | "ALL";
  const from = readParam(params.from);
  const to = readParam(params.to);
  const page = pageNumber(readParam(params.page));
  const orders = await listOrders({
    query,
    status,
    from: from ? startOfDay(new Date(from)) : undefined,
    to: to ? endOfDay(new Date(to)) : undefined,
    page,
  });

  return (
    <div>
      <PageHeader title="Orders" description="Creating an order reduces stock in the same database transaction.">
        {can(user.role, "csvExport") ? (
          <Button asChild variant="outline">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/export/orders">Export CSV</a>
          </Button>
        ) : null}
        {can(user.role, "ordersCreate") ? (
          <Button asChild>
            <Link href="/orders/new">Create order</Link>
          </Button>
        ) : null}
      </PageHeader>
      <UrlFilters className="mb-4 grid gap-3 md:grid-cols-4">
        <Input name="q" defaultValue={query} placeholder="Order number or customer" aria-label="Search orders" />
        <Input name="from" type="date" defaultValue={from} aria-label="From date" />
        <Input name="to" type="date" defaultValue={to} aria-label="To date" />
        <Select name="status" defaultValue={status} aria-label="Order status">
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="READY">Ready</option>
          <option value="COMPLETED">Collected</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </UrlFilters>
      {orders.items.length === 0 ? (
        <EmptyState
          title="No orders found."
          description="Create an order when a customer buys stationery."
          actionHref={can(user.role, "ordersCreate") ? "/orders/new" : undefined}
          actionLabel={can(user.role, "ordersCreate") ? "Create order" : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Items</th>
                <th className="px-4 py-3">List total</th>
                <th className="px-4 py-3">Amount due</th>
                <th className="px-4 py-3">Source</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.items.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-primary" href={`/orders/${order.orderNumber}`}>
                      {order.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
                  <td className="px-4 py-3">{order.customer.name}</td>
                  <td className="px-4 py-3">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                  <td className="px-4 py-3">{formatInr(money(order.subtotal))}</td>
                  <td className="px-4 py-3">{formatInr(money(order.total))}</td>
                  <td className="px-4 py-3">{order.source === "ONLINE" ? "Online" : "Counter"}</td>
                  <td className="px-4 py-3"><OrderBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4">
        <Pagination
          page={page}
          pageCount={orders.pageCount}
          params={{ q: query, status: status === "ALL" ? undefined : status, from, to }}
        />
      </div>
    </div>
  );
}
