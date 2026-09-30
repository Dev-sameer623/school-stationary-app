import Link from "next/link";
import { CatalogImage } from "@/components/catalog-image";
import { PageHeader } from "@/components/page-header";
import { StockBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Pagination } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/field";
import { UrlFilters } from "@/components/url-filters";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { formatInr, money, stockStatus, type StockStatus } from "@/lib/format";
import { priceAfterPercent } from "@/lib/pricing";
import { prisma } from "@/lib/db/prisma";
import { listProducts } from "@/lib/services/catalog";
import { pageNumber, readParam } from "@/lib/utils";

function discountLabel(product: {
  kind: string;
  discountPercent: number;
  sizes: Array<{ discountPercent: number }>;
}) {
  if (product.kind !== "UNIFORM" || product.sizes.length === 0) return `${product.discountPercent}%`;
  const percents = [...new Set(product.sizes.map((size) => size.discountPercent))];
  return percents.length === 1 ? `${percents[0]}%` : "By size";
}

function discountedPrice(product: {
  kind: string;
  price: { toString(): string };
  discountPercent: number;
  sizes: Array<{ price: { toString(): string }; discountPercent: number }>;
}) {
  if (product.kind === "UNIFORM" && product.sizes.length > 0) {
    return Math.min(...product.sizes.map((size) => priceAfterPercent(money(size.price), size.discountPercent)));
  }
  return priceAfterPercent(money(product.price), product.discountPercent);
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requireUser();
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const categoryId = readParam(params.category) ?? "";
  const status = (readParam(params.status) ?? "ALL") as StockStatus | "ALL";
  const page = pageNumber(readParam(params.page));
  const [products, categoryOptions] = await Promise.all([
    listProducts({ query, categoryId: categoryId || undefined, stockStatus: status, page }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const manage = can(user.role, "productsManage");

  return (
    <div>
      <PageHeader title="Products" description="Search the catalogue and open a product for details.">
        {can(user.role, "csvExport") ? (
          <Button asChild variant="outline">
            {/* File download, not an app route. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/api/export/products">Export CSV</a>
          </Button>
        ) : null}
        {can(user.role, "csvImport") ? (
          <Button asChild variant="outline">
            <Link href="/products/import">Import CSV</Link>
          </Button>
        ) : null}
        {manage ? (
          <Button asChild>
            <Link href="/products/new">Add product</Link>
          </Button>
        ) : null}
      </PageHeader>
      <UrlFilters className="mb-4 grid gap-3 sm:grid-cols-3">
        <Input name="q" defaultValue={query} placeholder="Search name or SKU" aria-label="Search products" />
        <Select name="category" defaultValue={categoryId} aria-label="Category">
          <option value="">All categories</option>
          {categoryOptions.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <Select name="status" defaultValue={status} aria-label="Stock status">
          <option value="ALL">All stock statuses</option>
          <option value="IN_STOCK">In stock</option>
          <option value="LOW_STOCK">Low stock</option>
          <option value="OUT_OF_STOCK">Out of stock</option>
        </Select>
      </UrlFilters>
      {products.items.length === 0 ? (
        <EmptyState
          title="No products found."
          description="Add your first product to get started."
          actionHref={manage ? "/products/new" : undefined}
          actionLabel={manage ? "Add product" : undefined}
        />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">List price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Price after discount</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {products.items.map((product) => (
                <tr key={product.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-mono text-xs">{product.sku}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <CatalogImage src={product.imageUrl} alt="" className="h-12 w-12 rounded-md" />
                      <div>
                        <Link href={`/products/${product.id}`} className="font-medium text-primary">
                          {product.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">{product.category.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {product.kind === "UNIFORM" ? "from " : ""}
                    {formatInr(money(product.price))}
                  </td>
                  <td className="px-4 py-3">{discountLabel(product)}</td>
                  <td className="px-4 py-3">
                    {product.kind === "UNIFORM" ? "from " : ""}
                    {formatInr(discountedPrice(product))}
                  </td>
                  <td className="px-4 py-3">{product.stockQuantity}</td>
                  <td className="px-4 py-3">
                    <StockBadge status={stockStatus(product.stockQuantity, product.minimumStock)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4">
        <Pagination
          page={page}
          pageCount={products.pageCount}
          params={{ q: query, category: categoryId, status: status === "ALL" ? undefined : status }}
        />
      </div>
    </div>
  );
}
