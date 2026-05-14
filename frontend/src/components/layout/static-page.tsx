import { ReactNode } from "react";

export function StaticPage({
  eyebrow, title, lead, children,
}: { eyebrow?: string; title: string; lead?: string; children?: ReactNode }) {
  return (
    <div className="container-edge py-16 lg:py-24 max-w-3xl">
      {eyebrow && <p className="eyebrow">{eyebrow}</p>}
      <h1 className="display-serif text-4xl lg:text-5xl mt-2">{title}</h1>
      {lead && <p className="text-muted-foreground mt-4 text-lg leading-relaxed">{lead}</p>}
      <div className="prose prose-stone dark:prose-invert max-w-none mt-10 space-y-6">
        {children}
      </div>
    </div>
  );
}