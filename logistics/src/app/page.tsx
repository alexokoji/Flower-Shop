import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Boxes,
  Clock3,
  Globe2,
  PackageCheck,
  Plane,
  Route,
  ShieldCheck,
  Ship,
  Truck,
  Warehouse,
} from "lucide-react";
import { TrackForm } from "@/components/track-form";

const STATS = [
  { value: "48", suffix: "countries", label: "served across four continents" },
  { value: "99.2", suffix: "%", label: "on-time delivery, last 12 months" },
  { value: "1.4", suffix: "M", label: "consignments moved each year" },
  { value: "24/7", suffix: "", label: "live tracking and support" },
];

const SERVICES = [
  {
    id: "same-day",
    icon: Clock3,
    title: "Same-day courier",
    copy: "Collected within the hour and delivered across the city before close of business.",
    points: ["Sub-4 hour city-wide", "Live courier location", "Proof of delivery photo"],
  },
  {
    id: "express",
    icon: Plane,
    title: "International express",
    copy: "Priority air freight with customs handled end to end, door to door.",
    points: ["2–5 day transit", "Customs brokerage", "Duties prepaid option"],
  },
  {
    id: "freight",
    icon: Ship,
    title: "Freight forwarding",
    copy: "Palletised, containerised and out-of-gauge cargo by sea, air and road.",
    points: ["FCL & LCL", "Temperature control", "Project cargo"],
  },
  {
    id: "ecommerce",
    icon: Boxes,
    title: "E-commerce fulfilment",
    copy: "Pick, pack and last-mile for online stores — including our sister brand's flowers.",
    points: ["Same-day dispatch", "Fragile handling", "Returns management"],
  },
  {
    id: "warehousing",
    icon: Warehouse,
    title: "Warehousing",
    copy: "Bonded and ambient storage with real-time stock visibility.",
    points: ["Bonded facilities", "Inventory API", "Cross-docking"],
  },
  {
    id: "road",
    icon: Truck,
    title: "Road haulage",
    copy: "Scheduled trunking between our hubs, with dedicated vehicles on request.",
    points: ["Nightly trunk runs", "Dedicated fleet", "Tail-lift available"],
  },
];

const STEPS = [
  {
    icon: PackageCheck,
    title: "Book your consignment",
    copy: "Enter sender, receiver and package details in your Veloxa partner portal. One flat rate per shipment — weight and distance do not change it.",
  },
  {
    icon: Route,
    title: "We collect and move it",
    copy: "Your parcel enters the network at the nearest hub. Every scan, transfer and handover is written to its timeline.",
  },
  {
    icon: BadgeCheck,
    title: "Track to the doorstep",
    copy: "Share the tracking number with anyone. They see live status and location — no account, no login.",
  },
];

const HUBS = [
  { city: "Lagos", country: "Nigeria", role: "Global HQ & air hub" },
  { city: "Accra", country: "Ghana", role: "West Africa gateway" },
  { city: "Nairobi", country: "Kenya", role: "East Africa hub" },
  { city: "Johannesburg", country: "South Africa", role: "Southern hub" },
  { city: "London", country: "United Kingdom", role: "Europe gateway" },
  { city: "Dubai", country: "UAE", role: "Middle East transit" },
  { city: "New York", country: "United States", role: "Americas gateway" },
  { city: "Guangzhou", country: "China", role: "Asia sourcing hub" },
];

