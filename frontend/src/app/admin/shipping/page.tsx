"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pb";
import { COUNTRIES } from "@/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { extractError } from "@/lib/errors";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { formatPrice } from "@/lib/utils";
import type { ShippingRate } from "@/types";

interface FormState {
  id: string | null;
  country_iso2: string;
  method: "standard" | "express";
  currency: string;
  base_fee: number;
  per_kg_fee: number;
  min_fee: number;
  max_fee: number;
  free_threshold: number;
  delivery_days: string;
  is_active: boolean;
}

const empty: FormState = {
  id: null, country_iso2: "US", method: "standard", currency: "USD",
  base_fee: 0, per_kg_fee: 0, min_fee: 0, max_fee: 0,
  free_threshold: 0, delivery_days: "5-7", is_active: true,
};

export default function AdminShippingPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [err, setErr] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  const list = useQuery({
    queryKey: ["admin", "shipping"],
    queryFn: () => pb().collection("shipping_rates").getFullList<ShippingRate>({
      sort: "country_iso2,method",
    }),
  });

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        country_iso2: f.country_iso2.toUpperCase(),
        method: f.method,
        currency: f.currency.toUpperCase(),
        base_fee: f.base_fee,
        per_kg_fee: f.per_kg_fee,
        min_fee: f.min_fee || null,
        max_fee: f.max_fee || null,
        free_threshold: f.free_threshold || null,
        delivery_days: f.delivery_days,
        is_active: f.is_active,
      };
      return f.id
        ? pb().collection("shipping_rates").update(f.id, payload)
        : pb().collection("shipping_rates").create(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Rate updated." : "Rate created.");
      qc.invalidateQueries({ queryKey: ["admin", "shipping"] });
      setOpen(false);
    },
    onError: (e) => setErr(extractError(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => pb().collection("shipping_rates").delete(id),
    onSuccess: () => {
      toast.success("Rate deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "shipping"] });
    },
    onError: () => toast.error("Delete failed."),
  });

  function openNew() { setForm(empty); setErr({}); setOpen(true); }
  function openEdit(r: ShippingRate) {
    setForm({
      id: r.id,
      country_iso2: r.country_iso2,
      method: r.method,
      currency: r.currency || "USD",
      base_fee: Number(r.base_fee) || 0,
      per_kg_fee: Number(r.per_kg_fee) || 0,
      min_fee: Number(r.min_fee) || 0,
      max_fee: Number(r.max_fee) || 0,
      free_threshold: Number(r.free_threshold) || 0,
      delivery_days: r.delivery_days || "",
      is_active: !!r.is_active,
    });
    setErr({});
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Operations</p>
          <h1 className="display-serif text-3xl lg:text-4xl mt-2">Shipping rates</h1>
        </div>
        <Button variant="gold" onClick={openNew}><Plus className="size-4" /> New rate</Button>
      </header>

      <section className="surface-luxe overflow-hidden">
        {list.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">
            No shipping rates yet — add one to enable a destination.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground bg-cream-100/40 dark:bg-card/40">
              <tr className="text-left">
                <th className="p-3">Country</th>
                <th>Method</th>
                <th>Base fee</th>
                <th>Per kg</th>
                <th>Free over</th>
                <th>Days</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data?.map((r) => {
                const country = COUNTRIES.find((c) => c.iso2 === r.country_iso2);
                return (
                  <tr key={r.id} className="hover:bg-muted/40">
                    <td className="p-3">
                      <p className="font-medium">{country?.name ?? r.country_iso2}</p>
                      <p className="text-xs text-muted-foreground">{r.country_iso2}</p>
                    </td>
                    <td className="capitalize">{r.method}</td>
                    <td>{formatPrice(Number(r.base_fee), r.currency)}</td>
                    <td>{r.per_kg_fee ? formatPrice(Number(r.per_kg_fee), r.currency) : "—"}</td>
                    <td>{r.free_threshold ? formatPrice(Number(r.free_threshold), r.currency) : "—"}</td>
                    <td className="text-xs text-muted-foreground">{r.delivery_days}</td>
                    <td>
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${r.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted"}`}>
                        {r.is_active ? "On" : "Off"}
                      </span>
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-muted" aria-label="Edit">
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete ${r.country_iso2} ${r.method}?`)) del.mutate(r.id); }}
                        className="p-1.5 rounded hover:bg-muted text-destructive"
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

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit shipping rate" : "New shipping rate"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}
            className="space-y-3"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Country</Label>
                <select
                  value={form.country_iso2}
                  onChange={(e) => setForm({ ...form, country_iso2: e.target.value })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  {COUNTRIES.map((c) => (
                    <option key={c.iso2} value={c.iso2}>{c.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Method</Label>
                <select
                  value={form.method}
                  onChange={(e) => setForm({ ...form, method: e.target.value as "standard" | "express" })}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                >
                  <option value="standard">Standard</option>
                  <option value="express">Express</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Currency (3-letter ISO)</Label>
                <Input maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Delivery days</Label>
                <Input placeholder="3-5" value={form.delivery_days} onChange={(e) => setForm({ ...form, delivery_days: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Base fee</Label>
                <Input type="number" step="0.01" value={form.base_fee} onChange={(e) => setForm({ ...form, base_fee: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Per-kg fee</Label>
                <Input type="number" step="0.01" value={form.per_kg_fee} onChange={(e) => setForm({ ...form, per_kg_fee: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Min fee (0 = none)</Label>
                <Input type="number" step="0.01" value={form.min_fee} onChange={(e) => setForm({ ...form, min_fee: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max fee (0 = none)</Label>
                <Input type="number" step="0.01" value={form.max_fee} onChange={(e) => setForm({ ...form, max_fee: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Free over (0 = never)</Label>
                <Input type="number" step="0.01" value={form.free_threshold} onChange={(e) => setForm({ ...form, free_threshold: Number(e.target.value) })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="size-4 accent-roseGold"
              /> Active
            </label>
            <AuthFormError message={err.message} errors={err.errors} />
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancel</Button>
              </DialogClose>
              <Button type="submit" variant="gold" disabled={save.isPending}>
                {save.isPending ? "Saving…" : form.id ? "Save changes" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}