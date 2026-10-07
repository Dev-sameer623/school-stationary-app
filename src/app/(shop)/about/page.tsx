import { shopConfig } from "@/lib/shop-config";

export default function AboutPage() {
  const shop = shopConfig();
  return (
    <article className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="font-serif text-4xl">About {shop.name}</h1>
      <p className="mt-4 text-muted-foreground">
        Order stationery and uniforms before you come in. We pack the order so you can collect it and pay at the counter, instead of waiting while items are gathered.
      </p>
      <dl className="mt-8 grid gap-3 text-sm">
        <div>
          <dt className="text-muted-foreground">Address</dt>
          <dd>{shop.address}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Phone</dt>
          <dd>{shop.phone}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Email</dt>
          <dd>{shop.email}</dd>
        </div>
      </dl>
    </article>
  );
}
