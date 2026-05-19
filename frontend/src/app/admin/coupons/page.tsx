"use client";

import { ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";

const TITLE = "Coupons";
const DESCRIPTION = "Create promo codes -- fixed amount or percentage, with usage caps and date windows.";

export default function Page() {
  const pbUrl = process.env.NEXT_PUBLIC_PB_URL ?? "http://localhost:8090";
  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <p className="eyebrow">Admin</p>
        <h1 className="display-serif text-3xl lg:text-4xl mt-2">{TITLE}</h1>
      </header>
      <section className="surface-luxe p-8 space-y-4">
        <p className="text-sm text-muted-foreground">{DESCRIPTION}</p>
        <p className="text-xs text-muted-foreground">
          A native panel for this section is on the roadmap. For now, the PocketBase
          admin UI gives you full CRUD with the same role-gated access rules.
        </p>
        <a href={`${pbUrl}/_/`} target="_blank" rel="noreferrer" className="inline-block">
          <Button variant="gold">
            <ExternalLink className="size-4" /> Open in PocketBase
          </Button>
        </a>
      </section>
    </div>
  );
}