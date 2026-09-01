import type { Metadata } from "next";
import { HelpCircle, PackageSearch, ShieldQuestion } from "lucide-react";
import { TrackForm } from "@/components/track-form";

export const metadata: Metadata = {
  title: "Track a shipment",
  description:
    "Enter your Veloxa tracking number to see live status, current location and the full history of your shipment.",
};

const FAQ = [
  {
    icon: PackageSearch,
    q: "Where do I find my tracking number?",
    a: "It is issued the moment your shipment is paid for, and appears on your Veloxa receipt and in the booking confirmation. It always starts with VLX-.",
  },
  {
    icon: HelpCircle,
    q: "My number isn't found — why?",
    a: "Shipments become trackable once payment clears. If you booked in the last few minutes, wait a moment and try again. Otherwise check for a mistyped character.",
  },
  {
    icon: ShieldQuestion,
    q: "Who can see my shipment?",
    a: "Anyone with the tracking number sees status, route cities and the timeline. Street addresses, phone numbers and prices are never shown publicly.",
  },
];

export default function TrackLandingPage() {
  return (
    <div className="relative">
      <div className="absolute inset-0 grid-backdrop" aria-hidden="true" />
      <div className="container-wide relative py-20 lg:py-28">
        <div className="max-w-2xl">
          <p className="eyebrow">Tracking</p>
          <h1 className="display text-4xl lg:text-5xl text-white mt-3">
            Where is my shipment?
          </h1>
          <p className="text-mist-300 mt-4 leading-relaxed">
            Enter your tracking number below. No account, no sign-in — just the number from your
            receipt.
          </p>
        </div>

        <div className="panel p-6 lg:p-8 mt-8 max-w-3xl shadow-lift">
          <TrackForm autoFocus />
          <p className="text-xs text-mist-400 mt-4">
            Example: <span className="font-mono text-mist-200">VLX-4K7M-2Q9R</span>
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mt-16 max-w-5xl">
          {FAQ.map((f) => {
            const Icon = f.icon;
            return (
              <div key={f.q} className="panel p-6">
                <span className="inline-grid place-items-center size-10 rounded-xl bg-signal-500/15 text-signal-300">
                  <Icon className="size-5" />
                </span>
                <h2 className="display text-base text-white mt-4">{f.q}</h2>
                <p className="text-sm text-mist-300 mt-2 leading-relaxed">{f.a}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
