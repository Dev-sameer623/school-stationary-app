"use client";

import { faBars, faCartShopping, faMagnifyingGlass, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { readCart } from "@/components/shop/cart-store";

export function ShopHeaderBar({
  shopName,
  customerName,
}: {
  shopName: string;
  customerName: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [itemCount, setItemCount] = useState(0);

  useEffect(() => {
    const update = () => setItemCount(readCart().length);
    update();
    window.addEventListener("shop-cart", update);
    window.addEventListener("storage", update);
    return () => {
      window.removeEventListener("shop-cart", update);
      window.removeEventListener("storage", update);
    };
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  function search(event: React.FormEvent) {
    event.preventDefault();
    const term = query.trim();
    router.push(term ? `/?q=${encodeURIComponent(term)}` : "/", { scroll: false });
  }

  return (
    <div className="relative px-3 py-3 sm:px-5">
      <div className="flex h-20 items-center gap-2 rounded-2xl border border-border bg-card px-3 shadow-sm sm:gap-3 sm:px-5">
        <button
          type="button"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
          className="flex h-10 w-10 shrink-0 items-center justify-center text-primary"
        >
          <FontAwesomeIcon icon={menuOpen ? faXmark : faBars} className="h-5 w-5" />
        </button>

        <Link href="/" aria-label={shopName} className="relative block h-14 w-44 shrink-0 overflow-hidden sm:h-[4.25rem] sm:w-72">
          <Image
            src="/stationery-logo.jpg"
            alt=""
            width={640}
            height={360}
            preload
            className="absolute left-1/2 top-1/2 h-[210%] w-auto max-w-none -translate-x-1/2 -translate-y-1/2 mix-blend-multiply"
          />
        </Link>

        <form action="/" method="get" onSubmit={search} className="ml-auto flex min-w-0 flex-1 items-center justify-end gap-1 sm:max-w-md sm:gap-2">
          <input
            name="q"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search products"
            aria-label="Search products"
            className="h-10 min-w-0 flex-1 rounded-full border border-border bg-background px-4 text-sm outline-none ring-primary focus:ring-2"
          />
          <button
            type="submit"
            aria-label="Search"
            className="flex h-10 w-10 shrink-0 items-center justify-center text-primary"
          >
            <FontAwesomeIcon icon={faMagnifyingGlass} className="h-5 w-5" />
          </button>
          <Link
            href="/cart"
            aria-label={itemCount === 1 ? "Cart, 1 item" : itemCount > 0 ? `Cart, ${itemCount} items` : "Cart"}
            className="relative flex h-10 w-10 items-center justify-center text-primary"
          >
            <FontAwesomeIcon icon={faCartShopping} className="h-5 w-5" />
            {itemCount > 0 ? (
              <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#f0c14b] px-1 text-[11px] font-semibold text-primary">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </form>
      </div>

      {menuOpen ? (
        <nav className="absolute left-3 right-3 top-full z-20 mt-2 grid gap-1 rounded-2xl border border-border bg-card p-3 shadow-lg sm:left-5 sm:right-auto sm:w-56">
          <MenuLink href="/">Home</MenuLink>
          <MenuLink href="/about">About</MenuLink>
          <MenuLink href="/contact">Contact</MenuLink>
          {customerName ? (
            <>
              <MenuLink href="/account/orders">My orders</MenuLink>
              <p className="px-3 py-2 text-sm text-muted-foreground">{customerName}</p>
              <a href="/api/customer/logout" className="rounded-xl px-3 py-2 text-sm hover:bg-muted">
                Log out
              </a>
            </>
          ) : (
            <>
              <MenuLink href="/account/login">Log in</MenuLink>
              <MenuLink href="/account/signup">Sign up</MenuLink>
            </>
          )}
        </nav>
      ) : null}
    </div>
  );
}

function MenuLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="rounded-xl px-3 py-2 text-sm hover:bg-muted">
      {children}
    </Link>
  );
}
