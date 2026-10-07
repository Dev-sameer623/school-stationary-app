import { CatalogImage } from "@/components/catalog-image";
import { shopConfig } from "@/lib/shop-config";

const steps = [
  ["1", "Choose items", "Pick stationery and uniforms from the shelves below."],
  ["2", "We pack them", "The shop gets the order ready before you arrive."],
  ["3", "Collect and pay", "Pay at the counter when you pick everything up."],
];

export function ShopIntro() {
  const shop = shopConfig();
  return (
    <>
      <section className="grid items-stretch md:min-h-[50vh] md:grid-cols-2">
        <div className="flex flex-col justify-center px-4 py-10 sm:px-8 lg:px-14">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-primary">Order ahead</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight text-primary sm:text-5xl lg:text-6xl">
            Collect your stationery without the wait.
          </h1>
          <p className="mt-5 max-w-xl text-xl leading-relaxed text-foreground md:text-2xl">
            {shop.name} packs your order before you visit, so you are not standing in line while items are gathered. Choose what you need now, then pay when you collect it at {shop.address}.
          </p>
          <a href="#products" className="mt-8 inline-flex h-12 w-fit items-center rounded-full bg-primary px-6 text-sm font-medium text-primary-foreground">
            Browse products
          </a>
        </div>
        <CatalogImage
          src="/images/catalog/notebook.png"
          alt="Notebooks ready for collection"
          preload
          sizes="(max-width: 768px) 100vw, 50vw"
          className="h-[70vh] w-full md:h-auto md:min-h-[50vh]"
        />
      </section>

      <ol className="grid bg-primary text-primary-foreground md:grid-cols-3">
        {steps.map(([number, title, text]) => (
          <li key={number} className="border-primary-foreground/15 px-6 py-8 sm:px-8 md:border-l md:first:border-l-0 lg:px-12">
            <p className="font-serif text-3xl">{number}</p>
            <h2 className="mt-2 text-lg font-medium">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">{text}</p>
          </li>
        ))}
      </ol>
    </>
  );
}
