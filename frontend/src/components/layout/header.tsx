"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useCart } from "@/stores/cart";
import { useSearchOverlay } from "@/stores/search-overlay";
import { ThemeToggle } from "./theme-toggle";
import { AccountMenu } from "./account-menu";
import { useHasMounted } from "@/hooks/use-has-mounted";

const NAV = [
  { label: "Flowers", href: "/shop?type=flower" },
  { label: "Necklaces", href: "/shop?type=necklace" },
  { label: "Occasions", href: "/occasions" },
  { label: "Consignment", href: "/consignment" },
  { label: "Our story", href: "/about" },
  { label: "Journal", href: "/journal" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const count = useCart((s) => s.count());
  const openCart = useCart((s) => s.openDrawer);
  const openSearch = useSearchOverlay((s) => s.open);
  const hasMounted = useHasMounted();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
      // Cmd/Ctrl + K opens search
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openSearch]);

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-all backdrop-blur",
          scrolled ? "bg-background/85 border-b border-border" : "bg-background/40"
        )}
      >
        <div className="container-edge flex h-16 lg:h-20 items-center justify-between gap-4">
          <button
            aria-label="Open menu"
            className="lg:hidden -ml-2 p-2"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>

          <Link href="/" className="display-serif text-2xl lg:text-3xl tracking-wide">
            Xperience <span className="text-roseGold">·</span> Delivery
          </Link>

          <nav className="hidden lg:flex items-center gap-8 text-sm">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="hover:text-roseGold transition-colors">
                {n.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              aria-label="Open search"
              onClick={openSearch}
              className="p-2 hover:text-roseGold"
            >
              <Search className="size-5" />
            </button>
            <Link href="/wishlist" aria-label="Wishlist" className="p-2 hover:text-roseGold">
              <Heart className="size-5" />
            </Link>
            <AccountMenu />
            <button
              aria-label="Open cart"
              onClick={openCart}
              className="relative p-2 hover:text-roseGold"
            >
              <ShoppingBag className="size-5" />
              {hasMounted && count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 grid place-items-center min-w-[18px] h-[18px] rounded-full bg-roseGold text-cream-50 text-[10px] font-medium px-1">
                  {count}
                </span>
              )}
            </button>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <MobileDrawer
        open={open}
        onClose={() => setOpen(false)}
        onSearch={() => { setOpen(false); openSearch(); }}
      />
    </>
  );
}

function MobileDrawer({
  open, onClose, onSearch,
}: { open: boolean; onClose: () => void; onSearch: () => void }) {
  return (
    <div
      className={cn(
        "fixed inset-0 z-[60] lg:hidden",
        open ? "pointer-events-auto" : "pointer-events-none"
      )}
      aria-hidden={!open}
    >
      <div
        className={cn(
          "absolute inset-0 bg-ink-900/60 transition-opacity duration-200",
          open ? "opacity-100" : "opacity-0"
        )}
        onClick={onClose}
      />
      <aside
        className={cn(
          "absolute left-0 top-0 h-full w-[85%] max-w-sm",
          "bg-cream-50 dark:bg-ink-950 text-foreground",
          "shadow-2xl border-r border-border",
          "flex flex-col transition-transform duration-300 ease-out",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between p-5 border-b border-border">
          <Link href="/" onClick={onClose} className="display-serif text-2xl">
            Xperience <span className="text-roseGold">·</span> Delivery
          </Link>
          <button aria-label="Close menu" onClick={onClose} className="p-2 -mr-2 rounded-md hover:bg-muted">
            <X className="size-5" />
          </button>
        </div>

        <div className="p-3 border-b border-border">
          <button
            onClick={onSearch}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-full border border-border text-sm text-muted-foreground hover:border-roseGold hover:text-roseGold"
          >
            <Search className="size-4" />
            Search products…
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto p-2">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              onClick={onClose}
              className="flex items-center justify-between px-4 py-4 text-lg display-serif border-b border-border/60 hover:text-roseGold transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-border p-5 space-y-3">
          <Link href="/account" onClick={onClose} className="flex items-center gap-3 px-2 py-2 text-sm hover:text-roseGold">
            <User className="size-4" /> My account
          </Link>
          <Link href="/wishlist" onClick={onClose} className="flex items-center gap-3 px-2 py-2 text-sm hover:text-roseGold">
            <Heart className="size-4" /> Wishlist
          </Link>
        </div>
      </aside>
    </div>
  );
}