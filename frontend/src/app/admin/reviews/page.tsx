"use client";

import Link from "next/link";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, X, Trash2, Star } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import type { PbRecord, Product, User } from "@/types";

interface Review extends PbRecord {
  product: string;
  user: string;
  order: string;
  rating: number;
  title: string;
  body: string;
  status: "pending" | "approved" | "rejected";
  approved_at: string | null;
  expand?: { product?: Product; user?: User };
}

export default function AdminReviewsPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"" | "pending" | "approved" | "rejected">("pending");

  const list = useQuery({
    queryKey: ["admin", "reviews", filter],
    queryFn: () => pb().collection("reviews").getFullList<Review>({
      filter: filter ? `status = "${filter}"` : "",
      sort: "-created",
      expand: "product,user",
    }),
  });

  const update = useMutation({
    mutationFn: ({ id, status }: { id: string; status: Review["status"] }) =>
      pb().collection("reviews").update(id, {
        status,
        approved_at: status === "approved" ? new Date().toISOString() : null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) => pb().collection("reviews").delete(id),
    onSuccess: () => {
      toast.success("Review deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "reviews"] });
    },
    onError: () => toast.error("Delete failed."),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Moderation</p>
          <h1 className="display text-display-sm lg:text-4xl mt-2">Reviews</h1>
        </div>
        <div className="flex gap-1 rounded-full bg-muted p-1">
          {(["pending", "approved", "rejected", ""] as const).map((s) => (
            <button
              key={s || "all"}
              onClick={() => setFilter(s)}
              className={
                "px-4 py-1.5 text-xs uppercase tracking-widest rounded-full transition-colors " +
                (filter === s ? "bg-background shadow-sm" : "hover:text-accent")
              }
            >
              {s || "All"}
            </button>
          ))}
        </div>
      </header>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (list.data?.length ?? 0) === 0 ? (
        <div className="rounded-2xl border border-border bg-card shadow-soft p-12 text-center">
          <p className="display text-lg">Nothing to moderate</p>
          <p className="text-sm text-muted-foreground mt-1">
            {filter === "pending" ? "No reviews waiting for approval." : "No reviews match this filter."}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {list.data?.map((r) => {
            const author = r.expand?.user
              ? `${r.expand.user.first_name ?? ""} ${r.expand.user.last_name ?? ""}`.trim()
              : "Anonymous";
            return (
              <li key={r.id} className="rounded-2xl border border-border bg-card shadow-soft p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Stars value={r.rating} />
                      <span className="text-sm font-medium">{author}</span>
                      <span className="text-xs text-muted-foreground">
                        · {new Date(r.created).toLocaleDateString()}
                      </span>
                      <span className={
                        "text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full ml-auto sm:ml-2 " +
                        (r.status === "approved" ? "bg-success/12 text-success"
                          : r.status === "rejected" ? "bg-destructive/10 text-destructive"
                          : "bg-muted text-foreground")
                      }>
                        {r.status}
                      </span>
                    </div>
                    {r.title && <p className="display text-lg mt-2">{r.title}</p>}
                    {r.body && <p className="text-sm text-muted-foreground mt-1 leading-relaxed whitespace-pre-line">{r.body}</p>}
                    {r.expand?.product && (
                      <Link
                        href={`/admin/products/${r.expand.product.id}`}
                        className="text-xs text-accent hover:underline mt-2 inline-block"
                      >
                        on {r.expand.product.name} →
                      </Link>
                    )}
                  </div>
                </div>
                <div className="mt-4 flex gap-2">
                  {r.status !== "approved" && (
                    <Button
                      size="sm"
                      variant="gold"
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: r.id, status: "approved" })}
                    >
                      <Check className="size-4" /> Approve
                    </Button>
                  )}
                  {r.status !== "rejected" && (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={update.isPending}
                      onClick={() => update.mutate({ id: r.id, status: "rejected" })}
                    >
                      <X className="size-4" /> Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-destructive ml-auto"
                    onClick={() => { if (confirm("Delete this review permanently?")) del.mutate(r.id); }}
                  >
                    <Trash2 className="size-4" /> Delete
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Stars({ value }: { value: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${value} out of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={"size-4 " + (n <= value ? "fill-gold text-gold-500" : "text-muted-foreground/40")} />
      ))}
    </div>
  );
}