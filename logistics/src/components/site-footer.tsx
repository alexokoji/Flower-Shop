import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { VeloxaMark } from "@/components/brand";

const COLUMNS = [
  {
    title: "Services",
    links: [
      { href: "/services#same-day", label: "Same-day courier" },
      { href: "/services#express", label: "International express" },
      { href: "/services#freight", label: "Freight forwarding" },
      { href: "/services#ecommerce", label: "E-commerce fulfilment" },
    ],
  },
  {
    title: "Company",
    links: [
      { href: "/about", label: "About Veloxa" },
      { href: "/network", label: "Our network" },
      { href: "/contact", label: "Contact us" },
    ],
  },
  {
    title: "Support",
    links: [
      { href: "/track", label: "Track a shipment" },
      { href: "/contact#claims", label: "File a claim" },
      { href: "/terms", label: "Terms of carriage" },
      { href: "/privacy", label: "Privacy policy" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-white/10 bg-navy-950 no-print">
      <div className="container-wide py-14">
        <div className="grid gap-10 lg:grid-cols-[1.4fr_repeat(3,1fr)]">
          <div>
            <div className="flex items-center gap-2.5">
              <VeloxaMark className="size-8" />
              <span className="display text-lg text-white tracking-[0.18em]">VELOXA</span>
            </div>
            <p className="text-sm text-mist-400 mt-4 max-w-xs leading-relaxed">
              Swift by nature. Air, road and freight forwarding with live tracking on every
              consignment we carry.
            </p>
            <ul className="mt-6 space-y-2.5 text-sm text-mist-400">
              <li className="flex items-center gap-2.5">
                <MapPin className="size-4 text-signal-500 shrink-0" />
                14 Adeola Odeku Street, Victoria Island, Lagos
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 text-signal-500 shrink-0" />
                +234 800 835 6921
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 text-signal-500 shrink-0" />
                hello@veloxa.com
              </li>
            </ul>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-white">
                {col.title}
              </p>
              <ul className="mt-4 space-y-2.5">
                {col.links.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      className="text-sm text-mist-400 hover:text-white transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-12 pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-xs text-mist-400">
            © {new Date().getFullYear()} Veloxa Logistics. All rights reserved.
          </p>
          <p className="text-xs text-mist-400">
            Shipments are booked through your Veloxa account partner portal.
          </p>
        </div>
      </div>
    </footer>
  );
}