const PROMISES = [
  {
    icon: ShieldCheck,
    title: "Insured end to end",
    copy: "Declare your cargo's value and we cover it from collection to signature.",
  },
  {
    icon: Globe2,
    title: "Customs without surprises",
    copy: "Our brokers clear your goods and quote duties before you ship, not after.",
  },
  {
    icon: Clock3,
    title: "Time-definite delivery",
    copy: "Every service carries a committed transit window, and we publish our record against it.",
  },
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-backdrop" aria-hidden="true" />
        <div
          className="absolute -top-40 left-1/2 -translate-x-1/2 h-[520px] w-[900px] rounded-full blur-[130px] opacity-40
                     bg-[radial-gradient(circle,rgba(37,99,235,0.55)_0%,rgba(34,211,238,0.25)_45%,transparent_70%)]"
          aria-hidden="true"
        />

        <div className="container-wide relative pt-20 pb-24 lg:pt-28 lg:pb-32">
          <div className="max-w-3xl animate-slide-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 text-xs text-mist-200">
              <span className="size-1.5 rounded-full bg-velocity-400 animate-pulse-dot" />
              Live tracking on every consignment
            </span>

            <h1 className="display text-5xl sm:text-6xl lg:text-7xl text-white mt-6 leading-[1.05]">
              Swift by nature.
              <span className="block text-mist-400">Precise by design.</span>
            </h1>

            <p className="text-lg text-mist-200 mt-6 max-w-xl leading-relaxed">
              Veloxa moves parcels, documents and freight across 48 countries — and tells you exactly
              where yours is, at every step of the way.
            </p>
          </div>

          {/* tracking box */}
          <div className="panel p-6 lg:p-8 mt-10 max-w-3xl shadow-lift animate-slide-in">
            <p className="eyebrow">Track your shipment</p>
            <h2 className="display text-xl text-white mt-2 mb-5">
              Enter your Veloxa tracking number
            </h2>
            <TrackForm />
            <p className="text-xs text-mist-400 mt-4">
              Tracking numbers look like <span className="font-mono text-mist-200">VLX-4K7M-2Q9R</span> and
              appear on your booking receipt.
            </p>
          </div>

          {/* stats */}
          <dl className="grid grid-cols-2 lg:grid-cols-4 gap-6 mt-16 border-t border-white/10 pt-10">
            {STATS.map((s) => (
              <div key={s.label}>
                <dt className="display text-4xl text-white">
                  {s.value}
                  <span className="text-velocity-400 text-2xl ml-1">{s.suffix}</span>
                </dt>
                <dd className="text-sm text-mist-400 mt-2 leading-snug">{s.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------ services ---------------------------- */}
      <section id="services" className="border-t border-white/10 bg-navy-900/40">
        <div className="container-wide py-20 lg:py-28">
          <div className="max-w-2xl">
            <p className="eyebrow">What we move</p>
            <h2 className="display text-4xl lg:text-5xl text-white mt-3">
              One carrier, every leg of the journey
            </h2>
            <p className="text-mist-300 mt-4 leading-relaxed">
              From a single envelope across Lagos to a container out of Guangzhou — the same network,
              the same tracking number, the same people answering the phone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mt-12">
            {SERVICES.map((s) => {
              const Icon = s.icon;
              return (
                <article
                  key={s.id}
                  id={s.id}
                  className="panel p-6 hover:border-signal-500/40 hover:bg-navy-800/60 transition-colors group"
                >
                  <span className="inline-grid place-items-center size-11 rounded-xl bg-signal-500/15 text-signal-300 group-hover:bg-signal-500/25 transition-colors">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="display text-xl text-white mt-5">{s.title}</h3>
                  <p className="text-sm text-mist-300 mt-2 leading-relaxed">{s.copy}</p>
                  <ul className="mt-4 space-y-1.5">
                    {s.points.map((p) => (
                      <li key={p} className="text-xs text-mist-400 flex items-center gap-2">
                        <span className="size-1 rounded-full bg-velocity-400" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* ---------------------------- how it works -------------------------- */}
      <section className="border-t border-white/10">
        <div className="container-wide py-20 lg:py-28">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-12 lg:gap-20 items-start">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="display text-4xl lg:text-5xl text-white mt-3">
                Booked in minutes. Visible for its whole life.
              </h2>
              <p className="text-mist-300 mt-4 leading-relaxed">
                Consignments are booked in the Veloxa partner portal by account holders. This site is
                where anyone — sender, receiver or buyer — watches it move.
              </p>
              <Link href="/track" className="btn-primary mt-8">
                Track a shipment <ArrowRight className="size-4" />
              </Link>
            </div>

            <ol className="space-y-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title} className="panel p-6 flex gap-5">
                    <div className="flex flex-col items-center">
                      <span className="grid place-items-center size-11 rounded-full bg-signal-500 text-white shrink-0">
                        <Icon className="size-5" />
                      </span>
                      {i < STEPS.length - 1 && (
                        <span className="w-px flex-1 bg-gradient-to-b from-signal-500/60 to-transparent mt-2" />
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-velocity-400 font-semibold">Step {i + 1}</p>
                      <h3 className="display text-lg text-white mt-1">{s.title}</h3>
                      <p className="text-sm text-mist-300 mt-2 leading-relaxed">{s.copy}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------ network ----------------------------- */}
      <section id="network" className="border-t border-white/10 bg-navy-900/40">
        <div className="container-wide py-20 lg:py-28">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="max-w-xl">
              <p className="eyebrow">The network</p>
              <h2 className="display text-4xl lg:text-5xl text-white mt-3">
                Eight hubs. Forty-eight countries.
              </h2>
              <p className="text-mist-300 mt-4 leading-relaxed">
                Our own facilities in the cities that matter, and vetted partners everywhere else — so
                a shipment never changes hands without a scan.
              </p>
            </div>
            <Link href="/network" className="btn-ghost">
              Explore coverage <ArrowRight className="size-4" />
            </Link>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-12">
            {HUBS.map((h) => (
              <div
                key={h.city}
                className="panel p-5 hover:border-velocity-400/40 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="size-1.5 rounded-full bg-velocity-400 animate-pulse-dot" />
                  <p className="display text-lg text-white">{h.city}</p>
                </div>
                <p className="text-xs text-mist-400 mt-1">{h.country}</p>
                <p className="text-xs text-signal-300 mt-3">{h.role}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ----------------------------- promises ----------------------------- */}
      <section className="border-t border-white/10">
        <div className="container-wide py-20 lg:py-28">
          <div className="grid md:grid-cols-3 gap-6">
            {PROMISES.map((p) => {
              const Icon = p.icon;
              return (
                <div key={p.title} className="flex gap-4">
                  <span className="grid place-items-center size-11 rounded-xl bg-velocity-400/15 text-velocity-400 shrink-0">
                    <Icon className="size-5" />
                  </span>
                  <div>
                    <h3 className="display text-lg text-white">{p.title}</h3>
                    <p className="text-sm text-mist-300 mt-2 leading-relaxed">{p.copy}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* -------------------------------- CTA ------------------------------- */}
      <section className="border-t border-white/10">
        <div className="container-wide py-16 lg:py-20">
          <div className="panel relative overflow-hidden p-10 lg:p-14">
            <div
              className="absolute -right-24 -top-24 size-80 rounded-full blur-[100px] opacity-50
                         bg-[radial-gradient(circle,rgba(34,211,238,0.5)_0%,transparent_70%)]"
              aria-hidden="true"
            />
            <div className="relative grid lg:grid-cols-[1fr_auto] gap-8 items-center">
              <div>
                <h2 className="display text-3xl lg:text-4xl text-white">
                  Have a tracking number? Let&apos;s find it.
                </h2>
                <p className="text-mist-300 mt-3 max-w-lg">
                  Paste it below — no account needed. You&apos;ll see every scan from collection to
                  signature.
                </p>
              </div>
              <div className="lg:w-[420px] w-full">
                <TrackForm size="sm" />
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
