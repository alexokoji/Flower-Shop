import Link from "next/link";
import { ReactNode } from "react";
import { Flower2, Gem, ShieldCheck, Truck } from "lucide-react";
import { Brand } from "@/components/layout/brand";

const PROOF = [
  { icon: Flower2, text: "Hand-tied the morning it travels" },
  { icon: Gem, text: "Solid gold and certified stones" },
  { icon: Truck, text: "Insured delivery across 48 countries" },
  { icon: ShieldCheck, text: "Live tracking on every parcel" },
];

/**
 * Auth screens are the front door now that the catalogue is members-only, so
 * the left panel does the selling while the right stays a calm, single-column
 * form.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      {/* -------------------------- brand panel -------------------------- */}
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div
          className="absolute -left-24 -top-24 size-[28rem] rounded-full bg-accent/25 blur-3xl"
          aria-hidden="true"
        />
        <div
          className="absolute -bottom-32 -right-16 size-[24rem] rounded-full bg-sage-500/20 blur-3xl"
          aria-hidden="true"
        />

        <Link href="/" className="relative flex items-center gap-2.5">
          <span className="display text-lg">Xperience Delivery</span>
        </Link>

        <div className="relative max-w-md">
          <h2 className="display text-display-lg">
            Quietly curated,
            <span className="block opacity-70">beautifully delivered.</span>
          </h2>
          <p className="mt-5 text-sm leading-relaxed opacity-75">
            An account opens the full collection, keeps your addresses and occasions to hand, and
            lets you book and track couriers of your own.
          </p>

          <ul className="mt-9 space-y-3.5">
            {PROOF.map((p) => {
              const Icon = p.icon;
              return (
                <li key={p.text} className="flex items-center gap-3 text-sm opacity-85">
                  <span className="grid size-8 shrink-0 place-items-center rounded-xl bg-white/10">
                    <Icon className="size-4" />
                  </span>
                  {p.text}
                </li>
              );
            })}
          </ul>
        </div>

        <p className="relative text-xs opacity-50">
          © {new Date().getFullYear()} Xperience Delivery
        </p>
      </section>

      {/* ----------------------------- form ------------------------------ */}
      <section className="flex flex-col">
        <div className="flex items-center justify-between p-5 lg:hidden">
          <Brand />
        </div>
        <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-md animate-fade-up">{children}</div>
        </div>
      </section>
    </div>
  );
}
