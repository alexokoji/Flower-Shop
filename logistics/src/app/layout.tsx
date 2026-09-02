import type { Metadata } from "next";
import "./globals.css";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";

// `??` alone is not enough: an env var that exists but is empty (easy to do in
// a hosting dashboard) would reach `new URL("")` and fail the production build.
const SITE_URL = safeUrl(process.env.NEXT_PUBLIC_SITE_URL, "https://veloxa.com");

function safeUrl(value: string | undefined, fallback: string) {
  const candidate = (value ?? "").trim();
  if (!candidate) return fallback;
  try {
    return new URL(candidate).toString().replace(/\/$/, "");
  } catch {
    return fallback;
  }
}

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Veloxa Logistics — Swift by nature",
    template: "%s · Veloxa",
  },
  description:
    "Veloxa moves parcels, documents and freight across borders with live tracking on every consignment. Track your shipment with your Veloxa tracking number.",
  openGraph: {
    title: "Veloxa Logistics — Swift by nature",
    description: "Track any Veloxa shipment in seconds. Air, road and freight forwarding worldwide.",
    url: SITE_URL,
    siteName: "Veloxa Logistics",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen flex flex-col">
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
      </body>
    </html>
  );
}
