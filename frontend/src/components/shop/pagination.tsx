"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight } from "lucide-react";

export function Pagination({ page, totalPages }: { page: number; totalPages: number }) {
  const router = useRouter();
  const params = useSearchParams();

  if (totalPages <= 1) return null;

  function go(p: number) {
    const next = new URLSearchParams(Array.from(params.entries()));
    if (p <= 1) next.delete("page");
    else next.set("page", String(p));
    router.push(`?${next.toString()}`);
  }

  const window = 5;
  const start = Math.max(1, Math.min(page - 2, totalPages - window + 1));
  const end = Math.min(totalPages, start + window - 1);
  const pages: number[] = [];
  for (let i = start; i <= end; i++) pages.push(i);

  return (
    <nav className="flex items-center justify-center gap-1 pt-8" aria-label="Pagination">
      <button
        onClick={() => go(page - 1)} disabled={page <= 1}
        className="p-2 rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Previous"
      >
        <ChevronLeft className="size-4" />
      </button>
      {start > 1 && (
        <>
          <button onClick={() => go(1)} className="size-9 grid place-items-center rounded-md hover:bg-muted text-sm">1</button>
          {start > 2 && <span className="text-muted-foreground">…</span>}
        </>
      )}
      {pages.map((p) => (
        <button
          key={p} onClick={() => go(p)}
          aria-current={p === page ? "page" : undefined}
          className={
            "size-9 grid place-items-center rounded-md text-sm " +
            (p === page ? "bg-ink-900 text-cream-50" : "hover:bg-muted")
          }
        >{p}</button>
      ))}
      {end < totalPages && (
        <>
          {end < totalPages - 1 && <span className="text-muted-foreground">…</span>}
          <button onClick={() => go(totalPages)} className="size-9 grid place-items-center rounded-md hover:bg-muted text-sm">
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => go(page + 1)} disabled={page >= totalPages}
        className="p-2 rounded-md hover:bg-muted disabled:opacity-40 disabled:hover:bg-transparent"
        aria-label="Next"
      >
        <ChevronRight className="size-4" />
      </button>
    </nav>
  );
}