import { pb } from "@/lib/pb";
import type { Category, Product, PbList } from "@/types";

export interface ProductQuery {
  type?: "flower" | "necklace";
  category?: string;          // slug
  q?: string;
  min_price?: number;
  max_price?: number;
  color?: string;
  occasion?: string;
  in_stock?: boolean;
  sort?: "popular" | "newest" | "price_asc" | "price_desc";
  page?: number;
  per_page?: number;
}

function buildFilter(qry: ProductQuery): string {
  const parts: string[] = [`status != "draft" && status != "archived"`];
  if (qry.type) parts.push(`type = "${qry.type}"`);
  if (qry.category) parts.push(`category.slug = "${qry.category.replace(/"/g, '\\"')}"`);
  if (qry.q) {
    const term = qry.q.replace(/"/g, '\\"');
    parts.push(`(name ~ "${term}" || description ~ "${term}")`);
  }
  if (qry.min_price != null) parts.push(`price >= ${qry.min_price}`);
  if (qry.max_price != null) parts.push(`price <= ${qry.max_price}`);
  if (qry.color) parts.push(`attributes.color ?= "${qry.color}"`);
  if (qry.occasion) parts.push(`attributes.occasion ?= "${qry.occasion}"`);
  if (qry.in_stock) parts.push(`status = "in_stock" && stock_quantity > 0`);
  return parts.join(" && ");
}

function buildSort(qry: ProductQuery): string {
  switch (qry.sort) {
    case "price_asc": return "+price";
    case "price_desc": return "-price";
    case "newest": return "-created";
    case "popular":
    default: return "-sales_count,-rating_avg";
  }
}

export async function listProducts(qry: ProductQuery = {}): Promise<PbList<Product>> {
  return pb().collection("products").getList<Product>(
    qry.page ?? 1,
    Math.min(qry.per_page ?? 12, 60),
    { filter: buildFilter(qry), sort: buildSort(qry), expand: "category" },
  );
}

export async function featuredProducts(type?: "flower" | "necklace", perPage = 8): Promise<Product[]> {
  const filter = [
    `is_featured = true`,
    `status != "draft" && status != "archived"`,
    type ? `type = "${type}"` : "",
  ].filter(Boolean).join(" && ");
  return pb().collection("products").getFullList<Product>({
    filter,
    sort: "-created",
    expand: "category",
    limit: perPage,
  });
}

export async function bestSellers(type?: "flower" | "necklace", perPage = 8): Promise<Product[]> {
  const filter = [
    `is_best_seller = true`,
    `status != "draft" && status != "archived"`,
    type ? `type = "${type}"` : "",
  ].filter(Boolean).join(" && ");
  return pb().collection("products").getFullList<Product>({
    filter,
    sort: "-sales_count",
    expand: "category",
    limit: perPage,
  });
}

export async function productBySlug(slug: string): Promise<Product> {
  return pb().collection("products").getFirstListItem<Product>(
    `slug = "${slug.replace(/"/g, '\\"')}" && status != "draft" && status != "archived"`,
    { expand: "category" },
  );
}

export async function relatedProducts(product: Product, limit = 8): Promise<Product[]> {
  return pb().collection("products").getFullList<Product>({
    filter: `category = "${product.category}" && id != "${product.id}" && status != "draft" && status != "archived"`,
    sort: "-sales_count",
    limit,
  });
}

export async function categories(type?: "flower" | "necklace"): Promise<Category[]> {
  const filter = ["is_active = true", type ? `type = "${type}"` : ""].filter(Boolean).join(" && ");
  return pb().collection("categories").getFullList<Category>({ filter, sort: "sort_order" });
}
