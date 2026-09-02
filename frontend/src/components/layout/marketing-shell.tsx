"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Menu, X } from "lucide-react";

import { Brand, BrandMark } from "@/components/layout/brand";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { authStore } from "@/lib/api/client";
import { cn } from "@/lib/utils";

/**
 * Chrome for the pages a signed-out visitor can reach: home, about, contact and
 * the legal set. Everything else lives behind AppShell.
 */

const NAV = [
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

const FOOTER = [
  {
    title: "Company",
    links: [
      { href: "/about", label: "About us" },
      { href: "/contact", label: "Contact" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms" },
      { href: "/privacy", label: "Privacy" },
      { href: "/cookies", label: "Cookies" },
    ],
  },
  {
    title: "Members",
    links: [
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Create account" },
      { href: "/shop", label: "The collection" },
    ],
  },
];

export function MarketingShell({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const apply = () => setSignedIn(authStore.isValid);
    apply();
    const off = authStore.onChange(apply);
    void authStore.load();
    return off;
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <header
        className={cn(
          "sticky top-0 z-50 transition-all duration-300",
          scrolled
            ? "border-b border-border bg-background/85 backdrop-blur-md"
            : "border-b border-transparent"
        )}
      >
        <div className="container-page flex h-18 items-center justify-between">
          <Brand />

          <nav className="hidden items-center gap-1 md:flex">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="rounded-full px-4 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <ThemeToggle />
            {signedIn ? (
              <Button asChild size="sm" variant="accent" className="hidden sm:inline-flex">
                <Link href="/shop">
                  Enter the shop <ArrowRight />
                </Link>
              </Button>
            ) : (
              <>
                <Button asChild size="sm" variant="ghost" className="hidden sm:inline-flex">
                  <Link href="/login">Sign in</Link>
                </Button>
                <Button asChild size="sm" variant="accent" className="hidden sm:inline-flex">
                  <Link href="/register">Join</Link>
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="icon-sm"
              className="md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X /> : <Menu />}
            </Button>
          </div>
        </div>

        {open && (
          <div className="border-t border-border bg-background md:hidden">
            <nav className="container-page flex flex-col gap-1 py-4">
              {NAV.map((n) => (
                <Link
                  key={n.href}
                  href={n.href}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-2.5 text-sm text-muted-foreground hover:bg-secondary hover:text-foreground"
                >
                  {n.label}
                </Link>
              ))}
              <div className="mt-2 flex gap-2">
                {signedIn ? (
                  <Button asChild variant="accent" block>
                    <Link href="/shop">Enter the shop</Link>
                  </Button>
                ) : (
                  <>
                    <Button asChild variant="outline" block>
                      <Link href="/login">Sign in</Link>
                    </Button>
                    <Button asChild variant="accent" block>
                      <Link href="/register">Join</Link>
                    </Button>
                  </>
                )}
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="container-page py-14">
          <div className="grid gap-10 lg:grid-cols-[1.5fr_repeat(3,1fr)]">
            <div>
              <Brand />
              <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
                Flowers and fine jewelry for the moments worth marking. Members shop the full
                collection with insured worldwide delivery.
              </p>
            </div>

            {FOOTER.map((col) => (
              <div key={col.title}>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-foreground">
                  {col.title}
                </p>
                <ul className="mt-4 space-y-2.5">
                  {col.links.map((l) => (
                    <li key={l.href}>
                      <Link
                        href={l.href}
                        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                      >
                        {l.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-border pt-6">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <BrandMark className="size-4" />
              © {new Date().getFullYear()} Xperience Delivery
            </div>
            <p className="text-xs text-muted-foreground">
              Parcels tracked by{" "}
              <span className="font-medium text-foreground">Veloxa Logistics</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
