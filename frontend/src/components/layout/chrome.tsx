"use client";

import { usePathname } from "next/navigation";
import { MarketingShell } from "@/components/layout/marketing-shell";
import { AppShell } from "@/components/layout/app-shell";

/**
 * Picks the chrome for the current route.
 *
 * Doing it in one place rather than adding a layout.tsx beside each of 51 pages
 * keeps the rule legible and means a new page gets the right shell for free.
 * The lists mirror middleware.ts — that file decides who may enter, this one
 * decides what the page is wrapped in.
 */

const MARKETING = new Set([
  "/",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
]);

/** Auth screens are full-bleed: no sidebar, no marketing header. */
const BARE_PREFIXES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
];

export function Chrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";

  if (BARE_PREFIXES.some((p) => pathname.startsWith(p))) {
    return <>{children}</>;
  }

  // /admin brings its own shell and navigation — wrapping it in the customer
  // sidebar too would put two sidebars on screen.
  if (pathname.startsWith("/admin")) {
    return <>{children}</>;
  }

  if (MARKETING.has(pathname)) {
    return <MarketingShell>{children}</MarketingShell>;
  }

  return <AppShell>{children}</AppShell>;
}
