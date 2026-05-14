import Link from "next/link";
import { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-[calc(100vh-5rem)] grid lg:grid-cols-2">
      <section className="relative hidden lg:block overflow-hidden">
        <div
          className="absolute inset-0 bg-gradient-to-br from-roseGold-200 via-softPink-100 to-cream-100"
          aria-hidden
        />
        <div
          className="absolute inset-0 opacity-50 mix-blend-multiply"
          aria-hidden
          style={{
            backgroundImage:
              "radial-gradient(circle at 30% 30%, hsl(var(--rose-gold)/0.4), transparent 45%), radial-gradient(circle at 70% 70%, hsl(var(--gold)/0.3), transparent 45%)",
          }}
        />
        <div className="relative h-full flex flex-col justify-between p-12 text-ink-900">
          <Link href="/" className="display-serif text-3xl">
            Xperience <span className="text-roseGold-600">·</span> Delivery
          </Link>
          <div className="space-y-4 max-w-md">
            <p className="eyebrow text-ink/70">An invitation</p>
            <h2 className="display-serif text-4xl xl:text-5xl leading-tight">
              Quietly curated, beautifully delivered.
            </h2>
            <p className="text-sm leading-relaxed text-ink/70">
              An account unlocks early access to seasonal edits, faster checkout,
              and a personal record of the gifts you've sent — and the ones you'll keep for yourself.
            </p>
          </div>
          <div className="text-xs text-ink/60">© {new Date().getFullYear()} Xperience Delivery</div>
        </div>
      </section>
      <section className="flex items-center justify-center p-6 sm:p-10 lg:p-14">
        <div className="w-full max-w-md">{children}</div>
      </section>
    </div>
  );
}
