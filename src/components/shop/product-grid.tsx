import Link from "next/link";
import { CatalogImage } from "@/components/catalog-image";
import { formatInr } from "@/lib/format";
import { listShopProducts, productFromPrice, remainingStock } from "@/lib/services/shop";

export async function ProductGrid({ categoryId, query }: { categoryId?: string; query?: string }) {
  const products = await listShopProducts(categoryId, query);

  return (
    <section id="products" className="scroll-mt-24 px-4 py-8 sm:px-6 lg:px-8">
      {products.length === 0 ? (
        <p className="text-muted-foreground">{query ? "No products match that search." : "No products in this category yet."}</p>
      ) : (
        <ul className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4 xl:grid-cols-5">
          {products.map((product) => {
            const left = remainingStock(product);
            return (
            <li key={product.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
              <Link href={`/shop/${product.id}`}>
                <CatalogImage
                  src={product.imageUrl}
                  alt={product.name}
                  sizes="(max-width: 768px) 50vw, 20vw"
                  className="aspect-[3/4] w-full"
                />
                <div className="grid gap-1 p-3">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.category.name}</p>
                  <h2 className="font-serif text-lg leading-tight">{product.name}</h2>
                  <p className="text-sm font-medium text-primary">
                    {product.kind === "UNIFORM" ? "From " : ""}
                    {formatInr(productFromPrice(product))}
                  </p>
                  <p className="text-sm text-muted-foreground">{left > 0 ? `${left} in stock` : "Out of stock"}</p>
                </div>
              </Link>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
