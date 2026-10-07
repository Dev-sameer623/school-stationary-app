import { Suspense } from "react";
import { ProductGrid } from "@/components/shop/product-grid";
import { ProductGridSkeleton } from "@/components/shop/product-grid-skeleton";

export default async function AllCatalogPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const query = typeof params.q === "string" ? params.q : undefined;
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductGrid query={query} />
    </Suspense>
  );
}
