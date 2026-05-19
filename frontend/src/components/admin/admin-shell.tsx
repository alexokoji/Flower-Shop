"use client";

import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import {
  LayoutDashboard, Package, Tag, ShoppingBag, Users, Star, Ticket,
  Truck, LogOut, ExternalLink, ArrowLeft,
} from "lucide-react";
import { pb } from "@/lib/pb";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const NAV = [
  { href: "/admin",            label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/products",   label: "Products",  icon: Package },
  { href: "/admin/categories", label: "Categories", icon: Tag },
  { href: "/admin/orders",     label: "Orders",    icon: ShoppingBag },
  { href: "/admin/customers",  label: "Customers", icon: Users },
  { href: "/admin/reviews",    label: "Reviews",   icon: Star },
  { href: "/admin/coupons",    label: "Coupons",   icon: Ticket },
  { href: "/admin/shipping",   label: "Shipping",  icon: Truck },
];

type AuthSnapshot = { user: User | null; ready: boolean };

export function AdminShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthSnapshot>({ user: null, ready: false });

  useEffect(() => {
    const apply = () => setAuth({
      user: (pb().authStore.model as User | null) ?? null,
      ready: true,
    });
    apply();
    const off = pb().authStore.onChange(apply);
    return off;
  }, []);

  // Redirect non-admins
  useEffect(() => {
    if (!auth.ready) return;
    if (!auth.user) router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    else if (auth.user.role !== "admin") router.replace("/");
  }, [auth, pathname, router]);

  if (!auth.ready) {
    return <div className="container-edge py-24 text-center text-sm text-muted-foreground">Loading admin…</div>;
  }
  if (!auth.user || auth.user.role !== "admin") {
    return <div className="container-edge py-24 text-center text-sm text-muted-foreground">Forbidden — redirecting…</div>;
  }

  return (
    <div className="grid lg:grid-cols-[240px_1fr] min-h-[calc(100vh-9rem)]">
      <aside className="lg:sticky lg:top-24 lg:self-start lg:h-[calc(100vh-6rem)] border-r border-border bg-cream-100/40 dark:bg-card/40">
        <div className="p-5 border-b border-border">
          <p className="eyebrow">Admin</p>
          <p className="text-sm font-medium mt-1 truncate">{auth.user.email}</p>
        </div>
        <nav className="p-2 space-y-0.5">
          {NAV.map((n) => {
            const active = pathname === n.href || (n.href !== "/admin" && pathname?.startsWith(n.href));
            const Icon = n.icon;
            return (
              <Link
                key={n.href}
                href={n.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                  active ? "bg-roseGold/15 text-roseGold-600 font-medium" : "hover:bg-muted/60"
                )}
              >
                <Icon className="size-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-2 mt-2 border-t border-border space-y-0.5">
          <a
            href={`${process.env.NEXT_PUBLIC_PB_URL ?? "http://localhost:8090"}/_/`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/60"
          >
            <ExternalLink className="size-4" /> PocketBase UI
          </a>
          <Link href="/" className="flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/60">
            <ArrowLeft className="size-4" /> Back to storefront
          </Link>
          <button
            onClick={() => { logout(); router.replace("/"); router.refresh(); }}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm text-muted-foreground hover:bg-muted/60"
          >
            <LogOut className="size-4" /> Sign out
          </button>
        </div>
      </aside>
      <section className="min-w-0 p-6 lg:p-10">{children}</section>
    </div>
  );
}