"use client";

const MESSAGES = [
  "Free worldwide shipping on orders over $250",
  "Hand-tied today · Insured delivery",
  "New season — Spring edit is here",
];

export function PromoBar() {
  return (
    <div className="bg-ink-900 text-cream-50 text-[11px] tracking-widest uppercase">
      <div className="container-edge h-9 flex items-center justify-center gap-8 overflow-hidden">
        {MESSAGES.map((m, i) => (
          <span
            key={i}
            className={i === 0 ? "block" : "hidden md:block"}
          >
            {m}
          </span>
        ))}
      </div>
    </div>
  );
}