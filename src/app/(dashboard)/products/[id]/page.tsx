import Link from "next/link";
import { notFound } from "next/navigation";
import { removeProduct } from "@/actions/catalog";
import { CatalogImage } from "@/components/catalog-image";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { ConfirmButton } from "@/components/confirm-button";
import { StockBadge } from "@/components/status-badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { can } from "@/lib/permissions";
import { formatDateTime, formatInr, money, stockStatus } from "@/lib/format";
import { priceAfterPercent } from "@/lib/pricing";
import { getProduct } from "@/lib/services/catalog";

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const { id } = await params;
  const product = await getProduct(id);
  if (!product) notFound();
  const status = stockStatus(product.stockQuantity, product.minimumStock);

  return (
    <div className="print-sheet">
      <PageHeader title={product.name} description={product.sku}>
        <PrintButton />
        {can(user.role, "productsManage") ? (
          <>
            <Button asChild variant="outline">
              <Link href={`/products/${product.id}/edit`}>Edit</Link>
            </Button>
            <ConfirmButton
              label="Delete"
              title={`Delete ${product.name}?`}
              description="Products that appear on an order cannot be deleted."
              confirmLabel="Delete product"
              onConfirm={removeProduct.bind(null, product.id)}
              redirectTo="/products"
            />
          </>
        ) : null}
      </PageHeader>
      <div className="mb-4 max-w-2xl overflow-hidden rounded-xl border border-border bg-card">
        <CatalogImage src={product.imageUrl} alt={product.name} className="h-64 w-full" />
      </div>
      <dl className="grid max-w-2xl gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-muted-foreground">Category</dt>
          <dd>{product.category.name}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">{product.kind === "UNIFORM" ? "From" : "Price"}</dt>
          <dd>{formatInr(money(product.price))}</dd>
        </div>
        {product.kind === "STATIONERY" ? (
          <>
            <div>
              <dt className="text-sm text-muted-foreground">Discount</dt>
              <dd>{product.discountPercent}%</dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">Price after discount</dt>
              <dd>{formatInr(priceAfterPercent(money(product.price), product.discountPercent))}</dd>
            </div>
          </>
        ) : null}
        <div>
          <dt className="text-sm text-muted-foreground">Stock</dt>
          <dd>{product.stockQuantity}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Minimum stock</dt>
          <dd>{product.minimumStock}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Stock status</dt>
          <dd><StockBadge status={status} /></dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Kind</dt>
          <dd>{product.kind === "UNIFORM" ? "Uniform" : "Stationery"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Sale status</dt>
          <dd>{product.status === "ACTIVE" ? "Active" : "Inactive"}</dd>
        </div>
        <div className="sm:col-span-2">
          <dt className="text-sm text-muted-foreground">Description</dt>
          <dd>{product.description || "No description"}</dd>
        </div>
        <div>
          <dt className="text-sm text-muted-foreground">Updated</dt>
          <dd>{formatDateTime(product.updatedAt)}</dd>
        </div>
      </dl>
      {product.kind === "UNIFORM" ? (
        <div className="mt-4 max-w-2xl overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Size</th>
                <th className="px-4 py-3">List price</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">Price after discount</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Minimum</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {product.sizes.map((size) => (
                <tr key={size.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <span className="rounded-full border border-border px-2 py-0.5 text-xs">Size {size.size}</span>
                  </td>
                  <td className="px-4 py-3">{formatInr(money(size.price))}</td>
                  <td className="px-4 py-3">{size.discountPercent}%</td>
                  <td className="px-4 py-3">{formatInr(priceAfterPercent(money(size.price), size.discountPercent))}</td>
                  <td className="px-4 py-3">{size.stockQuantity}</td>
                  <td className="px-4 py-3">{size.minimumStock}</td>
                  <td className="px-4 py-3">
                    <StockBadge status={stockStatus(size.stockQuantity, size.minimumStock)} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
