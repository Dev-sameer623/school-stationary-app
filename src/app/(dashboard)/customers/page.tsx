import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EmptyState, Pagination } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { UrlFilters } from "@/components/url-filters";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { listCustomers } from "@/lib/services/customers";
import { pageNumber, readParam } from "@/lib/utils";

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const page = pageNumber(readParam(params.page));
  const customers = await listCustomers(query, page);

  return (
    <div>
      <PageHeader title="Customers" description="Search by name, phone, or email.">
        {can(user.role, "csvExport") ? (
          <Button asChild variant="outline">
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/export/customers">Export CSV</a>
          </Button>
        ) : null}
        <Button asChild>
          <Link href="/customers/new">Add customer</Link>
        </Button>
      </PageHeader>
      <UrlFilters className="mb-4 max-w-sm">
        <Input name="q" defaultValue={query} placeholder="Name, phone, or email" aria-label="Search customers" />
      </UrlFilters>
      {customers.items.length === 0 ? (
        <EmptyState
          title="No customers found."
          description="Add a customer before creating an order."
          actionHref="/customers/new"
          actionLabel="Add customer"
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Orders</th>
              </tr>
            </thead>
            <tbody>
              {customers.items.map((customer) => (
                <tr key={customer.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <Link className="font-medium text-primary" href={`/customers/${customer.id}`}>
                      {customer.name}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{customer.phone || "—"}</td>
                  <td className="px-4 py-3">{customer.email || "—"}</td>
                  <td className="px-4 py-3">{customer._count.orders}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4">
        <Pagination page={page} pageCount={customers.pageCount} params={{ q: query }} />
      </div>
    </div>
  );
}
