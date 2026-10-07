import { ShopHeaderBar } from "@/components/shop/header-bar";
import { IdleLogout } from "@/components/shop/idle-logout";
import type { ShopCustomer } from "@/lib/customer-auth/session";
import { shopConfig } from "@/lib/shop-config";

export function ShopHeader({ customer }: { customer: ShopCustomer | null }) {
  const shop = shopConfig();
  return (
    <header className="sticky top-0 z-30 bg-background">
      {customer ? <IdleLogout href="/api/customer/logout" /> : null}
      <ShopHeaderBar shopName={shop.name} customerName={customer?.name ?? null} />
    </header>
  );
}
