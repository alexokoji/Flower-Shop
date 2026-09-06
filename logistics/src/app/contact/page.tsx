import type { Metadata } from "next";
import Link from "next/link";
import { Clock, FileWarning, Mail, MapPin, MessageSquare, Phone } from "lucide-react";
import { TrackForm } from "@/components/track-form";
import { OFFICES, CONTACT } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Veloxa Logistics support, open an account, or file a claim. Offices in New York and Zürich.",
};

const CHANNELS = [
  {
    icon: Phone,
    title: "Call the US",
    lines: [OFFICES[0].phone, `${OFFICES[0].hours} ${OFFICES[0].timezone}`],
  },
  {
    icon: Phone,
    title: "Call Europe",
    lines: [OFFICES[1].phone, `${OFFICES[1].hours} ${OFFICES[1].timezone}`],
  },
  {
    icon: Mail,
    title: "Email",
    lines: [CONTACT.general, "Replies within one business day"],
  },
  {
    icon: MessageSquare,
    title: "Existing shipment",
    lines: [CONTACT.support, "Quote your VLX tracking number"],
  },
];

export default function ContactPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop" aria-hidden="true" />

      <div className="container-wide relative py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">Contact</p>
          <h1 className="display text-4xl lg:text-5xl text-white mt-3">Talk to a human</h1>
          <p className="text-mist-300 mt-4 leading-relaxed">
            Most questions are about a shipment already on the move — in that case, have your tracking
            number ready and we can answer straight away.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
          {CHANNELS.map((c) => {
            const Icon = c.icon;
            return (
              <div key={c.title} className="panel p-6">
                <span className="inline-grid place-items-center size-10 rounded-xl bg-signal-500/15 text-signal-300">
                  <Icon className="size-5" />
                </span>
                <h2 className="display text-base text-white mt-4">{c.title}</h2>
                {c.lines.map((l, i) => (
                  <p
                    key={l}
                    className={i === 0 ? "text-sm text-white mt-2" : "text-xs text-mist-400 mt-1"}
                  >
                    {l}
                  </p>
                ))}
              </div>
            );
          })}
        </div>

        <div className="grid lg:grid-cols-2 gap-6 mt-6">
          <section className="panel p-6 lg:p-8">
            <h2 className="display text-xl text-white">Checking on a shipment?</h2>
            <p className="text-sm text-mist-300 mt-2 mb-6">
              Tracking answers most questions instantly — status, location and every scan so far.
            </p>
            <TrackForm size="sm" />
          </section>

          <section id="claims" className="panel p-6 lg:p-8 scroll-mt-28">
            <span className="inline-grid place-items-center size-10 rounded-xl bg-amber-400/15 text-amber-300">
              <FileWarning className="size-5" />
            </span>
            <h2 className="display text-xl text-white mt-4">Filing a claim</h2>
            <p className="text-sm text-mist-300 mt-2 leading-relaxed">
              For loss or damage, email <span className="text-white">claims@veloxa.com</span> within 14
              days of the delivery date with:
            </p>
            <ul className="mt-4 space-y-2">
              {[
                "Your VLX tracking number",
                "Photographs of the packaging and contents",
                "The commercial invoice or declared value",
                "A short description of what went wrong",
              ].map((item) => (
                <li key={item} className="text-sm text-mist-300 flex items-start gap-2.5">
                  <span className="size-1 rounded-full bg-velocity-400 mt-2 shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="text-xs text-mist-400 mt-5 flex items-center gap-2">
              <Clock className="size-3.5" /> Claims are acknowledged within 2 business days.
            </p>
          </section>
        </div>

        {/* Both offices, in full. */}
        <section className="mt-6 grid gap-5 lg:grid-cols-2">
          {OFFICES.map((o) => (
            <div key={o.id} className="panel p-6 lg:p-8">
              <p className="flex items-center gap-2 text-sm font-semibold text-white">
                <span aria-hidden="true">{o.flag}</span>
                {o.label}
                <span className="font-normal text-mist-400">· {o.country}</span>
              </p>
              <p className="mt-1 text-[11px] uppercase tracking-[0.14em] text-velocity-400">
                {o.role}
              </p>

              <div className="mt-5 space-y-3 text-sm">
                <div className="flex gap-3">
                  <MapPin className="mt-0.5 size-4 shrink-0 text-signal-500" />
                  <address className="not-italic leading-relaxed text-mist-300">
                    {o.lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                </div>
                <a
                  href={`tel:${o.phoneHref}`}
                  className="flex items-center gap-3 font-medium text-white transition-colors hover:text-velocity-400"
                >
                  <Phone className="size-4 shrink-0 text-signal-500" />
                  {o.phone}
                </a>
                <p className="flex items-center gap-3 text-mist-400">
                  <Clock className="size-4 shrink-0 text-signal-500" />
                  {o.hours} {o.timezone}
                </p>
              </div>
            </div>
          ))}
        </section>

        <p className="text-sm text-mist-400 mt-10">
          Looking to open an account and book shipments?{" "}
          <Link href="/about" className="text-signal-300 hover:text-white">
            Read about how we work
          </Link>{" "}
          then email <span className="text-white">accounts@veloxa.com</span>.
        </p>
      </div>
    </div>
  );
}
