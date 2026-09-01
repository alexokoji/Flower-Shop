import Link from "next/link";

/**
 * The Veloxa mark: a chevron cut from a circle, reading as both a play button
 * and a parcel corner — motion and cargo in one glyph.
 */
export function VeloxaMark({ className = "size-9" }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <defs>
        <linearGradient id="veloxa-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#22D3EE" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="19" fill="url(#veloxa-mark)" />
      <path d="M13 11 L27 20 L13 29 Z" fill="#060B18" />
      <path d="M6 20 H13" stroke="#060B18" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function VeloxaLogo({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5 group" aria-label="Veloxa Logistics home">
      <VeloxaMark className={compact ? "size-7" : "size-9"} />
      <span className="leading-none">
        <span
          className={`display block text-white tracking-[0.18em] ${compact ? "text-base" : "text-xl"}`}
        >
          VELOXA
        </span>
        {!compact && (
          <span className="block text-[9px] uppercase tracking-[0.3em] text-mist-400 mt-1">
            Logistics
          </span>
        )}
      </span>
    </Link>
  );
}
