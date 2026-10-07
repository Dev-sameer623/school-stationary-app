import { PageHeader } from "@/components/page-header";
import { StockDialog } from "@/components/stock/stock-dialog";
import { StockBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Pagination } from "@/components/ui/feedback";
import { Input } from "@/components/ui/field";
import { UrlFilters } from "@/components/url-filters";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { formatDateTime, stockStatus } from "@/lib/format";
import { listStock, listStockHistory } from "@/lib/services/stock";
import { pageNumber, readParam } from "@/lib/utils";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const page = pageNumber(readParam(params.page));
  const historyPage = pageNumber(readParam(params.historyPage));
  const [stock, history] = await Promise.all([
    listStock(query, page),
    listStockHistory(historyPage),
  ]);

  return (
    <div>
      <PageHeader title="Stock" description="Every change is stored in the stock history.">
        {can(user.role, "csvExport") ? (
          <>
            <Button asChild variant="outline">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/export/stock">Export stock</a>
            </Button>
            <Button asChild variant="outline">
              {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
              <a href="/api/export/stock-transactions">Export history</a>
            </Button>
          </>
        ) : null}
      </PageHeader>
      <UrlFilters className="mb-4 max-w-sm">
        <Input name="q" defaultValue={query} placeholder="Search product or SKU" aria-label="Search stock" />
      </UrlFilters>
      {stock.items.length === 0 ? (
        <EmptyState title="No products found." description="Products appear here after they are added." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[760px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Current stock</th>
                <th className="px-4 py-3">Minimum stock</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {stock.items.flatMap((product) => {
                const rows =
                  product.kind === "UNIFORM" && product.sizes.length > 0
                    ? product.sizes.map((size) => ({
                        key: size.id,
                        name: `${product.name} · ${size.size}`,
                        sku: product.sku,
                        stockQuantity: size.stockQuantity,
                        minimumStock: size.minimumStock,
                        productSizeId: size.id,
                      }))
                    : [
                        {
                          key: product.id,
                          name: product.name,
                          sku: product.sku,
                          stockQuantity: product.stockQuantity,
                          minimumStock: product.minimumStock,
                          productSizeId: undefined as string | undefined,
                        },
                      ];
                return rows.map((row) => (
                  <tr key={row.key} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 font-medium">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{row.sku}</td>
                    <td className="px-4 py-3">{row.stockQuantity}</td>
                    <td className="px-4 py-3">{row.minimumStock}</td>
                    <td className="px-4 py-3">
                      <StockBadge status={stockStatus(row.stockQuantity, row.minimumStock)} />
                    </td>
                    <td className="px-4 py-3">
                      <StockDialog
                        product={{
                          id: product.id,
                          name: row.name,
                          stockQuantity: row.stockQuantity,
                          productSizeId: row.productSizeId,
                        }}
                      />
                    </td>
                  </tr>
                ));
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4">
        <Pagination page={page} pageCount={stock.pageCount} params={{ q: query }} />
      </div>

      <h2 className="mb-3 mt-10 text-lg font-semibold">Stock history</h2>
      {history.items.length === 0 ? (
        <EmptyState title="No stock movements yet." description="Adding, removing, or adjusting stock will show up here." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Quantity</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Reason</th>
                <th className="px-4 py-3">User</th>
              </tr>
            </thead>
            <tbody>
              {history.items.map((row) => (
                <tr key={row.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">{formatDateTime(row.createdAt)}</td>
                  <td className="px-4 py-3">
                    {row.product.name}
                    {row.sizeLabel ? <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-xs">Size {row.sizeLabel}</span> : null}
                  </td>
                  <td className="px-4 py-3">{row.type}</td>
                  <td className="px-4 py-3">{row.quantity}</td>
                  <td className="px-4 py-3">{row.previousStock} → {row.newStock}</td>
                  <td className="px-4 py-3">{row.reason}</td>
                  <td className="px-4 py-3">{row.user?.name ?? "Online shop"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4">
        <Pagination
          page={historyPage}
          pageCount={history.pageCount}
          pageKey="historyPage"
          params={{ q: query, page: page > 1 ? String(page) : undefined }}
        />
      </div>
    </div>
  );
}
