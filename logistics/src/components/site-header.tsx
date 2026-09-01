"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Menu, Search, X } from "lucide-react";
import { VeloxaLogo } from "@/components/brand";

const NAV = [
  { href: "/services", label: "Services" },
  { href: "/network", label: "Network" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-navy-950/85 backdrop-blur-md border-b border-white/10" : "bg-transparent"
      }`}
    >
      <div className="container-wide flex items-center justify-between h-20">
        <VeloxaLogo />

        <nav className="hidden lg:flex items-center gap-8">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="text-sm text-mist-200 hover:text-white transition-colors"
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link href="/track" className="btn-primary !py-2.5 !px-5">
            <Search className="size-4" /> Track shipment
          </Link>
        </div>

        <button
          className="lg:hidden text-white p-2 -mr-2"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-white/10 bg-navy-950/95 backdrop-blur-md">
          <nav className="container-wide py-5 flex flex-col gap-1">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className="py-3 text-sm text-mist-200 hover:text-white border-b border-white/5"
              >
                {n.label}
              </Link>
            ))}
            <Link href="/track" onClick={() => setOpen(false)} className="btn-primary mt-4">
              <Search className="size-4" /> Track shipment
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
