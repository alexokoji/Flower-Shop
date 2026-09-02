"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { pb } from "@/lib/pb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import { extractError } from "@/lib/errors";
import { AuthFormError } from "@/components/auth/auth-form-error";
import type { PbRecord } from "@/types";

interface Coupon extends PbRecord {
  code: string;
  type: "fixed" | "percent";
  value: number;
  min_subtotal: number;
  currency: string;
  max_uses: number;
  max_uses_per_user: number;
  used_count: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

interface FormState {
  id: string | null;
  code: string;
  type: "fixed" | "percent";
  value: number;
  min_subtotal: number;
  currency: string;
  max_uses: number;
  max_uses_per_user: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
}

const empty: FormState = {
  id: null, code: "", type: "percent", value: 10,
  min_subtotal: 0, currency: "USD",
  max_uses: 0, max_uses_per_user: 0,
  starts_at: "", ends_at: "", is_active: true,
};

// Convert "YYYY-MM-DDTHH:mm" (datetime-local) <-> PocketBase ISO timestamp
function isoToLocal(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
function localToIso(local: string): string {
  if (!local) return "";
  return new Date(local).toISOString();
}

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [err, setErr] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  const list = useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: () => pb().collection("coupons").getFullList<Coupon>({ sort: "-created" }),
  });

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        code: f.code.toUpperCase(),
        type: f.type,
        value: f.value,
        min_subtotal: f.min_subtotal || null,
        currency: f.currency.toUpperCase(),
        max_uses: f.max_uses || null,
        max_uses_per_user: f.max_uses_per_user || null,
        starts_at: localToIso(f.starts_at) || null,
        ends_at: localToIso(f.ends_at) || null,
        is_active: f.is_active,
      };
      return f.id
        ? pb().collection("coupons").update(f.id, payload)
        : pb().collection("coupons").create(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Coupon updated." : "Coupon created.");
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
      setOpen(false);
    },
    onError: (e) => setErr(extractError(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => pb().collection("coupons").delete(id),
    onSuccess: () => {
      toast.success("Coupon deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "coupons"] });
    },
    onError: () => toast.error("Delete failed."),
  });

  function openNew() { setForm(empty); setErr({}); setOpen(true); }
  function openEdit(c: Coupon) {
    setForm({
      id: c.id,
      code: c.code,
      type: c.type,
      value: Number(c.value) || 0,
      min_subtotal: Number(c.min_subtotal) || 0,
      currency: c.currency || "USD",
      max_uses: Number(c.max_uses) || 0,
      max_uses_per_user: Number(c.max_uses_per_user) || 0,
      starts_at: isoToLocal(c.starts_at),
      ends_at: isoToLocal(c.ends_at),
      is_active: !!c.is_active,
    });
    setErr({});
    setOpen(true);
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Promotions</p>
          <h1 className="display text-display-sm lg:text-4xl mt-2">Coupons</h1>
        </div>
        <Button variant="gold" onClick={openNew}><Plus className="size-4" /> New coupon</Button>
      </header>

      <section className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
        {list.isLoading ? (
          <p className="p-6 text-sm text-muted-foreground">Loading…</p>
        ) : (list.data?.length ?? 0) === 0 ? (
          <p className="p-12 text-center text-sm text-muted-foreground">No coupons yet.</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="text-xs uppercase tracking-widest text-muted-foreground bg-surface/40 dark:bg-card/40">
              <tr className="text-left">
                <th className="p-3">Code</th>
                <th>Discount</th>
                <th>Min subtotal</th>
                <th>Used</th>
                <th>Window</th>
                <th>Active</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {list.data?.map((c) => (
                <tr key={c.id} className="hover:bg-muted/40">
                  <td className="p-3 font-mono font-medium">{c.code}</td>
                  <td>
                    {c.type === "percent"
                      ? `${c.value}%`
                      : `${c.value} ${c.currency || ""}`}
                  </td>
                  <td>{c.min_subtotal ? `${c.min_subtotal} ${c.currency || ""}` : "—"}</td>
                  <td className="text-xs">
                    {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ""}
                  </td>
                  <td className="text-xs text-muted-foreground">
                    {c.starts_at ? new Date(c.starts_at).toLocaleDateString() : "—"}
                    {" → "}
                    {c.ends_at ? new Date(c.ends_at).toLocaleDateString() : "—"}
                  </td>
                  <td>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded-full ${c.is_active ? "bg-success/12 text-success" : "bg-muted"}`}>
                      {c.is_active ? "On" : "Off"}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-muted" aria-label="Edit">
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete coupon ${c.code}?`)) del.mutate(c.id); }}
                      className="p-1.5 rounded hover:bg-muted text-destructive"
                      aria-label="Delete"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit coupon" : "New coupon"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}
            className="space-y-3"
          >
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Code</Label>
                <Input
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                  placeholder="WELCOME10"
                  className="uppercase font-mono"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Discount type</Label>
                <select
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value as "fixed" | "percent" })}
                  className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
                >
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount</option>
                </select>
              </div>
            </div>
            <div className="grid sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>{form.type === "percent" ? "Percent (1-100)" : "Amount"}</Label>
                <Input type="number" step="0.01" value={form.value} onChange={(e) => setForm({ ...form, value: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Min subtotal</Label>
                <Input type="number" step="0.01" value={form.min_subtotal} onChange={(e) => setForm({ ...form, min_subtotal: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Currency</Label>
                <Input maxLength={3} value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Max uses (0 = unlimited)</Label>
                <Input type="number" value={form.max_uses} onChange={(e) => setForm({ ...form, max_uses: Number(e.target.value) })} />
              </div>
              <div className="space-y-1.5">
                <Label>Max uses per user (0 = unlimited)</Label>
                <Input type="number" value={form.max_uses_per_user} onChange={(e) => setForm({ ...form, max_uses_per_user: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Starts at</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>Ends at</Label>
                <Input type="datetime-local" value={form.ends_at} onChange={(e) => setForm({ ...form, ends_at: e.target.value })} />
              </div>
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox" checked={form.is_active}
                onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                className="size-4 accent-[hsl(var(--accent))]"
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