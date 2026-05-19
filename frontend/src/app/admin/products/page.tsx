"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Pencil, Trash2, Copy } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pb";
import { productImage } from "@/lib/product-image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@/types";

export default function AdminProductsPage() {
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const [type, setType] = useState<"" | "flower" | "necklace">("");
  const [status, setStatus] = useState<string>("");

  const filterParts: string[] = [];
  if (q) filterParts.push(`(name ~ "${q.replace(/"/g, '\\"')}" || sku ~ "${q.replace(/"/g, '\\"')}")`);
  if (type) filterParts.push(`type = "${type}"`);
  if (status) filterParts.push(`status = "${status}"`);
  const filter = filterParts.join(" && ");

  const list = useQuery({
    queryKey: ["admin", "products", page, q, type, status],
    queryFn: () => pb().collection("products").getList<Product>(page, 20, {
      filter,
      sort: "-created",
      expand: "category",
    }),
  });

  const del = useMutation({
    mutationFn: (id: string) => pb().collection("products").delete(id),
    onSuccess: () => { toast.success("Product deleted."); qc.invalidateQueries({ queryKey: ["admin", "products"] }); },
    onError: () => toast.error("Delete failed."),
  });

  const duplicate = useMutation({
    mutationFn: async (p: Product) => {
      const copy = {
        category: p.category,
        type: p.type,
        name: p.name + " (copy)",
        slug: p.slug + "-copy-" + Math.random().toString(36).slice(2, 6),
        sku: p.sku + "-" + Math.random().toString(36).slice(2, 6).toUpperCase(),
        short_description: p.short_description,
        description: p.description,
        currency: p.currency,
        price: p.price,
        sale_price: p.sale_price,
        stock_quantity: p.stock_quantity,
        low_stock_threshold: p.low_stock_threshold,
        status: "draft" as const,
        is_featured: false,
        is_best_seller: false,
        attributes: p.attributes,
        image_urls: p.image_urls,
        weight_g: p.weight_g,
        ships_internationally: p.ships_internationally,
        restricted_countries: p.restricted_countries,
        delivery_estimate: p.delivery_estimate,
        meta_title: p.meta_title,
        meta_description: p.meta_description,
        meta_keywords: p.meta_keywords,
      };
      return pb().collection("products").create(copy);
    },
    onSuccess: () => { toast.success("Duplicated as draft."); qc.invalidateQueries({ queryKey: ["admin", "products"] }); },
    onError: () => toast.error("Duplicate failed."),
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="display-serif text-3xl lg:text-4xl mt-2">Products</h1>
        </div>
        <Link href="/admin/products/new">
          <Button variant="gold"><Plus className="size-4" /> New product</Button>
        </Link>
      </header>

      <div className="surface-luxe p-3 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder="Search name or SKU…"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>
        <select
          value={type}
          onChange={(e) => { setType(e.target.value as "" | "flower" | "necklace"); setPage(1); }}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">All types</option>
          <option value="flower">Flowers</option>
          <option value="necklace">Necklaces</option>
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          <option value="">All statuses</option>
          <option value="in_stock">In stock</option>
          <option value="out_of_stock">Out of stock</option>
          <option value="preorder">Preorder</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      <section className="surface-luxe overflow-hidden">
        {list.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (list.data?.totalItems ?? 0) === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">No products match these filters.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground bg-cream-100/40 dark:bg-card/40">
              <tr className="text-left">
                <th className="p-3"></th>
                <th>Name</th>
                <th>SKU</th>
                <th>Type</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data?.items.map((p) => {
                const img = productImage(p, 0, "100x100");
                return (
                  <tr key={p.id} className="hover:bg-muted/40">
                    <td className="p-3">
                      <div className="relative size-12 rounded-md overflow-hidden bg-cream-100">
                        {img ? (
                          <Image src={img} alt={p.name} fill sizes="48px" className="object-cover" />
                        ) : (
                          <div className="absolute inset-0 bg-gradient-to-br from-cream-200 to-roseGold-100" />
                        )}
                      </div>
                    </td>
                    <td>
                      <Link href={`/admin/products/${p.id}`} className="font-medium hover:text-roseGold">
                        {p.name}
                      </Link>
                    </td>
                    <td className="text-xs text-muted-foreground">{p.sku}</td>
                    <td className="text-xs capitalize text-muted-foreground">{p.type}</td>
                    <td>
                      {p.sale_price > 0 ? (
                        <span>
                          {formatPrice(p.sale_price, p.currency)}
                          <span className="ml-1 text-xs price-strike">{formatPrice(p.price, p.currency)}</span>
                        </span>
                      ) : (
                        formatPrice(p.price, p.currency)
                      )}
                    </td>
                    <td className="text-xs">
                      <span className={p.stock_quantity <= p.low_stock_threshold ? "text-destructive" : ""}>
                        {p.stock_quantity}
                      </span>
                    </td>
                    <td>
                      <span className="text-[10px] uppercase tracking-widest px-2 py-1 rounded-full bg-muted">
                        {p.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <Link href={`/admin/products/${p.id}`} className="inline-block p-1.5 rounded hover:bg-muted" aria-label="Edit">
                        <Pencil className="size-4" />
                      </Link>
                      <button
                        onClick={() => duplicate.mutate(p)}
                        className="inline-block p-1.5 rounded hover:bg-muted"
                        aria-label="Duplicate"
                      >
                        <Copy className="size-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${p.name}"?`)) del.mutate(p.id); }}
                        className="inline-block p-1.5 rounded hover:bg-muted text-destructive"
                        aria-label="Delete"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </section>

      {list.data && list.data.totalPages > 1 && (
        <div className="flex items-center justify-between text-sm">
          <p className="text-muted-foreground">
            Page {list.data.page} of {list.data.totalPages} · {list.data.totalItems} total
          </p>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={page >= list.data.totalPages} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}