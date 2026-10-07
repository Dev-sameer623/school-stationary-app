import { CheckoutForm } from "@/components/shop/checkout-form";
import { requireShopCustomer } from "@/actions/shop";

export default async function CheckoutPage() {
  const customer = await requireShopCustomer("/checkout");
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="mb-6 font-serif text-4xl">Checkout</h1>
      <CheckoutForm customer={customer} />
    </div>
  );
}
