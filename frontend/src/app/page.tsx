import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, BadgeCheck, Flower2, Gem, Globe2, Lock, PackageCheck, Sparkles, Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { MARKETING_IMAGES, BLUR_DATA_URL } from "@/lib/marketing-images";
import { FOUNDED } from "@/lib/site-config";

/**
 * The public homepage. Its whole job is to explain what this is and invite
 * people in — the catalogue itself lives behind the membership wall.
 */

const PILLARS = [
  {
    icon: Flower2,
    title: "Flowers, hand-tied daily",
    body: "Cut to order the morning they travel, arranged by florists who sign their work. Seasonal stems, never held stock.",
  },
  {
    icon: Gem,
    title: "Jewelry worth keeping",
    body: "Solid gold, freshwater pearl and certified stones. Pieces chosen to outlast the occasion that prompted them.",
  },
  {
    icon: Truck,
    title: "Tracked to the doorstep",
    body: "Every parcel moves on our own logistics network, with live tracking anyone can follow from booking to signature.",
  },
];

const STEPS = [
  {
    icon: Lock,
    title: "Create your account",
    body: "Membership is free. It exists so we can hold your addresses, sizes and occasions, and reach you if a delivery needs a decision.",
  },
  {
    icon: Sparkles,
    title: "Shop the collection",
    body: "The full catalogue opens once you are in — flowers, jewelry, and the pieces we only make a handful of.",
  },
  {
    icon: PackageCheck,
    title: "Follow it to the door",
    body: "Book a courier for anything of your own too. Same network, same tracking, one account.",
  },
];

