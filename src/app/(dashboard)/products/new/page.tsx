import { ProductForm } from "@/components/products/product-form";
import { AccessDenied } from "@/components/ui/feedback";
import { PageHeader } from "@/components/page-header";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/db/prisma";

export default async function NewProductPage() {
  const user = await requirePermission("productsManage");
  if (!user) return <AccessDenied />;
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <div>
      <PageHeader title="Add product" description="Opening stock is recorded as a stock transaction." />
      {categories.length === 0 ? (
        <p className="text-sm text-muted-foreground">Add a category before creating a product.</p>
      ) : (
        <ProductForm categories={categories} />
      )}
    </div>
  );
}
