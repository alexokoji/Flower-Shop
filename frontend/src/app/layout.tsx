import type { Metadata } from "next";
import { Inter, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { PromoBar } from "@/components/layout/promo-bar";
import { QueryProvider } from "@/components/layout/query-provider";
import { CartDrawer } from "@/components/cart/cart-drawer";
import { SearchOverlay } from "@/components/layout/search-overlay";
import { NewsletterModal } from "@/components/marketing/newsletter-modal";
import { Toaster } from "sonner";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-serif",
  display: "swap",
});

const APP_NAME = process.env.NEXT_PUBLIC_APP_NAME ?? "Xperience Delivery";

export const metadata: Metadata = {
  title: { default: `${APP_NAME} — Luxury Flowers & Fine Jewelry`, template: `%s · ${APP_NAME}` },
  description:
    "Hand-crafted floral arrangements and fine necklaces, designed for the moments that matter. Worldwide insured delivery.",
  keywords: ["luxury flowers", "fine jewelry", "necklaces", "bouquet", "diamond", "gold"],
  openGraph: {
    type: "website",
    siteName: APP_NAME,
    title: `${APP_NAME} — Luxury Flowers & Fine Jewelry`,
    description: "Hand-crafted floral arrangements and fine necklaces.",
  },
  twitter: { card: "summary_large_image" },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${cormorant.variable} font-sans min-h-screen flex flex-col`}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <QueryProvider>
            <PromoBar />
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <CartDrawer />
            <SearchOverlay />
            <NewsletterModal />
            <Toaster richColors position="top-right" />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}