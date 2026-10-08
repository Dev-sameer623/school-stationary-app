import Link from "next/link";
import { endOfDay, startOfDay } from "date-fns";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { OrderBadge, StockBadge } from "@/components/status-badge";
import { Input, Select } from "@/components/ui/field";
import { UrlFilters } from "@/components/url-filters";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { formatDate, formatInr, money, stockStatus } from "@/lib/format";
import { movementReport, salesReport, stockReport } from "@/lib/services/reports";
import { readParam } from "@/lib/utils";
import type { OrderStatus } from "@/generated/prisma/client";

export default async function ReportsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireUser();
  const params = await searchParams;
  const tab = readParam(params.tab) ?? "sales";
  const from = readParam(params.from);
  const to = readParam(params.to);
  const productId = readParam(params.product) || undefined;
  const categoryId = readParam(params.category) || undefined;
  const userId = readParam(params.user) || undefined;
  const status = readParam(params.status) as OrderStatus | undefined;
  const [products, categories, users] = await Promise.all([
    prisma.product.findMany({ orderBy: { name: "asc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.user.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true } }),
  ]);
  const filters = {
    from: from ? startOfDay(new Date(from)) : undefined,
    to: to ? endOfDay(new Date(to)) : undefined,
    productId,
    categoryId,
    userId,
    status: status || undefined,
  };

  return (
    <div className="print-sheet">
      <PageHeader title="Reports" description="Filter sales, current stock, and stock movements.">
        <PrintButton label={tab === "stock" ? "Print stock report" : "Print sales report"} />
      </PageHeader>
      <div className="no-print mb-4 flex gap-2">
        {[
          ["sales", "Sales"],
          ["stock", "Stock"],
          ["movement", "Stock movement"],
        ].map(([value, label]) => {
          const next = new URLSearchParams();
          for (const key of ["from", "to", "product", "category", "user", "status"]) {
            const valueForKey = readParam(params[key]);
            if (valueForKey) next.set(key, valueForKey);
          }
          next.set("tab", value);
          return (
            <Link
              key={value}
              href={`/reports?${next.toString()}`}
              className={`rounded-md px-3 py-2 text-sm ${tab === value ? "bg-primary text-primary-foreground" : "bg-card border border-border"}`}
            >
              {label}
            </Link>
          );
        })}
      </div>
      <UrlFilters className="no-print mb-4 grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <input type="hidden" name="tab" value={tab} />
        <Input name="from" type="date" defaultValue={from} aria-label="Start date" />
        <Input name="to" type="date" defaultValue={to} aria-label="End date" />
        <Select name="product" defaultValue={productId ?? ""} aria-label="Product">
          <option value="">All products</option>
          {products.map((product) => (
            <option key={product.id} value={product.id}>{product.name}</option>
          ))}
        </Select>
        <Select name="category" defaultValue={categoryId ?? ""} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </Select>
        <Select name="user" defaultValue={userId ?? ""} aria-label="User">
          <option value="">All users</option>
          {users.map((person) => (
            <option key={person.id} value={person.id}>{person.name}</option>
          ))}
        </Select>
        <Select name="status" defaultValue={status ?? ""} aria-label="Order status">
          <option value="">All order statuses</option>
          <option value="PENDING">Pending</option>
          <option value="READY">Ready</option>
          <option value="COMPLETED">Collected</option>
          <option value="CANCELLED">Cancelled</option>
        </Select>
      </UrlFilters>
      {tab === "stock" ? <StockTable filters={filters} /> : null}
      {tab === "movement" ? <MovementTable filters={filters} /> : null}
      {tab !== "stock" && tab !== "movement" ? <SalesTable filters={filters} /> : null}
    </div>
  );
}

async function SalesTable({ filters }: { filters: Parameters<typeof salesReport>[0] }) {
  const orders = await salesReport(filters);
  if (orders.length === 0) return <p className="text-sm text-muted-foreground">No sales match these filters.</p>;
  return (
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
            <th className="px-4 py-3">Created by</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">{order.orderNumber}</td>
              <td className="px-4 py-3">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3">{order.customer.name}</td>
              <td className="px-4 py-3">
                {order.items
                  .map((item) => `${item.product.name}${item.sizeLabel ? ` size ${item.sizeLabel}` : ""} × ${item.quantity}`)
                  .join(", ")}
              </td>
              <td className="px-4 py-3">{formatInr(money(order.subtotal))}</td>
              <td className="px-4 py-3">{formatInr(money(order.total))}</td>
              <td className="px-4 py-3">{order.createdBy?.name ?? "Online"}</td>
              <td className="px-4 py-3"><OrderBadge status={order.status} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

async function StockTable({ filters }: { filters: Parameters<typeof stockReport>[0] }) {
  const products = await stockReport(filters);
  if (products.length === 0) return <p className="text-sm text-muted-foreground">No products match these filters.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[640px] text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Current stock</th>
            <th className="px-4 py-3">Minimum stock</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {products.flatMap((product) => {
            const rows =
              product.kind === "UNIFORM" && product.sizes.length > 0
                ? product.sizes.map((size) => ({
                    key: size.id,
                    name: `${product.name} · ${size.size}`,
                    stockQuantity: size.stockQuantity,
                    minimumStock: size.minimumStock,
                    stockStatus: stockStatus(size.stockQuantity, size.minimumStock),
                  }))
                : [
                    {
                      key: product.id,
                      name: product.name,
                      stockQuantity: product.stockQuantity,
                      minimumStock: product.minimumStock,
                      stockStatus: product.stockStatus,
                    },
                  ];
            return rows.map((row) => (
              <tr key={row.key} className="border-b border-border last:border-0">
                <td className="px-4 py-3">{row.name}</td>
                <td className="px-4 py-3">{row.stockQuantity}</td>
                <td className="px-4 py-3">{row.minimumStock}</td>
                <td className="px-4 py-3"><StockBadge status={row.stockStatus} /></td>
              </tr>
            ));
          })}
        </tbody>
      </table>
    </div>
  );
}

async function MovementTable({ filters }: { filters: Parameters<typeof movementReport>[0] }) {
  const rows = await movementReport(filters);
  if (rows.length === 0) return <p className="text-sm text-muted-foreground">No stock movements match these filters.</p>;
  return (
    <div className="overflow-x-auto rounded-xl border border-border bg-card">
      <table className="w-full min-w-[860px] text-left text-sm">
        <thead className="border-b border-border bg-muted text-muted-foreground">
          <tr>
            <th className="px-4 py-3">Date</th>
            <th className="px-4 py-3">Product</th>
            <th className="px-4 py-3">Size</th>
            <th className="px-4 py-3">Type</th>
            <th className="px-4 py-3">Quantity</th>
            <th className="px-4 py-3">Previous</th>
            <th className="px-4 py-3">New</th>
            <th className="px-4 py-3">Reason</th>
            <th className="px-4 py-3">User</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-border last:border-0">
              <td className="px-4 py-3">{formatDate(row.createdAt)}</td>
              <td className="px-4 py-3">{row.product.name}</td>
              <td className="px-4 py-3">{row.sizeLabel ?? "—"}</td>
              <td className="px-4 py-3">{row.type}</td>
              <td className="px-4 py-3">{row.quantity}</td>
              <td className="px-4 py-3">{row.previousStock}</td>
              <td className="px-4 py-3">{row.newStock}</td>
              <td className="px-4 py-3">{row.reason}</td>
              <td className="px-4 py-3">{row.user?.name ?? "Online shop"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
