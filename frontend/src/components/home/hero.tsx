"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import Link from "next/link";

const HERO_TILES = [
  { src: "/products/rose-red-2.jpg", alt: "Red roses bouquet" },
  { src: "/products/gold-chain-1.jpg", alt: "Gold chain necklace" },
  { src: "/products/peony-2.jpg", alt: "Pink peony arrangement" },
  { src: "/products/diamond-2.jpg", alt: "Diamond solitaire necklace" },
];

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 -z-10 bg-gradient-to-br from-cream-50 via-cream-100 to-softPink-50 dark:from-background dark:via-card dark:to-card" />
      <div
        className="absolute inset-0 -z-10 opacity-40 mix-blend-multiply"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 20%, hsl(var(--rose-gold)/0.25), transparent 40%), radial-gradient(circle at 80% 60%, hsl(var(--gold)/0.18), transparent 45%)",
        }}
      />
      <div className="container-edge py-20 lg:py-32 grid lg:grid-cols-2 gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="space-y-6"
        >
          <div className="eyebrow">A new season in bloom</div>
          <h1 className="display-serif text-5xl md:text-6xl lg:text-7xl leading-[1.05]">
            Flowers that <em className="text-roseGold not-italic">whisper</em>,<br />
            jewelry that <em className="text-roseGold not-italic">remembers</em>.
          </h1>
          <p className="text-muted-foreground max-w-md text-lg">
            Hand-tied arrangements and fine necklaces, designed for the moments that ask
            for more than ordinary. Insured delivery worldwide.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/shop?type=flower" className="btn-gold">Shop flowers</Link>
            <Link href="/shop?type=necklace" className="btn-outline-gold">Shop necklaces</Link>
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="relative h-[400px] md:h-[520px]"
        >
          <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-roseGold-100 via-softPink-100 to-cream-200 shadow-luxe overflow-hidden">
            <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4">
              {HERO_TILES.map((tile, i) => (
                <div
                  key={tile.src}
                  className="relative rounded-2xl overflow-hidden animate-fade-up"
                  style={{ animationDelay: `${i * 120}ms` }}
                >
                  <Image
                    src={tile.src}
                    alt={tile.alt}
                    fill
                    sizes="(max-width: 768px) 50vw, 25vw"
                    className="object-cover"
                    priority={i < 2}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className="absolute -bottom-6 -left-6 surface-luxe px-5 py-4 hidden md:block">
            <div className="eyebrow">Free worldwide</div>
            <div className="text-sm">on orders over $250</div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}