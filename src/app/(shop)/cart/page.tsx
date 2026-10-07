import { CartView } from "@/components/shop/cart-view";
import { requireShopCustomer } from "@/actions/shop";

export default async function CartPage() {
  await requireShopCustomer("/cart");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-serif text-4xl">Cart</h1>
      <CartView />
    </div>
  );
}
