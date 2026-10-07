import Image from "next/image";
import Link from "next/link";
import { shopConfig } from "@/lib/shop-config";

const links = [
  ["Home", "/"],
  ["About", "/about"],
  ["Contact", "/contact"],
];

export function ShopFooter() {
  const shop = shopConfig();
  return (
    <footer className="bg-sidebar text-sidebar-foreground">
      <div className="grid gap-10 px-6 py-12 sm:px-8 lg:grid-cols-3 lg:px-10">
        <div className="flex items-start gap-3">
          <Image src="/stationery-emblem.jpg" alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-lg" />
          <div>
            <p className="font-serif text-2xl">{shop.name}</p>
            <p className="mt-2 max-w-xs text-sm leading-relaxed text-sidebar-foreground/80">{shop.address}</p>
          </div>
        </div>
        <nav className="flex flex-col gap-2 text-sm">
          {links.map(([label, href]) => (
            <Link key={href} href={href} className="w-fit hover:underline">
              {label}
            </Link>
          ))}
        </nav>
        <div className="text-sm leading-relaxed">
          <p className="text-xs uppercase tracking-[0.18em] text-sidebar-foreground/60">Visit the shop</p>
          <a href={`tel:${shop.phone}`} className="mt-3 block hover:underline">
            {shop.phone}
          </a>
          <a href={`mailto:${shop.email}`} className="mt-1 block hover:underline">
            {shop.email}
          </a>
        </div>
      </div>
    </footer>
  );
}
