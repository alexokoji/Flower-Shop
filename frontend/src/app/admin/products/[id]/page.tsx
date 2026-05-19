"use client";

import { use } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { pb } from "@/lib/pb";
import { ProductForm } from "@/components/admin/product-form";
import type { Product } from "@/types";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "product", id],
    queryFn: () => pb().collection("products").getOne<Product>(id),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading product…</p>;
  if (isError || !data) {
    return (
      <div className="space-y-4">
        <Link href="/admin/products" className="inline-flex items-center text-sm hover:text-roseGold">
          <ArrowLeft className="size-4 mr-1" /> All products
        </Link>
        <p className="text-sm text-muted-foreground">Product not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <Link href="/admin/products" className="inline-flex items-center text-sm hover:text-roseGold mb-3">
          <ArrowLeft className="size-4 mr-1" /> All products
        </Link>
        <p className="eyebrow">Catalog</p>
        <h1 className="display-serif text-3xl lg:text-4xl mt-2">{data.name}</h1>
        <p className="text-xs text-muted-foreground mt-1">{data.sku}</p>
      </header>
      <ProductForm initial={data} />
    </div>
  );
}