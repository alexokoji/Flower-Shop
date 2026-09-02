"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Bell, CreditCard, Flower2, Heart, LayoutDashboard, LogOut, MapPin, Menu,
  Package, Search, Send, Settings, ShoppingBag, Shield, Truck, X,
} from "lucide-react";

import { Brand } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { authStore } from "@/lib/api/client";
import { logout } from "@/lib/auth";
import { useCart } from "@/stores/cart";
import { useSearchOverlay } from "@/stores/search-overlay";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

/**
 * The shell every signed-in page sits in: a persistent sidebar on desktop, a
 * slide-over on mobile, and a slim top bar for search, cart and account.
 *
 * Route protection is middleware's job — this only decides what to *show*, so a
 * slow session fetch never flashes the wrong navigation.
 */

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
}

const SHOP_NAV: NavItem[] = [
  { href: "/shop", label: "Browse", icon: Flower2 },
  { href: "/occasions", label: "Occasions", icon: Heart },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/cart", label: "Cart", icon: ShoppingBag },
];

const ACCOUNT_NAV: NavItem[] = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "Orders", icon: Package },
  { href: "/account/shipments", label: "Send a parcel", icon: Send },
  { href: "/account/addresses", label: "Addresses", icon: MapPin },
  { href: "/account/payments", label: "Payments", icon: CreditCard },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [open, setOpen] = useState(false);
  const cartCount = useCart((s) => s.items.reduce((n, i) => n + i.quantity, 0));
  const openSearch = useSearchOverlay((s) => s.open);

  useEffect(() => {
    const apply = () => setUser((authStore.model as User | null) ?? null);
    apply();
    const off = authStore.onChange(apply);
    void authStore.load();
    return off;
  }, []);

  // Close the mobile drawer whenever the route changes.
  useEffect(() => setOpen(false), [pathname]);

  const nav = (
    <>
      <NavGroup label="Shop" items={SHOP_NAV} pathname={pathname} cartCount={cartCount} />
      <NavGroup label="Account" items={ACCOUNT_NAV} pathname={pathname} />
      {user?.role === "admin" && (
        <NavGroup
          label="Staff"
          items={[
            { href: "/admin", label: "Admin", icon: Shield },
            { href: "/admin/logistics", label: "Veloxa", icon: Truck },
          ]}
          pathname={pathname}
        />
      )}
    </>
  );

  return (
    <div className="flex min-h-screen bg-background">
      {/* ------------------------------ sidebar ------------------------------ */}
      <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="flex h-16 items-center px-5">
          <Brand />
        </div>

        <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">{nav}</nav>

        <div className="border-t border-border p-3">
          <UserCard user={user} onSignOut={async () => { await logout(); router.replace("/"); }} />
        </div>
      </aside>

      {/* ------------------------- mobile drawer ---------------------------- */}
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-foreground/20 backdrop-blur-sm animate-fade-in"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-border bg-surface animate-scale-in">
            <div className="flex h-16 items-center justify-between px-5">
              <Brand />
              <Button variant="ghost" size="icon-sm" onClick={() => setOpen(false)} aria-label="Close menu">
                <X />
              </Button>
            </div>
            <nav className="flex-1 space-y-6 overflow-y-auto px-3 py-4">{nav}</nav>
            <div className="border-t border-border p-3">
              <UserCard user={user} onSignOut={async () => { await logout(); router.replace("/"); }} />
            </div>
          </aside>
        </div>
      )}

      {/* -------------------------------- main ------------------------------- */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-40 flex h-16 items-center gap-3 border-b border-border bg-background/80 px-4 backdrop-blur-md lg:px-8">
          <Button
            variant="ghost"
            size="icon-sm"
            className="lg:hidden"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
          >
            <Menu />
          </Button>

          <div className="lg:hidden">
            <Brand compact />
          </div>

          <button
            type="button"
            onClick={openSearch}
            className="ml-auto hidden h-10 w-full max-w-sm items-center gap-2.5 rounded-full border border-border bg-card px-4 text-sm text-muted-foreground shadow-xs transition-colors hover:border-foreground/20 sm:flex lg:ml-0 lg:mr-auto"
          >
            <Search className="size-4" />
            Search flowers, jewelry…
          </button>

          <div className="ml-auto flex items-center gap-1.5">
            <Button variant="ghost" size="icon-sm" className="sm:hidden" onClick={openSearch} aria-label="Search">
              <Search />
            </Button>
            <ThemeToggle />
            <Button asChild variant="ghost" size="icon-sm" className="relative">
              <Link href="/cart" aria-label="Cart">
                <ShoppingBag />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 grid size-4 place-items-center rounded-full bg-accent text-[10px] font-semibold text-accent-foreground">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
            </Button>
          </div>
        </header>

        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function NavGroup({
  label,
  items,
  pathname,
  cartCount,
}: {
  label: string;
  items: NavItem[];
  pathname: string | null;
  cartCount?: number;
}) {
  return (
    <div>
      <p className="px-3 pb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
        {label}
      </p>
      <ul className="space-y-0.5">
        {items.map((item) => {
          // `/account` must not light up for `/account/orders`.
          const active =
            pathname === item.href ||
            (item.href !== "/account" && item.href !== "/admin" && pathname?.startsWith(`${item.href}/`));
          const Icon = item.icon;
          const count = item.href === "/cart" ? cartCount : undefined;

          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "group relative flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors duration-150",
                  active
                    ? "bg-card font-medium text-foreground shadow-xs"
                    : "text-muted-foreground hover:bg-card/60 hover:text-foreground"
                )}
              >
                {active && (
                  <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-accent" />
                )}
                <Icon className={cn("size-4 shrink-0", active && "text-accent")} />
                <span className="truncate">{item.label}</span>
                {!!count && count > 0 && (
                  <Badge variant="accent" size="sm" className="ml-auto">
                    {count}
                  </Badge>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function UserCard({ user, onSignOut }: { user: User | null; onSignOut: () => void }) {
  const initials =
    `${user?.first_name?.[0] ?? ""}${user?.last_name?.[0] ?? ""}`.toUpperCase() || "··";

  return (
    <div className="flex items-center gap-3 rounded-xl p-2">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-accent/12 text-xs font-semibold text-accent">
        {initials}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {user ? `${user.first_name} ${user.last_name}` : "Loading…"}
        </p>
        <p className="truncate text-xs text-muted-foreground">{user?.email ?? ""}</p>
      </div>
      <Button variant="ghost" size="icon-sm" onClick={onSignOut} aria-label="Sign out">
        <LogOut />
      </Button>
    </div>
  );
}
