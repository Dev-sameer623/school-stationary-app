import { notFound } from "next/navigation";
import { ProductForm } from "@/components/products/product-form";
import { AccessDenied } from "@/components/ui/feedback";
import { PageHeader } from "@/components/page-header";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";
import { money } from "@/lib/format";
import { getProduct } from "@/lib/services/catalog";

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requirePermission("productsManage");
  if (!user) return <AccessDenied />;
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getProduct(id),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (!product) notFound();

  return (
    <div>
      <PageHeader title={`Edit ${product.name}`} />
      <ProductForm
        categories={categories}
        product={{
          id: product.id,
          sku: product.sku,
          name: product.name,
          description: product.description,
          categoryId: product.categoryId,
          kind: product.kind,
          price: money(product.price),
          discountPercent: product.discountPercent,
          minimumStock: product.minimumStock,
          status: product.status,
          stockQuantity: product.stockQuantity,
          imageUrl: product.imageUrl,
          sizes: product.sizes.map((size) => ({
            id: size.id,
            size: size.size,
            price: money(size.price),
            discountPercent: size.discountPercent,
            stockQuantity: size.stockQuantity,
            minimumStock: size.minimumStock,
          })),
        }}
      />
    </div>
  );
}
