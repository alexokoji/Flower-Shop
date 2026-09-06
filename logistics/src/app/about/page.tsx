import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight, Eye, HeartHandshake, Leaf, Timer } from "lucide-react";

export const metadata: Metadata = {
  title: "About",
  description:
    "Veloxa Logistics was built on one idea: a shipment nobody can see is a shipment nobody can trust.",
};

const VALUES = [
  {
    icon: Eye,
    title: "Visible by default",
    copy: "Every scan is public to whoever holds the tracking number. We do not hide delays behind a support queue.",
  },
  {
    icon: Timer,
    title: "Time is the product",
    copy: "We publish our on-time record and price our services against committed windows, not hopeful estimates.",
  },
  {
    icon: HeartHandshake,
    title: "One accountable team",
    copy: "A named coordinator owns your consignment end to end — no handing you between departments.",
  },
  {
    icon: Leaf,
    title: "Lighter footprint",
    copy: "Consolidated line-haul, right-sized packaging and an electrifying city fleet in our four largest hubs.",
  },
];

const MILESTONES = [
  { year: "2019", event: "Founded in Zürich with three vans and one alpine route." },
  { year: "2020", event: "Swiss customs brokerage brought in-house." },
  { year: "2021", event: "First long-haul lane opened: Zürich ↔ London." },
  { year: "2023", event: "New York hub opened; sea freight and the Americas added." },
  { year: "2024", event: "Live public tracking launched on every consignment." },
  { year: "2026", event: "48 countries served, 1.4M consignments a year." },
];

export default function AboutPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop" aria-hidden="true" />

      <div className="container-wide relative py-20 lg:py-28">
        <div className="max-w-3xl">
          <p className="eyebrow">About Veloxa</p>
          <h1 className="display text-4xl lg:text-5xl text-white mt-3 leading-tight">
            A shipment nobody can see is a shipment nobody can trust
          </h1>
          <p className="text-mist-300 mt-6 leading-relaxed text-lg">
            Veloxa started in 2019 with three vans in Zürich and a complaint we heard on repeat: people
            did not know where their goods were. Not roughly — at all. So we built the tracking first
            and the fleet around it.
          </p>
          <p className="text-mist-300 mt-4 leading-relaxed">
            Today we run hubs in Zürich and New York, move over a million consignments a year across
            48 countries, and every one of them carries a number anyone can paste into this website to
            see exactly what we see. That is still the whole idea.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-16">
          {VALUES.map((v) => {
            const Icon = v.icon;
            return (
              <div key={v.title} className="panel p-6">
                <span className="inline-grid place-items-center size-10 rounded-xl bg-velocity-400/15 text-velocity-400">
                  <Icon className="size-5" />
                </span>
                <h2 className="display text-lg text-white mt-4">{v.title}</h2>
                <p className="text-sm text-mist-300 mt-2 leading-relaxed">{v.copy}</p>
              </div>
            );
          })}
        </div>

        <section className="mt-20">
          <h2 className="display text-3xl text-white">How we got here</h2>
          <ol className="mt-8 relative border-l border-white/10 ml-3 space-y-8">
            {MILESTONES.map((m) => (
              <li key={m.year} className="pl-8 relative">
                <span className="absolute -left-[7px] top-1.5 size-3.5 rounded-full bg-signal-500 border-2 border-navy-950" />
                <p className="display text-xl text-velocity-400">{m.year}</p>
                <p className="text-sm text-mist-300 mt-1.5">{m.event}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="panel p-8 lg:p-10 mt-16 flex flex-wrap items-center justify-between gap-6">
          <div>
            <h2 className="display text-2xl text-white">Want to ship with us?</h2>
            <p className="text-sm text-mist-300 mt-2">
              Talk to our team about an account, or track an existing consignment.
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/contact" className="btn-primary">
              Contact us <ArrowRight className="size-4" />
            </Link>
            <Link href="/track" className="btn-ghost">
              Track a shipment
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
