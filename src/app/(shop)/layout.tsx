import type { Metadata } from "next";
import { ShopFooter } from "@/components/shop/footer";
import { ShopHeader } from "@/components/shop/header";
import { getShopCustomer } from "@/lib/customer-auth/session";
import { shopConfig } from "@/lib/shop-config";

export async function generateMetadata(): Promise<Metadata> {
  const shop = shopConfig();
  return {
    title: {
      default: shop.name,
      template: `%s · ${shop.name}`,
    },
    description: `${shop.name} packs school stationery before you visit. Pay when you collect at the counter.`,
  };
}

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const customer = await getShopCustomer();
  return (
    <div className="relative flex min-h-screen flex-col">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute -left-24 -top-24 h-80 w-80 rounded-full bg-[#d5e6d8] blur-3xl" />
        <div className="absolute right-0 top-32 h-96 w-96 rounded-full bg-[#f3e2c0] blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-[#e4efe6] blur-3xl" />
      </div>
      <ShopHeader customer={customer} />
      <main className="flex-1">{children}</main>
      <ShopFooter />
    </div>
  );
}
