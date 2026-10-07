import { ContactForm } from "@/components/shop/contact-form";
import { shopConfig } from "@/lib/shop-config";

export default function ContactPage() {
  const shop = shopConfig();
  return (
    <div className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-2">
      <div>
        <h1 className="font-serif text-4xl">Contact us</h1>
        <p className="mt-4 text-muted-foreground">Questions about an order or a school list? Send a note and we will reply from the shop.</p>
        <dl className="mt-6 grid gap-2 text-sm">
          <div>{shop.address}</div>
          <div>{shop.phone}</div>
          <div>{shop.email}</div>
        </dl>
      </div>
      <ContactForm />
    </div>
  );
}