const NUMBERS = [
  { value: "48", label: "countries served" },
  { value: "99.2%", label: "on-time delivery" },
  { value: "24/7", label: "live tracking" },
  { value: "1.4M", label: "parcels a year" },
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-page pb-20 pt-16 lg:pb-28 lg:pt-24">
          <div className="mx-auto max-w-3xl text-center animate-fade-up">
            <Badge variant="accent" className="mb-6">
              <Sparkles /> Members' collection · now open
            </Badge>

            <h1 className="display text-display-xl">
              Flowers and fine things,
              <span className="block text-muted-foreground">for the moments that count.</span>
            </h1>

            <p className="lede mx-auto mt-6 max-w-xl">
              Xperience Delivery is a members' house for hand-tied flowers and fine jewelry —
              arranged the day they travel, insured across 48 countries, and tracked to the door.
            </p>

            <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
              <Button asChild size="lg" variant="accent">
                <Link href="/register">
                  Create your account <ArrowRight />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">I already have one</Link>
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Free to join · The collection opens the moment you are in
            </p>
          </div>

          {/* A three-photo collage: one tall, two stacked. */}
          <div className="mx-auto mt-14 grid max-w-5xl grid-cols-2 gap-4 sm:grid-cols-3">
            <div className="relative col-span-2 aspect-[4/5] overflow-hidden rounded-3xl border border-border bg-surface shadow-lift sm:col-span-1 sm:row-span-2 sm:aspect-auto">
              <Image
                src={MARKETING_IMAGES.heroPrimary}
                alt="A hand-tied seasonal bouquet"
                fill
                priority
                sizes="(max-width: 640px) 100vw, 33vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
              <Image
                src={MARKETING_IMAGES.heroSecondary}
                alt="Garden roses in soft pink"
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
            <div className="relative aspect-square overflow-hidden rounded-3xl border border-border bg-surface shadow-soft">
              <Image
                src={MARKETING_IMAGES.heroTertiary}
                alt="A fine gold necklace"
                fill
                sizes="(max-width: 640px) 50vw, 33vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
            <div className="relative col-span-2 aspect-[16/7] overflow-hidden rounded-3xl border border-border bg-surface shadow-soft sm:col-span-2 sm:aspect-[16/6]">
              <Image
                src={MARKETING_IMAGES.atelier}
                alt="Florists at work in the studio"
                fill
                sizes="(max-width: 640px) 100vw, 66vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-clay-950/70 via-clay-950/10 to-transparent" />
              <p className="absolute bottom-5 left-6 max-w-xs text-sm font-medium text-white">
                Cut, conditioned and tied the morning it travels.
              </p>
            </div>
          </div>

          {/* bento preview */}
          <div className="mx-auto mt-6 grid max-w-5xl gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="overflow-hidden sm:col-span-2 lg:col-span-2">
              <div className="flex h-full flex-col justify-between gap-6 p-7 sm:flex-row sm:items-end">
                <div>
                  <Flower2 className="size-6 text-accent" />
                  <p className="display mt-4 text-display-sm">The seasonal table</p>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Six arrangements, changed as the season turns. Peonies while they last, ranunculus
                    when they do not.
                  </p>
                </div>
                <div className="relative h-32 w-full shrink-0 overflow-hidden rounded-2xl sm:w-48">
                  <Image
                    src={MARKETING_IMAGES.seasonal}
                    alt="This season's arrangements"
                    fill
                    sizes="200px"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover"
                  />
                </div>
              </div>
            </Card>

            <Card className="overflow-hidden">
              <div className="relative aspect-[16/10]">
                <Image
                  src={MARKETING_IMAGES.jewelry}
                  alt="Gold and pearl necklaces"
                  fill
                  sizes="(max-width: 640px) 100vw, 33vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </div>
              <div className="p-7">
                <Gem className="size-6 text-accent" />
                <p className="display mt-4 text-display-sm">Fine jewelry</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Gold, pearl and certified stones — a small, considered list.
                </p>
              </div>
            </Card>

            <Card className="p-7">
              <Globe2 className="size-6 text-accent" />
              <p className="display mt-4 text-display-sm">48 countries</p>
              <p className="mt-2 text-sm text-muted-foreground">
                Insured door-to-door delivery, customs handled end to end.
              </p>
            </Card>

            <Card className="p-7 sm:col-span-2">
              <div className="flex flex-wrap items-center justify-between gap-6">
                <div>
                  <Truck className="size-6 text-accent" />
                  <p className="display mt-4 text-display-sm">Send your own parcels</p>
                  <p className="mt-2 max-w-sm text-sm text-muted-foreground">
                    Members can book couriers through Veloxa, our logistics arm — same tracking, one
                    account.
                  </p>
                </div>
                <span className="rounded-2xl bg-surface px-4 py-3 font-mono text-sm">
                  VLX-4K7M-2Q9R
                </span>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* ------------------------------ pillars ----------------------------- */}
      <section className="border-t border-border bg-surface">
        <div className="container-page py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">What we make</p>
            <h2 className="display mt-3 text-display-lg">Two things, done properly</h2>
            <p className="lede mt-4">
              We keep the list short on purpose. Everything here is something we would send to
              someone we love.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {PILLARS.map((p) => {
              const Icon = p.icon;
              return (
                <Card key={p.title} interactive className="p-7">
                  <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="display mt-5 text-lg">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------ our story --------------------------- */}
      <section className="border-t border-border">
        <div className="container-page py-20 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
            <div className="grid grid-cols-2 gap-4">
              <div className="relative aspect-[3/4] overflow-hidden rounded-3xl border border-border shadow-soft">
                <Image
                  src={MARKETING_IMAGES.aboutStudio}
                  alt="A florist conditioning stems by hand"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </div>
              <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-3xl border border-border shadow-soft">
                <Image
                  src={MARKETING_IMAGES.aboutBench}
                  alt="A goldsmith at the bench"
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </div>
            </div>

            <div>
              <p className="eyebrow">Our story</p>
              <h2 className="display mt-3 text-display-lg">
                From one rented room to two ateliers
              </h2>
              <p className="lede mt-4">
                We began in {FOUNDED} between a flower market and a goldsmith&apos;s bench — a florist
                and a jeweller filling orders for people who wanted both on the same day.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Seven years on we work from studios in New York and Zürich, ship to 48 countries, and
                run the delivery network ourselves so there is no leg of the journey we cannot answer
                for. What has not changed is the bit that matters: everything is made the morning it
                travels, by someone whose name we know.
              </p>

              <dl className="mt-8 grid grid-cols-3 gap-6 border-t border-border pt-6">
                <div>
                  <dt className="display text-display-sm">{FOUNDED}</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">founded</dd>
                </div>
                <div>
                  <dt className="display text-display-sm">2</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">ateliers</dd>
                </div>
                <div>
                  <dt className="display text-display-sm">48</dt>
                  <dd className="mt-1 text-xs text-muted-foreground">countries</dd>
                </div>
              </dl>

              <Button asChild variant="outline" className="mt-8">
                <Link href="/about">
                  Read our full story <ArrowRight />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ---------------------------- how it works -------------------------- */}
      <section className="border-t border-border">
        <div className="container-page py-20 lg:py-24">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-20">
            <div>
              <p className="eyebrow">How it works</p>
              <h2 className="display mt-3 text-display-lg">Why there is a door</h2>
              <p className="lede mt-4">
                The catalogue sits behind an account rather than in the open. It lets us hold your
                details, keep stock honest for people who actually shop, and reach you quickly when a
                delivery needs a decision.
              </p>
              <Button asChild size="lg" variant="accent" className="mt-8">
                <Link href="/register">
                  Join — it's free <ArrowRight />
                </Link>
              </Button>
            </div>

            <ol className="space-y-4">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <li key={s.title}>
                    <Card className="flex gap-5 p-6">
                      <div className="flex flex-col items-center">
                        <span className="grid size-10 shrink-0 place-items-center rounded-full bg-accent text-accent-foreground">
                          <Icon className="size-4" />
                        </span>
                        {i < STEPS.length - 1 && (
                          <span className="mt-2 w-px flex-1 bg-gradient-to-b from-border to-transparent" />
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-accent">Step {i + 1}</p>
                        <h3 className="display mt-1 text-lg">{s.title}</h3>
                        <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                          {s.body}
                        </p>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </section>

      {/* ------------------------------ numbers ----------------------------- */}
      <section className="border-t border-border bg-surface">
        <div className="container-page py-16">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {NUMBERS.map((n) => (
              <div key={n.label}>
                <dt className="display text-display-md">{n.value}</dt>
                <dd className="mt-1 text-sm text-muted-foreground">{n.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* -------------------------------- CTA ------------------------------- */}
      <section className="border-t border-border">
        <div className="container-page py-16 lg:py-20">
          <Card className="relative overflow-hidden border-none bg-primary text-primary-foreground">
            <div
              className="absolute -right-20 -top-20 size-72 rounded-full bg-accent/25 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-8 p-10 lg:p-14">
              <div className="max-w-lg">
                <BadgeCheck className="size-7 text-accent" />
                <h2 className="display mt-5 text-display-md">Ready when you are</h2>
                <p className="mt-3 text-sm leading-relaxed opacity-80">
                  Create an account and the full collection opens immediately — along with courier
                  booking, saved addresses and live tracking on everything you send.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                <Button asChild size="lg" variant="accent">
                  <Link href="/register">
                    Create account <ArrowRight />
                  </Link>
                </Button>
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="border-white/25 bg-transparent text-primary-foreground hover:bg-white/10"
                >
                  <Link href="/login">Sign in</Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
