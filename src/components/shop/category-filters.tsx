"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CatalogImage } from "@/components/catalog-image";

const allShots = [
  "/images/catalog/pen.png",
  "/images/catalog/notebook.png",
  "/images/catalog/shirt.png",
  "/images/catalog/bag.png",
];

export function CategoryFilters({
  categories,
}: {
  categories: Array<{ id: string; name: string; imageUrl: string | null }>;
}) {
  const pathname = usePathname();
  const activeId = pathname.startsWith("/category/") ? pathname.split("/")[2] : undefined;

  return (
    <nav aria-label="Categories" className="flex gap-2 overflow-x-auto px-4 pt-6 sm:px-6 lg:px-8">
      <FilterChip href="/" label="All" selected={!activeId} image={<AllShelf />} />
      {categories.map((category) => (
        <FilterChip
          key={category.id}
          href={`/category/${category.id}`}
          label={category.name}
          selected={activeId === category.id}
          image={
            <CatalogImage src={category.imageUrl} alt="" sizes="72px" className="h-full w-full" />
          }
        />
      ))}
    </nav>
  );
}

function FilterChip({
  href,
  label,
  selected,
  image,
}: {
  href: string;
  label: string;
  selected: boolean;
  image: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      scroll={false}
      prefetch={true}
      aria-current={selected ? "true" : undefined}
      className={`relative h-[4.5rem] w-[5.75rem] shrink-0 overflow-hidden rounded-xl border ${selected ? "border-primary ring-2 ring-primary ring-offset-2" : "border-border"}`}
    >
      {image}
      <span className="absolute inset-x-0 bottom-0 bg-black/55 px-1.5 py-1 text-center text-[11px] font-medium leading-none text-white">
        {label}
      </span>
    </Link>
  );
}

function AllShelf() {
  return (
    <span className="grid h-full w-full grid-cols-2 grid-rows-2">
      {allShots.map((src) => (
        <CatalogImage key={src} src={src} alt="" sizes="40px" className="h-full w-full" />
      ))}
    </span>
  );
}
