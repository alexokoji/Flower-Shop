"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { X } from "lucide-react";
import { pb } from "@/lib/pb";
import { categories as listCategories } from "@/lib/catalog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractError } from "@/lib/errors";
import { AuthFormError } from "@/components/auth/auth-form-error";
import type { Product } from "@/types";

const schema = z.object({
  name: z.string().min(1).max(160),
  slug: z.string().min(1).max(200),
  sku: z.string().min(1).max(64),
  category: z.string().min(1, "Pick a category"),
  type: z.enum(["flower", "necklace"]),
  short_description: z.string().max(280).optional().or(z.literal("")),
  description: z.string().optional().or(z.literal("")),
  currency: z.string().length(3),
  price: z.coerce.number().min(0),
  sale_price: z.coerce.number().min(0).optional(),
  stock_quantity: z.coerce.number().int().min(0),
  low_stock_threshold: z.coerce.number().int().min(0),
  status: z.enum(["in_stock", "out_of_stock", "preorder", "draft", "archived"]),
  is_featured: z.boolean().optional(),
  is_best_seller: z.boolean().optional(),
  weight_g: z.coerce.number().min(0).optional(),
  ships_internationally: z.boolean().optional(),
  delivery_estimate: z.string().max(120).optional().or(z.literal("")),
  meta_title: z.string().max(160).optional().or(z.literal("")),
  meta_description: z.string().max(320).optional().or(z.literal("")),
  // flower
  flower_type: z.string().optional().or(z.literal("")),
  occasion: z.string().optional().or(z.literal("")),
  freshness_days: z.coerce.number().int().optional(),
  care_instructions: z.string().optional().or(z.literal("")),
  // necklace
  material: z.string().optional().or(z.literal("")),
  stone_type: z.string().optional().or(z.literal("")),
  chain_length_cm: z.coerce.number().optional(),
  gender: z.string().optional().or(z.literal("")),
  // both: color
  color: z.string().optional().or(z.literal("")),
});

type Form = z.infer<typeof schema>;

interface Props { initial?: Product }

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

