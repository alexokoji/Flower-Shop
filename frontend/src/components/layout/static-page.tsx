import { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Template behind the twelve editorial and legal pages.
 *
 * Prose styling is written out rather than pulled from @tailwindcss/typography
 * (not installed) so headings, lists and links land on the same tokens as the
 * rest of the system instead of Tailwind's stone defaults.
 */
export function StaticPage({
  eyebrow,
  title,
  lead,
  children,
  wide,
}: {
  eyebrow?: string;
  title: string;
  lead?: string;
  children?: ReactNode;
  /** Opt into a wider measure for pages that lay out cards rather than text. */
  wide?: boolean;
}) {
  return (
    <article className={cn("py-14 lg:py-20", wide ? "container-page" : "container-prose")}>
      <header className="animate-fade-up">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1 className="display mt-2.5 text-display-lg">{title}</h1>
        {lead && <p className="lede mt-5 max-w-2xl">{lead}</p>}
      </header>

      <div className="mt-10 h-px w-full bg-gradient-to-r from-border via-border to-transparent" />

      <div
        className={cn(
          "mt-10 text-[0.9375rem] leading-relaxed text-muted-foreground",
          // Headings
          "[&_h2]:display [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:text-display-sm [&_h2]:text-foreground",
          "[&_h2:first-child]:mt-0",
          "[&_h3]:display [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-lg [&_h3]:text-foreground",
          // Body
          "[&_p]:mb-5",
          "[&_strong]:font-semibold [&_strong]:text-foreground",
          // Lists — custom coral markers rather than default discs
          "[&_ul]:mb-6 [&_ul]:space-y-2.5 [&_ol]:mb-6 [&_ol]:space-y-2.5",
          "[&_li]:relative [&_li]:pl-6",
          "[&_ul>li]:before:absolute [&_ul>li]:before:left-1.5 [&_ul>li]:before:top-[0.6em]",
          "[&_ul>li]:before:size-1.5 [&_ul>li]:before:rounded-full [&_ul>li]:before:bg-accent",
          "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol>li]:pl-1 [&_ol>li]:marker:text-accent",
          // Links
          "[&_a]:font-medium [&_a]:text-accent [&_a]:underline [&_a]:underline-offset-4",
          "[&_a:hover]:text-accent/80",
          // Blocks
          "[&_blockquote]:my-6 [&_blockquote]:rounded-xl [&_blockquote]:border-l-2",
          "[&_blockquote]:border-accent [&_blockquote]:bg-surface [&_blockquote]:px-5 [&_blockquote]:py-4",
          "[&_blockquote]:text-foreground",
          "[&_hr]:my-10 [&_hr]:border-border",
          "[&_code]:rounded [&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-[0.85em]",
          "[&_table]:mb-6 [&_table]:w-full [&_table]:text-sm",
          "[&_th]:border-b [&_th]:border-border [&_th]:pb-2 [&_th]:text-left [&_th]:font-medium [&_th]:text-foreground",
          "[&_td]:border-b [&_td]:border-border [&_td]:py-2.5"
        )}
      >
        {children}
      </div>
    </article>
  );
}
