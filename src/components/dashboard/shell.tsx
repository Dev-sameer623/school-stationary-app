"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  Boxes,
  ChartColumn,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  UserRound,
  Ticket,
  ShoppingCart,
  Tags,
  Users,
  X,
} from "lucide-react";
import { logoutAction } from "@/actions/auth";
import { RoleBadge } from "@/components/status-badge";
import { cn } from "@/lib/utils";
import type { Role } from "@/types/action";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["ADMIN", "MANAGER"] },
  { href: "/products", label: "Products", icon: Package, roles: ["ADMIN", "MANAGER"] },
  { href: "/categories", label: "Categories", icon: Tags, roles: ["ADMIN"] },
  { href: "/stock", label: "Stock", icon: Boxes, roles: ["ADMIN", "MANAGER"] },
  { href: "/orders", label: "Orders", icon: ShoppingCart, roles: ["ADMIN", "MANAGER"] },
  { href: "/coupons", label: "Coupons", icon: Ticket, roles: ["ADMIN", "MANAGER"] },
  { href: "/customers", label: "Customers", icon: Users, roles: ["ADMIN", "MANAGER"] },
  { href: "/reports", label: "Reports", icon: ChartColumn, roles: ["ADMIN", "MANAGER"] },
  { href: "/users", label: "Users", icon: Users, roles: ["ADMIN"] },
  { href: "/settings", label: "My profile", icon: UserRound, roles: ["ADMIN", "MANAGER"] },
] as const;

export function AppShell({
  user,
  children,
}: {
  user: { name: string; email: string; role: Role };
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const visible = links.filter((link) => (link.roles as readonly Role[]).includes(user.role));

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 p-3">
      {visible.map((link) => {
        const Icon = link.icon;
        const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm",
              active ? "bg-white/10 text-[#f7f3ea]" : "text-[#d9d0c2] hover:bg-white/5 hover:text-white",
            )}
          >
            <Icon className="h-4 w-4" aria-hidden />
            {link.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[16rem_1fr]">
      <aside className="no-print hidden bg-sidebar text-sidebar-foreground lg:flex lg:flex-col">
        <div className="border-b border-white/10 px-5 py-5">
          <p className="text-[0.65rem] uppercase tracking-[0.22em] text-[#c4b8a4]">School outfitter</p>
          <p className="mt-1 font-serif text-xl font-medium text-[#f7f3ea]">Stationery & Uniforms</p>
        </div>
        {nav}
        <form action={logoutAction} className="p-3">
          <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#d9d0c2] hover:bg-white/5 hover:text-white">
            <LogOut className="h-4 w-4" aria-hidden />
            Logout
          </button>
        </form>
      </aside>

      {open ? (
        <div className="no-print fixed inset-0 z-40 lg:hidden">
          <button className="absolute inset-0 bg-black/40" aria-label="Close menu" onClick={() => setOpen(false)} />
          <aside className="relative flex h-full w-72 flex-col bg-sidebar text-sidebar-foreground">
            <div className="flex items-center justify-between px-5 py-5">
              <p className="font-serif text-lg">Stationery & Uniforms</p>
              <button aria-label="Close menu" onClick={() => setOpen(false)}>
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <form action={logoutAction} className="p-3">
              <button className="flex w-full items-center gap-3 rounded-md px-3 py-2 text-sm text-[#d9d0c2] hover:bg-white/5 hover:text-white">
                <LogOut className="h-4 w-4" aria-hidden />
                Logout
              </button>
            </form>
          </aside>
        </div>
      ) : null}

      <div className="min-w-0">
        <header className="no-print flex items-center justify-between border-b border-border bg-card px-4 py-3 lg:px-6">
          <button className="rounded-md border border-border p-2 lg:hidden" aria-label="Open menu" onClick={() => setOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <div className="ml-auto flex items-center gap-3">
            <Link href="/settings" className="text-right">
              <p className="text-sm font-medium">{user.name}</p>
              <p className="text-xs text-primary">My profile</p>
            </Link>
            <RoleBadge role={user.role} />
          </div>
        </header>
        <main className="px-4 py-6 lg:px-6">{children}</main>
      </div>
    </div>
  );
}
