import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/shop/add-to-cart";
import { CatalogImage } from "@/components/catalog-image";
import { getShopCustomer } from "@/lib/customer-auth/session";
import { formatInr } from "@/lib/format";
import { displayPrice, getShopProduct, remainingStock } from "@/lib/services/shop";

export default async function ShopProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, customer] = await Promise.all([getShopProduct(id), getShopCustomer()]);
  if (!product) notFound();
  const price = displayPrice(product.price, product.discountPercent);
  const left = remainingStock(product);

  return (
    <div className="lg:grid lg:min-h-[calc(100svh-4.5rem)] lg:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.8fr)]">
      <CatalogImage
        src={product.imageUrl}
        alt={product.name}
        preload
        sizes="(max-width: 1024px) 100vw, 62vw"
        className="h-[88svh] w-full lg:h-auto lg:min-h-[calc(100svh-4.5rem)]"
      />
      <div className="bg-card lg:min-h-full">
      <div className="px-4 py-8 sm:px-8 lg:sticky lg:top-24 lg:px-10 lg:py-12">
        <Link href={`/category/${product.category.id}`} scroll={false} className="text-sm font-medium text-primary">
          {product.category.name}
        </Link>
        <h1 className="mt-2 font-serif text-4xl leading-tight md:text-5xl">{product.name}</h1>
        {product.kind === "STATIONERY" ? (
          <p className="mt-4 font-serif text-3xl text-primary md:text-4xl">{formatInr(price)}</p>
        ) : (
          <p className="mt-4 text-base text-muted-foreground">Choose a size. Each size has its own price.</p>
        )}
        <p className="mt-3 text-sm font-medium">{left > 0 ? `${left} in stock` : "Out of stock"}</p>
        {product.kind === "UNIFORM" ? (
          <ul className="mt-3 grid gap-1 text-sm text-muted-foreground">
            {product.sizes.map((size) => (
              <li key={size.id}>
                Size {size.size}: {size.stockQuantity > 0 ? `${size.stockQuantity} in stock` : "Out of stock"}
              </li>
            ))}
          </ul>
        ) : null}
        <div className="mt-8">
          <AddToCart
            signedIn={Boolean(customer)}
            productId={product.id}
            kind={product.kind}
            stock={product.stockQuantity}
            sizes={product.sizes.map((size) => ({
              id: size.id,
              size: size.size,
              stockQuantity: size.stockQuantity,
              priceLabel: formatInr(displayPrice(size.price, size.discountPercent)),
            }))}
          />
        </div>
      </div>
      </div>
    </div>
  );
}
