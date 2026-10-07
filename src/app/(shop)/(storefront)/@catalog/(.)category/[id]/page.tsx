import { Suspense } from "react";
import { ProductGrid } from "@/components/shop/product-grid";
import { ProductGridSkeleton } from "@/components/shop/product-grid-skeleton";

export default async function InterceptedCategoryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <Suspense fallback={<ProductGridSkeleton />}>
      <ProductGrid categoryId={id} />
    </Suspense>
  );
}