export function ProductForm({ initial }: Props) {
  const router = useRouter();
  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});
  const [imageUrls, setImageUrls] = useState<string[]>(initial?.image_urls ?? []);
  const [imageInput, setImageInput] = useState("");

  const cats = useQuery({
    queryKey: ["admin", "categories", "all"],
    queryFn: () => listCategories(),
    staleTime: 60 * 60_000,
  });

  const a = (initial?.attributes ?? {}) as Record<string, unknown>;
  const f = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: initial?.name ?? "",
      slug: initial?.slug ?? "",
      sku: initial?.sku ?? "",
      category: initial?.category ?? "",
      type: (initial?.type ?? "flower") as "flower" | "necklace",
      short_description: initial?.short_description ?? "",
      description: initial?.description ?? "",
      currency: initial?.currency ?? "USD",
      price: initial?.price ?? 0,
      sale_price: initial?.sale_price ?? 0,
      stock_quantity: initial?.stock_quantity ?? 0,
      low_stock_threshold: initial?.low_stock_threshold ?? 5,
      status: initial?.status ?? "draft",
      is_featured: initial?.is_featured ?? false,
      is_best_seller: initial?.is_best_seller ?? false,
      weight_g: initial?.weight_g ?? 0,
      ships_internationally: initial?.ships_internationally ?? true,
      delivery_estimate: initial?.delivery_estimate ?? "",
      meta_title: initial?.meta_title ?? "",
      meta_description: initial?.meta_description ?? "",
      flower_type: (a.flower_type as string) ?? "",
      occasion: (a.occasion as string) ?? "",
      freshness_days: (a.freshness_days as number) ?? 0,
      care_instructions: (a.care_instructions as string) ?? "",
      material: (a.material as string) ?? "",
      stone_type: (a.stone_type as string) ?? "",
      chain_length_cm: (a.chain_length_cm as number) ?? 0,
      gender: (a.gender as string) ?? "",
      color: (a.color as string) ?? "",
    },
  });

  // Auto-derive slug from name when creating a new product
  const watchedName = f.watch("name");
  const watchedSlug = f.watch("slug");
  useEffect(() => {
    if (!initial && watchedName && !watchedSlug) {
      f.setValue("slug", slugify(watchedName));
    }
  }, [watchedName, watchedSlug, initial, f]);

  const watchType = f.watch("type");

  function addImage() {
    const url = imageInput.trim();
    if (!url) return;
    setImageUrls([...imageUrls, url]);
    setImageInput("");
  }
  function removeImage(idx: number) {
    setImageUrls(imageUrls.filter((_, i) => i !== idx));
  }
  function moveImage(idx: number, dir: -1 | 1) {
    const target = idx + dir;
    if (target < 0 || target >= imageUrls.length) return;
    const next = [...imageUrls];
    [next[idx], next[target]] = [next[target], next[idx]];
    setImageUrls(next);
  }

  async function onSubmit(values: Form) {
    setServerError({});
    const attributes =
      values.type === "flower"
        ? {
            flower_type: values.flower_type || undefined,
            color: values.color || undefined,
            occasion: values.occasion || undefined,
            freshness_days: values.freshness_days || undefined,
            care_instructions: values.care_instructions || undefined,
          }
        : {
            material: values.material || undefined,
            stone_type: values.stone_type || undefined,
            chain_length_cm: values.chain_length_cm || undefined,
            gender: values.gender || undefined,
            weight_g: values.weight_g || undefined,
            color: values.color || undefined,
          };

    const payload: Record<string, unknown> = {
      name: values.name,
      slug: values.slug || slugify(values.name),
      sku: values.sku,
      category: values.category,
      type: values.type,
      short_description: values.short_description || "",
      description: values.description || "",
      currency: values.currency.toUpperCase(),
      price: values.price,
      sale_price: values.sale_price || 0,
      stock_quantity: values.stock_quantity,
      low_stock_threshold: values.low_stock_threshold,
      status: values.status,
      is_featured: !!values.is_featured,
      is_best_seller: !!values.is_best_seller,
      attributes,
      image_urls: imageUrls,
      weight_g: values.weight_g || 0,
      ships_internationally: !!values.ships_internationally,
      delivery_estimate: values.delivery_estimate || "",
      meta_title: values.meta_title || "",
      meta_description: values.meta_description || "",
    };

    try {
      if (initial) {
        await pb().collection("products").update(initial.id, payload);
        toast.success("Product updated.");
      } else {
        const created = await pb().collection("products").create<Product>(payload);
        toast.success("Product created.");
        router.replace(`/admin/products/${created.id}`);
        return;
      }
    } catch (err) {
      setServerError(extractError(err));
    }
  }

  return (
    <form onSubmit={f.handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Section title="Basics">
        <Field label="Name" error={f.formState.errors.name?.message}>
          <Input {...f.register("name")} />
        </Field>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Slug" hint="Auto-fills from name. URL-safe.">
            <Input {...f.register("slug")} />
          </Field>
          <Field label="SKU">
            <Input {...f.register("sku")} />
          </Field>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Category">
            <select
              {...f.register("category")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">— Select —</option>
              {cats.data?.map((c) => (
                <option key={c.id} value={c.id}>{c.name} ({c.type})</option>
              ))}
            </select>
          </Field>
          <Field label="Type">
            <select
              {...f.register("type")}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="flower">Flower</option>
              <option value="necklace">Necklace</option>
            </select>
          </Field>
        </div>
        <Field label="Short description">
          <textarea
            {...f.register("short_description")}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>
        <Field label="Description" hint="HTML allowed.">
          <textarea
            {...f.register("description")}
            rows={6}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          />
        </Field>
      </Section>

      <Section title="Pricing & inventory">
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Currency"><Input maxLength={3} {...f.register("currency")} /></Field>
          <Field label="Price"><Input type="number" step="0.01" {...f.register("price")} /></Field>
          <Field label="Sale price (0 = no sale)"><Input type="number" step="0.01" {...f.register("sale_price")} /></Field>
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <Field label="Stock quantity"><Input type="number" {...f.register("stock_quantity")} /></Field>
          <Field label="Low stock threshold"><Input type="number" {...f.register("low_stock_threshold")} /></Field>
          <Field label="Status">
            <select {...f.register("status")} className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
              <option value="in_stock">In stock</option>
              <option value="out_of_stock">Out of stock</option>
              <option value="preorder">Preorder</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </Field>
        </div>
        <div className="flex flex-wrap gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...f.register("is_featured")} className="size-4 accent-roseGold" /> Featured
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...f.register("is_best_seller")} className="size-4 accent-roseGold" /> Best seller
          </label>
        </div>
      </Section>

      <Section title="Images" hint="Paste image URLs. Reorder with arrows; first image is the primary.">
        <div className="flex gap-2">
          <Input
            placeholder="https://…"
            value={imageInput}
            onChange={(e) => setImageInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addImage(); } }}
          />
          <Button type="button" variant="outline" onClick={addImage}>Add</Button>
        </div>
        {imageUrls.length > 0 && (
          <ul className="space-y-2 mt-2">
            {imageUrls.map((url, i) => (
              <li key={i} className="flex items-center gap-2 p-2 border border-border rounded-md">
                <span className="text-xs text-muted-foreground tabular-nums w-6">{i + 1}.</span>
                <span className="flex-1 truncate text-xs">{url}</span>
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} className="px-2 text-xs disabled:opacity-40">↑</button>
                <button type="button" onClick={() => moveImage(i, +1)} disabled={i === imageUrls.length - 1} className="px-2 text-xs disabled:opacity-40">↓</button>
                <button type="button" onClick={() => removeImage(i)} className="text-destructive hover:opacity-75">
                  <X className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>

      {watchType === "flower" ? (
        <Section title="Flower attributes">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Flower type"><Input {...f.register("flower_type")} placeholder="Rose, Lily, …" /></Field>
            <Field label="Color"><Input {...f.register("color")} placeholder="red, white, pink…" /></Field>
            <Field label="Occasion"><Input {...f.register("occasion")} placeholder="Wedding, Birthday…" /></Field>
            <Field label="Freshness (days)"><Input type="number" {...f.register("freshness_days")} /></Field>
          </div>
          <Field label="Care instructions">
            <textarea {...f.register("care_instructions")} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
        </Section>
      ) : (
        <Section title="Necklace attributes">
          <div className="grid sm:grid-cols-2 gap-3">
            <Field label="Material"><Input {...f.register("material")} placeholder="18k Gold, Sterling Silver…" /></Field>
            <Field label="Stone"><Input {...f.register("stone_type")} placeholder="Diamond, Pearl, None…" /></Field>
            <Field label="Chain length (cm)"><Input type="number" {...f.register("chain_length_cm")} /></Field>
            <Field label="Gender"><Input {...f.register("gender")} placeholder="Women, Men, Unisex" /></Field>
            <Field label="Color"><Input {...f.register("color")} /></Field>
          </div>
        </Section>
      )}

      <Section title="Shipping">
        <div className="grid sm:grid-cols-2 gap-3">
          <Field label="Weight (g)"><Input type="number" {...f.register("weight_g")} /></Field>
          <Field label="Delivery estimate"><Input {...f.register("delivery_estimate")} /></Field>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...f.register("ships_internationally")} className="size-4 accent-roseGold" /> Ships internationally
        </label>
      </Section>

      <Section title="SEO">
        <Field label="Meta title"><Input {...f.register("meta_title")} /></Field>
        <Field label="Meta description">
          <textarea {...f.register("meta_description")} rows={2} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
        </Field>
      </Section>

      <AuthFormError message={serverError.message} errors={serverError.errors} />

      <div className="sticky bottom-0 surface-luxe p-4 flex items-center justify-between gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
        <Button type="submit" variant="gold" disabled={f.formState.isSubmitting}>
          {f.formState.isSubmitting ? "Saving…" : initial ? "Save changes" : "Create product"}
        </Button>
      </div>
    </form>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="surface-luxe p-6 space-y-4">
      <div>
        <h2 className="display-serif text-xl">{title}</h2>
        {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, error, children }: { label: string; hint?: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}