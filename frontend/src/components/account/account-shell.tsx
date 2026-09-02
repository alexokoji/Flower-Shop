"use client";

import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Heart,
  LayoutDashboard,
  LogOut,
  MapPin,
  Package,
  Settings,
  Bell,
  Send,
  Truck,
  CreditCard,
} from "lucide-react";
import { authStore } from "@/lib/api/client";
import { logout } from "@/lib/auth";
import { cn } from "@/lib/utils";
import type { User } from "@/types";

const NAV = [
  { href: "/account", label: "Overview", icon: LayoutDashboard },
  { href: "/account/orders", label: "My orders", icon: Package },
  { href: "/account/orders?tab=tracking", label: "Order tracking", icon: Truck },
  { href: "/account/shipments", label: "Send a shipment", icon: Send },
  { href: "/account/wishlist", label: "Wishlist", icon: Heart },
  { href: "/account/addresses", label: "Saved addresses", icon: MapPin },
  { href: "/account/payments", label: "Payment history", icon: CreditCard },
  { href: "/account/notifications", label: "Notifications", icon: Bell },
  { href: "/account/settings", label: "Account settings", icon: Settings },
];

type AuthSnapshot = { token: string; user: User | null; ready: boolean };

export function AccountShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [auth, setAuth] = useState<AuthSnapshot>({ token: "", user: null, ready: false });

  // The session is an httpOnly cookie, so it cannot be read synchronously the
  // way the old localStorage token could: stay in the "not ready" state until
  // the server has confirmed it, otherwise a signed-in user is bounced to
  // /login on every hard refresh.
  useEffect(() => {
    const apply = () =>
      setAuth({
        token: authStore.token,
        user: (authStore.model as User | null) ?? null,
        ready: authStore.ready,
      });
    apply();
    const off = authStore.onChange(apply);
    void authStore.load();
    return off;
  }, []);

  // Redirect once we've read the auth state and confirmed no token.
  useEffect(() => {
    if (auth.ready && !auth.token) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [auth.ready, auth.token, pathname, router]);

  if (!auth.ready) {
    return (
      <div className="container-edge py-24 text-center text-sm text-muted-foreground">
        Loading your account…
      </div>
    );
  }

  if (!auth.token) {
    // Brief flash while the redirect kicks in.
    return (
      <div className="container-edge py-24 text-center text-sm text-muted-foreground">
        Redirecting to sign in…
      </div>
    );
  }

  return (
    <div className="container-edge py-10 lg:py-14">
      <header className="mb-8 lg:mb-12">
        <p className="eyebrow">Your account</p>
        <h1 className="display-serif text-4xl lg:text-5xl mt-2">
          {auth.user ? `Welcome, ${auth.user.first_name}` : "Welcome"}
        </h1>
      </header>

      <div className="grid lg:grid-cols-[260px_1fr] gap-8">
        <aside className="lg:sticky lg:top-24 self-start">
          <nav className="surface-luxe p-2 lg:p-3">
            {NAV.map((n) => {
              const active = pathname === n.href || (n.href !== "/account" && pathname?.startsWith(n.href.split("?")[0]));
              const Icon = n.icon;
              return (
                <Link
                  key={n.href}
                  href={n.href}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                    active ? "bg-roseGold/15 text-roseGold-600" : "hover:bg-muted/60"
                  )}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
            <button
              type="button"
              onClick={async () => {
                // Await so the session cookie is cleared server-side before we
                // navigate, otherwise the next page can still render as signed in.
                await logout();
                router.replace("/");
                router.refresh();
              }}
              className="w-full mt-2 flex items-center gap-3 px-3 py-2.5 rounded-md text-sm hover:bg-muted/60 text-muted-foreground"
            >
              <LogOut className="size-4" />
              Sign out
            </button>
          </nav>
        </aside>

        <section className="min-w-0">{children}</section>
      </div>
    </div>
  );
}