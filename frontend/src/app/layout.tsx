import type { Metadata } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/layout/theme-provider";
import { QueryProvider } from "@/components/layout/query-provider";
import { Chrome } from "@/components/layout/chrome";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { Toaster } from "sonner";

/**
 * Inter for text, Plus Jakarta Sans for display — a slightly rounder, warmer
 * geometry that carries the soft-modern headings without a serif.
 */
const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["500", "600", "700", "800"],
  variable: "--font-display",
  display: "swap",
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Xperience Delivery";

export const metadata: Metadata = {
  title: {
    default: `${APP_NAME} — Flowers & Fine Jewelry, by membership`,
    template: `%s · ${APP_NAME}`,
  },
  description:
    "A members' house for hand-tied flowers and fine jewelry, with insured worldwide delivery and live tracking on every parcel.",
  keywords: ["luxury flowers", "fine jewelry", "necklaces", "bouquet", "membership"],
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Flowers & Fine Jewelry`,
    description: "Hand-tied flowers and fine jewelry, delivered and tracked worldwide.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jakarta.variable} font-sans`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            <Chrome>{children}</Chrome>
            <CartDrawer />
            <SearchOverlay />
            <Toaster
              position="top-right"
              toastOptions={{
                className:
                  "!rounded-xl !border-border !bg-card !text-card-foreground !shadow-lift",
              }}
            />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
