import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Clock, Mail, MapPin, Phone, Truck } from "lucide-react";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { OFFICES, CONTACT } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Reach Xperience Delivery in New York or Zürich — customer care, wholesale and press contacts, with addresses and phone numbers for both ateliers.",
};

const DESKS = [
  {
    icon: Mail,
    title: "Customer care",
    body: "Orders, deliveries, returns and anything already on its way.",
    email: CONTACT.support,
  },
  {
    icon: Truck,
    title: "Wholesale & events",
    body: "Weddings, corporate gifting and standing weekly arrangements.",
    email: CONTACT.events,
  },
  {
    icon: Mail,
    title: "Press",
    body: "Images, founder interviews and product samples.",
    email: CONTACT.press,
  },
];

export default function ContactPage() {
  return (
    <div className="relative">
      <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />

      <div className="container-page py-16 lg:py-24">
        <header className="max-w-2xl animate-fade-up">
          <p className="eyebrow">Get in touch</p>
          <h1 className="display mt-3 text-display-lg">We&apos;d love to hear from you</h1>
          <p className="lede mt-5">
            A question about an order, a bespoke arrangement or a private commission — a person reads
            every message, and we usually reply within one business day.
          </p>
        </header>

        {/* ------------------------------ desks ------------------------------ */}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {DESKS.map((d) => {
            const Icon = d.icon;
            return (
              <Card key={d.title} interactive className="p-6">
                <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                  <Icon className="size-5" />
                </span>
                <h2 className="display mt-5 text-base">{d.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{d.body}</p>
                <a
                  href={`mailto:${d.email}`}
                  className="mt-4 inline-block break-all text-sm font-medium text-accent hover:underline"
                >
                  {d.email}
                </a>
              </Card>
            );
          })}
        </div>

        {/* ----------------------------- offices ----------------------------- */}
        <section className="mt-16">
          <div className="max-w-2xl">
            <p className="eyebrow">Our ateliers</p>
            <h2 className="display mt-3 text-display-md">Come and see us</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Both studios are open to visitors by appointment — email ahead and we&apos;ll put the
              kettle on.
            </p>
          </div>

          <div className="mt-8 grid gap-5 lg:grid-cols-2">
            {OFFICES.map((o) => (
              <Card key={o.id} className="p-7">
                <p className="flex items-center gap-2 text-sm font-medium">
                  <span aria-hidden="true">{o.flag}</span>
                  {o.label}
                  <span className="font-normal text-muted-foreground">· {o.country}</span>
                </p>

                <div className="mt-5 space-y-3 text-sm">
                  <div className="flex gap-3">
                    <MapPin className="mt-0.5 size-4 shrink-0 text-accent" />
                    <address className="not-italic leading-relaxed text-muted-foreground">
                      {o.lines.map((line) => (
                        <span key={line} className="block">
                          {line}
                        </span>
                      ))}
                    </address>
                  </div>

                  <a
                    href={`tel:${o.phoneHref}`}
                    className="flex items-center gap-3 font-medium text-foreground transition-colors hover:text-accent"
                  >
                    <Phone className="size-4 shrink-0 text-accent" />
                    {o.phone}
                  </a>

                  <p className="flex items-center gap-3 text-muted-foreground">
                    <Clock className="size-4 shrink-0 text-accent" />
                    {o.hours} {o.timezone}
                  </p>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ----------------------------- tracking ---------------------------- */}
        <Card className="mt-12 flex flex-wrap items-center justify-between gap-6 p-8">
          <div>
            <h2 className="display text-lg">Chasing a delivery?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Tracking answers most questions instantly — status, location and every scan so far.
            </p>
          </div>
          <Button asChild variant="accent">
            <Link href="/account/orders">
              Track an order <ArrowRight />
            </Link>
          </Button>
        </Card>
      </div>
    </div>
  );
}
