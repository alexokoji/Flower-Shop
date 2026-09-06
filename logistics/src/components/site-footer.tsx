import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { VeloxaMark } from "@/components/brand";
import { OFFICES, CONTACT } from "@/lib/site-config";

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
            <a
              href={`mailto:${CONTACT.general}`}
              className="mt-6 inline-flex items-center gap-2.5 text-sm text-mist-400 transition-colors hover:text-white"
            >
              <Mail className="size-4 shrink-0 text-signal-500" />
              {CONTACT.general}
            </a>
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

        {/* Offices. Details live in lib/site-config.ts and mirror the store's,
            so the two brands never disagree about where the company is. */}
        <div className="mt-12 grid gap-8 border-t border-white/10 pt-10 sm:grid-cols-2 lg:max-w-2xl">
          {OFFICES.map((o) => (
            <address key={o.id} className="not-italic">
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-white">
                <span aria-hidden="true">{o.flag}</span>
                {o.label}
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-velocity-400">
                {o.role}
              </p>
              <div className="mt-3 flex gap-2.5 text-sm text-mist-400">
                <MapPin className="mt-0.5 size-4 shrink-0 text-signal-500" />
                <span>
                  {o.lines.map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
                </span>
              </div>
              <a
                href={`tel:${o.phoneHref}`}
                className="mt-2.5 flex items-center gap-2.5 text-sm text-mist-400 transition-colors hover:text-white"
              >
                <Phone className="size-4 shrink-0 text-signal-500" />
                {o.phone}
              </a>
              <p className="mt-2.5 flex items-center gap-2.5 text-xs text-mist-400">
                <Clock className="size-4 shrink-0 text-signal-500" />
                {o.hours} {o.timezone}
              </p>
            </address>
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
