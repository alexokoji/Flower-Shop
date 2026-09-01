import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Boxes, Clock3, Plane, Ship, Truck, Warehouse } from "lucide-react";

export const metadata: Metadata = {
  title: "Services",
  description:
    "Same-day courier, international express, freight forwarding, e-commerce fulfilment, warehousing and road haulage from Veloxa Logistics.",
};

const SERVICES = [
  {
    id: "same-day",
    icon: Clock3,
    title: "Same-day courier",
    lead: "Across the city, before the day ends.",
    copy: "A dedicated rider or van collects within the hour and goes straight to the receiver — no hub, no sorting, no overnight. Ideal for documents, medical samples and anything that cannot wait.",
    specs: [
      ["Transit", "Under 4 hours, city-wide"],
      ["Max weight", "30 kg per consignment"],
      ["Proof", "Photo and signature on delivery"],
    ],
  },
  {
    id: "express",
    icon: Plane,
    title: "International express",
    lead: "Door to door across 48 countries.",
    copy: "Priority air freight with in-house customs brokerage. We quote duties before departure so nothing is held at the border, and the receiver is never asked for a surprise payment.",
    specs: [
      ["Transit", "2–5 business days"],
      ["Customs", "Brokerage included"],
      ["Duties", "Prepaid or collect"],
    ],
  },
  {
    id: "freight",
    icon: Ship,
    title: "Freight forwarding",
    lead: "Pallets, containers and out-of-gauge cargo.",
    copy: "Sea, air and road freight with consolidation at our hubs. Temperature-controlled and project cargo handled by a named coordinator who stays with your booking from quote to discharge.",
    specs: [
      ["Modes", "FCL, LCL, air charter"],
      ["Transit", "12+ days by sea"],
      ["Extras", "Reefer, flat rack, breakbulk"],
    ],
  },
  {
    id: "ecommerce",
    icon: Boxes,
    title: "E-commerce fulfilment",
    lead: "Your storefront's back office.",
    copy: "We hold your stock, pick and pack each order, and run the last mile — including the fragile, perishable work we do for our sister brand, Xperience Delivery.",
    specs: [
      ["Dispatch", "Same-day cut-off 4pm"],
      ["Handling", "Fragile and perishable"],
      ["Returns", "Managed and restocked"],
    ],
  },
  {
    id: "warehousing",
    icon: Warehouse,
    title: "Warehousing",
    lead: "Space that reports on itself.",
    copy: "Bonded and ambient storage across our hub network, with live stock counts through the same portal you use to book shipments. Cross-docking available for fast-turn inventory.",
    specs: [
      ["Facilities", "Bonded and ambient"],
      ["Visibility", "Live inventory API"],
      ["Terms", "Monthly, no lock-in"],
    ],
  },
  {
    id: "road",
    icon: Truck,
    title: "Road haulage",
    lead: "Scheduled trunking between hubs.",
    copy: "Nightly line-haul on fixed routes, plus dedicated vehicles when a load needs to travel alone. Tail-lift and two-person delivery available on request.",
    specs: [
      ["Schedule", "Nightly trunk runs"],
      ["Options", "Dedicated vehicle"],
      ["Equipment", "Tail-lift, pump truck"],
    ],
  },
];

export default function ServicesPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop" aria-hidden="true" />

      <div className="container-wide relative py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">Services</p>
          <h1 className="display text-4xl lg:text-5xl text-white mt-3">
            Every leg, under one tracking number
          </h1>
          <p className="text-mist-300 mt-4 leading-relaxed">
            Whatever combination of air, road and sea your cargo needs, it keeps the same reference
            from collection to signature — and the same team answering for it.
          </p>
        </div>

        <div className="mt-14 space-y-5">
          {SERVICES.map((s) => {
            const Icon = s.icon;
            return (
              <article
                key={s.id}
                id={s.id}
                className="panel p-6 lg:p-8 scroll-mt-28 grid lg:grid-cols-[auto_1fr_320px] gap-6 lg:gap-10 items-start"
              >
                <span className="inline-grid place-items-center size-12 rounded-xl bg-signal-500/15 text-signal-300 shrink-0">
                  <Icon className="size-6" />
                </span>

                <div>
                  <h2 className="display text-2xl text-white">{s.title}</h2>
                  <p className="text-velocity-400 text-sm mt-1">{s.lead}</p>
                  <p className="text-sm text-mist-300 mt-4 leading-relaxed max-w-2xl">{s.copy}</p>
                </div>

                <dl className="divide-y divide-white/10 lg:border-l lg:border-white/10 lg:pl-8 w-full">
                  {s.specs.map(([k, v]) => (
                    <div key={k} className="flex items-baseline justify-between gap-4 py-2.5">
                      <dt className="text-xs text-mist-400">{k}</dt>
                      <dd className="text-sm text-white text-right">{v}</dd>
                    </div>
                  ))}
                </dl>
              </article>
            );
          })}
        </div>

        <div className="panel p-8 lg:p-10 mt-10 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="display text-2xl text-white">Already shipping with us?</h2>
            <p className="text-sm text-mist-300 mt-2">
              Track any consignment with its Veloxa number — no account needed.
            </p>
          </div>
          <Link href="/track" className="btn-primary">
            Track a shipment <ArrowRight className="size-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
