import { CatalogImage } from "@/components/catalog-image";
import { CategoryForm, DeleteCategoryButton } from "@/components/categories/category-manager";
import { PageHeader } from "@/components/page-header";
import { AccessDenied, EmptyState, Pagination } from "@/components/ui/feedback";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/field";
import { requirePermission } from "@/lib/auth/session";
import { listCategories } from "@/lib/services/catalog";
import { pageNumber, readParam } from "@/lib/utils";

export default async function CategoriesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await requirePermission("categoriesManage");
  if (!user) return <AccessDenied />;
  const params = await searchParams;
  const query = readParam(params.q) ?? "";
  const page = pageNumber(readParam(params.page));
  const categories = await listCategories(query, page);

  return (
    <div>
      <PageHeader title="Categories" description="Group products. A category with products cannot be deleted.">
        <CategoryForm />
      </PageHeader>
      <form className="mb-4 flex gap-2" method="get">
        <Input name="q" defaultValue={query} placeholder="Search categories" aria-label="Search categories" />
        <Button type="submit" variant="outline">
          Search
        </Button>
      </form>
      {categories.items.length === 0 ? (
        <EmptyState title="No categories found." description="Add a category such as Pens or Notebooks." />
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-border bg-muted text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Image</th>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Products</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.items.map((category) => (
                <tr key={category.id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <CatalogImage src={category.imageUrl} alt="" className="h-12 w-12 rounded-md" />
                  </td>
                  <td className="px-4 py-3 font-medium">{category.name}</td>
                  <td className="px-4 py-3">{category.description || "—"}</td>
                  <td className="px-4 py-3">{category._count.products}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <CategoryForm category={category} />
                      <DeleteCategoryButton id={category.id} name={category.name} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-4">
        <Pagination page={page} pageCount={categories.pageCount} params={{ q: query }} />
      </div>
    </div>
  );
}
