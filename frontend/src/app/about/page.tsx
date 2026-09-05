import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Flower2, Gem, Globe2, HeartHandshake, Leaf, Scissors, ShieldCheck, Truck,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/primitives";
import { MARKETING_IMAGES, BLUR_DATA_URL } from "@/lib/marketing-images";
import { OFFICES, CONTACT, FOUNDED } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "About us",
  description:
    "How Xperience Delivery grew from one studio bench into a members' house for flowers and fine jewelry, shipping to 48 countries from New York and Zürich.",
};

/** The journey, told as dated milestones rather than adjectives. */
const MILESTONES = [
  {
    year: "2019",
    title: "One bench, two trades",
    body: "We started between a flower market and a goldsmith's bench — a florist and a jeweller sharing a rented room, filling orders for people who wanted both on the same day.",
  },
  {
    year: "2020",
    title: "The first hundred orders",
    body: "Deliveries were made in person, most of them by us. The habit stuck: we still photograph every arrangement before it leaves.",
  },
  {
    year: "2021",
    title: "New York opens",
    body: "A permanent studio near the Flower District, and the first artisans to join us. Same-day delivery across the five boroughs began that spring.",
  },
  {
    year: "2023",
    title: "Zürich, and Europe",
    body: "Our second atelier opened on Bahnhofstrasse, putting a goldsmith's bench inside the European market and cutting continental transit to two days.",
  },
  {
    year: "2024",
    title: "Tracking, in the open",
    body: "We built our own logistics arm, Veloxa, because handing parcels to carriers who could not tell us where they were had become the only part of the job we could not answer for.",
  },
  {
    year: "2026",
    title: "A members' house",
    body: "The collection moved behind an account so we can hold your occasions, reach you when a delivery needs a decision, and keep stock honest for people who actually shop.",
  },
];

const NUMBERS = [
  { value: "48", label: "countries served" },
  { value: "2", label: "ateliers, New York and Zürich" },
  { value: "99.2%", label: "delivered on time, last 12 months" },
  { value: `${new Date().getFullYear() - FOUNDED}`, label: "years, and counting" },
];

