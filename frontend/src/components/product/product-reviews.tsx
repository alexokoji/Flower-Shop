"use client";

import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { pb } from "@/lib/pb";
import type { PbList } from "@/types";

interface Review {
  id: string;
  rating: number;
  title: string;
  body: string;
  created: string;
  expand?: { user?: { first_name: string; last_name: string } };
}

export function ProductReviews({ productId, ratingAvg, ratingCount }: { productId: string; ratingAvg: number; ratingCount: number }) {
  const { data, isLoading } = useQuery({
    queryKey: ["reviews", productId],
    queryFn: () =>
      pb().collection("reviews").getList<Review>(1, 10, {
        filter: `product = "${productId}" && status = "approved"`,
        sort: "-created",
        expand: "user",
      }),
  });

  return (
    <section className="surface-luxe p-6 lg:p-8">
      <header className="flex flex-wrap items-center justify-between gap-2 mb-6">
        <div>
          <h2 className="display-serif text-2xl">Reviews</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {ratingCount > 0
              ? `${ratingAvg.toFixed(1)} / 5 from ${ratingCount} review${ratingCount === 1 ? "" : "s"}`
              : "Be the first to share how it arrived."}
          </p>
        </div>
        <Stars value={Math.round(ratingAvg)} />
      </header>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : data && data.items.length > 0 ? (
        <ul className="space-y-6">
          {data.items.map((r) => (
            <li key={r.id} className="border-t border-border pt-5">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <Stars value={r.rating} />
                  <span className="text-sm">
                    {r.expand?.user?.first_name ?? "Customer"}
                  </span>
                </div>
                <time className="text-xs text-muted-foreground" dateTime={r.created}>
                  {new Date(r.created).toLocaleDateString()}
                </time>
              </div>
              {r.title && <p className="display-serif text-lg mt-2">{r.title}</p>}
              {r.body && <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{r.body}</p>}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">No reviews yet.</p>
      )}
    </section>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={"size-4 " + (n <= value ? "fill-gold text-gold-500" : "text-muted-foreground/40")}
        />
      ))}
    </div>
  );
}