import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * The mark: a petal quartet that reads equally as a flower and a gift box seen
 * from above — the two halves of the catalogue in one glyph.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" className={cn("size-8", className)} aria-hidden="true">
      <defs>
        <linearGradient id="xd-mark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="hsl(2 78% 70%)" />
          <stop offset="100%" stopColor="hsl(2 68% 56%)" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#xd-mark)" />
      <g fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round">
        <path d="M16 8.5c2.6 0 4.2 1.7 4.2 3.8S18.6 16 16 16s-4.2-1.6-4.2-3.7S13.4 8.5 16 8.5Z" />
        <path d="M16 23.5c-2.6 0-4.2-1.7-4.2-3.8S13.4 16 16 16s4.2 1.6 4.2 3.7-1.6 3.8-4.2 3.8Z" />
      </g>
      <circle cx="16" cy="16" r="1.7" fill="white" />
    </svg>
  );
}

export function Brand({
  compact,
  className,
  href = "/",
}: {
  compact?: boolean;
  className?: string;
  href?: string;
}) {
  return (
    <Link
      href={href}
      className={cn("group flex items-center gap-2.5", className)}
      aria-label="Xperience Delivery"
    >
      <BrandMark className={compact ? "size-7" : "size-8"} />
      {!compact && (
        <span className="display text-[0.9375rem] leading-none tracking-tight">
          Xperience
          <span className="block text-[0.625rem] font-medium uppercase tracking-[0.18em] text-muted-foreground">
            Delivery
          </span>
        </span>
      )}
    </Link>
  );
}
