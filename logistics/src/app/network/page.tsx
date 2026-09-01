import type { Metadata } from "next";
import { Globe2, Plane, Ship, Truck } from "lucide-react";

export const metadata: Metadata = {
  title: "Network",
  description:
    "Veloxa operates eight owned hubs and vetted partners across 48 countries in Africa, Europe, the Middle East, Asia and the Americas.",
};

const REGIONS = [
  {
    region: "Africa",
    icon: Truck,
    countries: 21,
    hubs: [
      { city: "Lagos", country: "Nigeria", role: "Global HQ & air hub" },
      { city: "Accra", country: "Ghana", role: "West Africa gateway" },
      { city: "Nairobi", country: "Kenya", role: "East Africa hub" },
      { city: "Johannesburg", country: "South Africa", role: "Southern hub" },
    ],
  },
  {
    region: "Europe",
    icon: Plane,
    countries: 14,
    hubs: [{ city: "London", country: "United Kingdom", role: "Europe gateway" }],
  },
  {
    region: "Middle East",
    icon: Globe2,
    countries: 6,
    hubs: [{ city: "Dubai", country: "UAE", role: "Middle East transit" }],
  },
  {
    region: "Americas & Asia",
    icon: Ship,
    countries: 7,
    hubs: [
      { city: "New York", country: "United States", role: "Americas gateway" },
      { city: "Guangzhou", country: "China", role: "Asia sourcing hub" },
    ],
  },
];

const LANES = [
  { from: "Lagos", to: "London", mode: "Air express", transit: "3 days" },
  { from: "Guangzhou", to: "Lagos", mode: "Sea freight", transit: "28 days" },
  { from: "Lagos", to: "New York", mode: "Air express", transit: "4 days" },
  { from: "Dubai", to: "Nairobi", mode: "Air express", transit: "2 days" },
  { from: "Accra", to: "Lagos", mode: "Road trunk", transit: "1 day" },
  { from: "London", to: "Johannesburg", mode: "Air express", transit: "4 days" },
];

export default function NetworkPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop" aria-hidden="true" />

      <div className="container-wide relative py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">The network</p>
          <h1 className="display text-4xl lg:text-5xl text-white mt-3">
            Owned where it counts, partnered where it helps
          </h1>
          <p className="text-mist-300 mt-4 leading-relaxed">
            We run our own facilities in eight cities and work with vetted agents everywhere else. The
            rule never changes: cargo does not move between hands without a scan.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-14">
          {REGIONS.map((r) => {
            const Icon = r.icon;
            return (
              <section key={r.region} className="panel p-6">
                <span className="inline-grid place-items-center size-10 rounded-xl bg-signal-500/15 text-signal-300">
                  <Icon className="size-5" />
                </span>
                <h2 className="display text-lg text-white mt-4">{r.region}</h2>
                <p className="text-xs text-mist-400 mt-1">{r.countries} countries served</p>
                <ul className="mt-4 space-y-3">
                  {r.hubs.map((h) => (
                    <li key={h.city} className="border-t border-white/10 pt-3">
                      <div className="flex items-center gap-2">
                        <span className="size-1.5 rounded-full bg-velocity-400" />
                        <p className="text-sm text-white">{h.city}</p>
                      </div>
                      <p className="text-xs text-mist-400 mt-0.5 pl-3.5">{h.country}</p>
                      <p className="text-xs text-signal-300 mt-1 pl-3.5">{h.role}</p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>

        <section className="panel p-6 lg:p-8 mt-6">
          <h2 className="display text-2xl text-white">Popular lanes</h2>
          <p className="text-sm text-mist-300 mt-2">
            Indicative transit times, hub to hub. Door-to-door adds one to two days each end.
          </p>

          <div className="mt-6 overflow-x-auto">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.14em] text-mist-400">
                  <th className="pb-3 font-medium">Origin</th>
                  <th className="pb-3 font-medium">Destination</th>
                  <th className="pb-3 font-medium">Mode</th>
                  <th className="pb-3 font-medium text-right">Transit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {LANES.map((l) => (
                  <tr key={`${l.from}-${l.to}`}>
                    <td className="py-3 text-white">{l.from}</td>
                    <td className="py-3 text-white">{l.to}</td>
                    <td className="py-3 text-mist-300">{l.mode}</td>
                    <td className="py-3 text-right text-velocity-400">{l.transit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
