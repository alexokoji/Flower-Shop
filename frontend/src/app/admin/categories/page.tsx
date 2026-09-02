"use client";

import { useEffect, useState } from "react";
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
import type { Category } from "@/types";

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "")
   .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

interface FormState {
  id: string | null;
  type: "flower" | "necklace";
  name: string;
  slug: string;
  description: string;
  sort_order: number;
  is_featured: boolean;
  is_active: boolean;
}

const empty: FormState = {
  id: null, type: "flower", name: "", slug: "",
  description: "", sort_order: 0, is_featured: false, is_active: true,
};

export default function AdminCategoriesPage() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(empty);
  const [err, setErr] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  const list = useQuery({
    queryKey: ["admin", "categories"],
    queryFn: () => pb().collection("categories").getFullList<Category>({ sort: "type,sort_order,name" }),
  });

  const save = useMutation({
    mutationFn: async (f: FormState) => {
      const payload = {
        type: f.type, name: f.name,
        slug: f.slug || slugify(f.name),
        description: f.description,
        sort_order: f.sort_order,
        is_featured: f.is_featured,
        is_active: f.is_active,
      };
      return f.id
        ? pb().collection("categories").update(f.id, payload)
        : pb().collection("categories").create(payload);
    },
    onSuccess: () => {
      toast.success(form.id ? "Category updated." : "Category created.");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
      setOpen(false);
    },
    onError: (e) => setErr(extractError(e)),
  });

  const del = useMutation({
    mutationFn: (id: string) => pb().collection("categories").delete(id),
    onSuccess: () => {
      toast.success("Category deleted.");
      qc.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
    onError: () => toast.error("Delete failed. The category may still have products attached."),
  });

  function openNew() { setForm(empty); setErr({}); setOpen(true); }
  function openEdit(c: Category) {
    setForm({
      id: c.id, type: c.type, name: c.name, slug: c.slug,
      description: c.description ?? "",
      sort_order: c.sort_order ?? 0,
      is_featured: !!c.is_featured,
      is_active: !!c.is_active,
    });
    setErr({});
    setOpen(true);
  }

  const groups = {
    flower: list.data?.filter((c) => c.type === "flower") ?? [],
    necklace: list.data?.filter((c) => c.type === "necklace") ?? [],
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Catalog</p>
          <h1 className="display text-display-sm lg:text-4xl mt-2">Categories</h1>
        </div>
        <Button variant="gold" onClick={openNew}><Plus className="size-4" /> New category</Button>
      </header>

      {list.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : (
        (["flower", "necklace"] as const).map((type) => (
          <section key={type} className="rounded-2xl border border-border bg-card shadow-soft overflow-hidden">
            <header className="p-4 border-b border-border">
              <h2 className="display text-lg capitalize">{type}s</h2>
              <p className="text-xs text-muted-foreground mt-1">{groups[type].length} categories</p>
            </header>
            <table className="w-full text-sm">
              <thead className="text-xs uppercase tracking-widest text-muted-foreground bg-surface/40 dark:bg-card/40">
                <tr className="text-left">
                  <th className="p-3">Name</th>
                  <th>Slug</th>
                  <th>Sort</th>
                  <th>Flags</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {groups[type].map((c) => (
                  <tr key={c.id} className="hover:bg-muted/40">
                    <td className="p-3 font-medium">{c.name}</td>
                    <td className="text-xs text-muted-foreground">{c.slug}</td>
                    <td className="text-xs tabular-nums">{c.sort_order}</td>
                    <td className="space-x-1">
                      {c.is_featured && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-accent/12 text-accent">Featured</span>}
                      {!c.is_active && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-muted">Inactive</span>}
                    </td>
                    <td className="p-3 text-right whitespace-nowrap">
                      <button onClick={() => openEdit(c)} className="p-1.5 rounded hover:bg-muted" aria-label="Edit">
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => { if (confirm(`Delete "${c.name}"?`)) del.mutate(c.id); }}
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
          </section>
        ))
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{form.id ? "Edit category" : "New category"}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); save.mutate(form); }}
            className="space-y-3"
          >
            <div className="space-y-1.5">
              <Label>Type</Label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value as "flower" | "necklace" })}
                className="flex h-10 w-full rounded-xl border border-input bg-card px-3 text-sm"
              >
                <option value="flower">Flower</option>
                <option value="necklace">Necklace</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({
                    ...f, name,
                    slug: !f.id && (!f.slug || f.slug === slugify(f.name)) ? slugify(name) : f.slug,
                  }));
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <textarea
                rows={2}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                className="w-full rounded-xl border border-input bg-card px-3 py-2 text-sm"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Sort order</Label>
              <Input
                type="number"
                value={form.sort_order}
                onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
              />
            </div>
            <div className="flex flex-wrap gap-4">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox" checked={form.is_featured}
                  onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
                  className="size-4 accent-[hsl(var(--accent))]"
                /> Featured
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox" checked={form.is_active}
                  onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
                  className="size-4 accent-[hsl(var(--accent))]"
                /> Active
              </label>
            </div>
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