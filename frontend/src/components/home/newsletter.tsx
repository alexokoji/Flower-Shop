"use client";

import { useState } from "react";

export function Newsletter() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    <section className="container-edge pb-20">
      <div className="rounded-3xl bg-ink-900 text-cream-50 py-14 px-6 lg:px-16 grid lg:grid-cols-2 gap-10 items-center">
        <div>
          <p className="eyebrow text-roseGold-200">The newsletter</p>
          <h2 className="display-serif text-4xl lg:text-5xl mt-2">
            Seasonal letters, soft as petals.
          </h2>
          <p className="mt-3 text-cream-50/80 max-w-md">
            Early access to new edits, curator notes, and quiet promotions. No noise.
          </p>
        </div>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            // wire to newsletter endpoint in a later phase
            if (email) setSent(true);
          }}
          className="flex flex-col sm:flex-row gap-3"
        >
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your@email.com"
            className="flex-1 rounded-full bg-cream-50/10 border border-cream-50/20 px-5 py-3 placeholder:text-cream-50/40 focus:outline-none focus:border-roseGold-300"
          />
          <button type="submit" className="btn-gold !bg-roseGold !text-cream-50 hover:!bg-roseGold-400">
            {sent ? "Welcome ✦" : "Subscribe"}
          </button>
        </form>
      </div>
    </section>
  );
}
