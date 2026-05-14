"use client";

import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote: "Every bouquet feels like a small piece of art arriving at the door.",
    name: "Amelia W.",
    role: "Returning customer · London",
  },
  {
    quote: "The pendant arrived in a velvet case and felt like a true heirloom.",
    name: "Bisi A.",
    role: "Verified buyer · Lagos",
  },
  {
    quote: "Same-day flowers for my mother's birthday — wrapped beautifully.",
    name: "Daniela R.",
    role: "Customer · New York",
  },
];

export function Testimonials() {
  return (
    <section className="container-edge py-16 lg:py-24">
      <header className="text-center mb-12">
        <p className="eyebrow">In their words</p>
        <h2 className="display-serif text-4xl lg:text-5xl mt-2">Loved by collectors and brides alike</h2>
      </header>
      <div className="grid md:grid-cols-3 gap-6">
        {TESTIMONIALS.map((t, i) => (
          <motion.figure
            key={t.name}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="surface-luxe p-8"
          >
            <blockquote className="display-serif text-2xl leading-snug">"{t.quote}"</blockquote>
            <figcaption className="mt-6 text-sm text-muted-foreground">
              — {t.name}, <span className="italic">{t.role}</span>
            </figcaption>
          </motion.figure>
        ))}
      </div>
    </section>
  );
}
