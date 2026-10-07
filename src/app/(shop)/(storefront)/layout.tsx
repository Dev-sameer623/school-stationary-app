import { CategoryFilters } from "@/components/shop/category-filters";
import { ShopIntro } from "@/components/shop/shop-intro";
import { listShopCategories } from "@/lib/services/shop";

export default async function StorefrontLayout({
  children,
  catalog,
}: {
  children: React.ReactNode;
  catalog: React.ReactNode;
}) {
  const categories = await listShopCategories();
  return (
    <div>
      <ShopIntro />
      <CategoryFilters categories={categories} />
      {catalog}
      {children}
    </div>
  );
}