const VALUES = [
  {
    icon: Scissors,
    title: "Made, not bought in",
    body: "Every bouquet is hand-tied the morning it travels and every piece is finished by an artisan we know by name. We do not drop-ship the parts that matter.",
  },
  {
    icon: ShieldCheck,
    title: "Answerable for the journey",
    body: "We run our own delivery network so there is never a stretch of the trip we cannot explain. Every parcel carries a tracking number anyone can open.",
  },
  {
    icon: HeartHandshake,
    title: "One person owns your order",
    body: "No queue, no handing you between departments. If something goes wrong, the person who replies is the person who can fix it.",
  },
  {
    icon: Leaf,
    title: "Lighter as we grow",
    body: "Seasonal stems over air-freighted ones, recycled and recyclable packaging, and an electric fleet for city deliveries in both our home cities.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* ------------------------------- hero ------------------------------- */}
      <section className="relative overflow-hidden">
        <div className="aurora absolute inset-0 -z-10" aria-hidden="true" />
        <div className="container-page pb-16 pt-16 lg:pb-20 lg:pt-24">
          <div className="max-w-3xl animate-fade-up">
            <Badge variant="accent" className="mb-6">
              Since {FOUNDED}
            </Badge>
            <h1 className="display text-display-xl">
              A workshop, two ateliers,
              <span className="block text-muted-foreground">one feeling.</span>
            </h1>
            <p className="lede mt-6 max-w-2xl">
              Xperience Delivery began in a rented room between a flower market and a goldsmith&apos;s
              bench. Seven years later we ship to 48 countries from New York and Zürich — and we still
              photograph every arrangement before it leaves.
            </p>
          </div>

          <div className="relative mt-12 aspect-[16/7] overflow-hidden rounded-3xl border border-border shadow-lift">
            <Image
              src={MARKETING_IMAGES.aboutHero}
              alt="Early morning at the flower market"
              fill
              priority
              sizes="100vw"
              placeholder="blur"
              blurDataURL={BLUR_DATA_URL}
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-clay-950/65 via-clay-950/10 to-transparent" />
            <p className="absolute bottom-6 left-6 max-w-md text-sm font-medium text-white sm:text-base">
              The market at 5am. Everything we send that day is chosen here first.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------ numbers ----------------------------- */}
      <section className="border-t border-border bg-surface">
        <div className="container-page py-14">
          <dl className="grid grid-cols-2 gap-8 lg:grid-cols-4">
            {NUMBERS.map((n) => (
              <div key={n.label}>
                <dt className="display text-display-md">{n.value}</dt>
                <dd className="mt-1 text-sm leading-snug text-muted-foreground">{n.label}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ------------------------------ journey ----------------------------- */}
      <section className="border-t border-border">
        <div className="container-page py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Our journey</p>
            <h2 className="display mt-3 text-display-lg">How far we&apos;ve come</h2>
            <p className="lede mt-4">
              We have grown slowly and on purpose. Each of these was a decision to do more of the work
              ourselves rather than less.
            </p>
          </div>

          <ol className="mt-14 grid gap-x-10 gap-y-2 lg:grid-cols-2">
            {MILESTONES.map((m, i) => (
              <li key={m.year} className="relative flex gap-6 pb-10 last:pb-0">
                {/* Connector, hidden on the final item of each column. */}
                <div className="flex flex-col items-center">
                  <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-accent/10 text-sm font-semibold text-accent">
                    {m.year}
                  </span>
                  {i < MILESTONES.length - 1 && (
                    <span className="mt-2 w-px flex-1 bg-gradient-to-b from-border to-transparent" />
                  )}
                </div>
                <div className="pt-1.5">
                  <h3 className="display text-lg">{m.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{m.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ------------------------------ the work ---------------------------- */}
      <section className="border-t border-border bg-surface">
        <div className="container-page py-20 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-soft">
              <Image
                src={MARKETING_IMAGES.aboutStudio}
                alt="A florist conditioning stems by hand"
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                placeholder="blur"
                blurDataURL={BLUR_DATA_URL}
                className="object-cover"
              />
            </div>
            <div>
              <Flower2 className="size-7 text-accent" />
              <h2 className="display mt-5 text-display-md">The flowers</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Stems are bought at market the morning they travel, conditioned for a few hours, then
                tied to order. Nothing sits in a cold room waiting for a buyer. It means the list
                changes with the season — peonies while they last, ranunculus when they do not — and it
                means what arrives is days fresher than a warehouse can manage.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Every arrangement is photographed before it is boxed. If it is not something we would
                be proud to hand over ourselves, it does not leave.
              </p>
            </div>
          </div>

          <div className="mt-16 grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <div className="lg:order-2">
              <div className="relative aspect-[4/5] overflow-hidden rounded-3xl border border-border shadow-soft">
                <Image
                  src={MARKETING_IMAGES.aboutBench}
                  alt="A goldsmith at the bench"
                  fill
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  placeholder="blur"
                  blurDataURL={BLUR_DATA_URL}
                  className="object-cover"
                />
              </div>
            </div>
            <div className="lg:order-1">
              <Gem className="size-7 text-accent" />
              <h2 className="display mt-5 text-display-md">The jewelry</h2>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Solid gold, freshwater pearl and certified stones, finished by three artisans we have
                worked with for years. The list stays deliberately short: we would rather make a few
                things properly than carry a catalogue we cannot vouch for.
              </p>
              <p className="mt-4 leading-relaxed text-muted-foreground">
                Pieces are made to outlast the occasion that prompted them — and we service anything we
                have sold, for as long as we are trading.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------- values ----------------------------- */}
      <section className="border-t border-border">
        <div className="container-page py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">What we hold to</p>
            <h2 className="display mt-3 text-display-lg">Four things we don&apos;t bend on</h2>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map((v) => {
              const Icon = v.icon;
              return (
                <Card key={v.title} interactive className="p-6">
                  <span className="grid size-11 place-items-center rounded-2xl bg-accent/10 text-accent">
                    <Icon className="size-5" />
                  </span>
                  <h3 className="display mt-5 text-base">{v.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{v.body}</p>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* ------------------------------- offices ---------------------------- */}
      <section className="border-t border-border bg-surface">
        <div className="container-page py-20 lg:py-24">
          <div className="max-w-2xl">
            <p className="eyebrow">Where we are</p>
            <h2 className="display mt-3 text-display-lg">Two ateliers, one standard</h2>
            <p className="lede mt-4">
              Each city has its own studio and its own bench, so an order is made close to the person
              receiving it rather than flown halfway around the world first.
            </p>
          </div>

          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {OFFICES.map((o, i) => (
              <Card key={o.id} className="overflow-hidden">
                <div className="relative aspect-[16/9]">
                  <Image
                    src={i === 0 ? MARKETING_IMAGES.aboutNewYork : MARKETING_IMAGES.aboutZurich}
                    alt={`${o.label}, ${o.country}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    placeholder="blur"
                    blurDataURL={BLUR_DATA_URL}
                    className="object-cover"
                  />
                </div>
                <div className="p-7">
                  <p className="flex items-center gap-2 text-sm font-medium">
                    <span aria-hidden="true">{o.flag}</span>
                    {o.label}
                    <span className="font-normal text-muted-foreground">· {o.country}</span>
                  </p>
                  <address className="mt-3 text-sm not-italic leading-relaxed text-muted-foreground">
                    {o.lines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}
                  </address>
                  <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-sm">
                    <a href={`tel:${o.phoneHref}`} className="font-medium text-accent hover:underline">
                      {o.phone}
                    </a>
                    <span className="text-xs text-muted-foreground">
                      {o.hours} {o.timezone}
                    </span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* --------------------------------- CTA ------------------------------ */}
      <section className="border-t border-border">
        <div className="container-page py-16 lg:py-20">
          <Card className="relative overflow-hidden border-none bg-primary text-primary-foreground">
            <div
              className="absolute -right-24 -top-24 size-80 rounded-full bg-accent/25 blur-3xl"
              aria-hidden="true"
            />
            <div className="relative flex flex-wrap items-center justify-between gap-8 p-10 lg:p-14">
              <div className="max-w-lg">
                <Globe2 className="size-7 text-accent" />
                <h2 className="display mt-5 text-display-md">Come and see</h2>
                <p className="mt-3 text-sm leading-relaxed opacity-80">
                  The collection opens with a free account. Or write to us at{" "}
                  <a href={`mailto:${CONTACT.general}`} className="underline underline-offset-4">
                    {CONTACT.general}
                  </a>{" "}
                  — a person reads it.
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
                  <Link href="/contact">
                    <Truck className="size-4" /> Contact us
                  </Link>
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </>
  );
}
