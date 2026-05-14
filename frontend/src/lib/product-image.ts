import { fileUrl } from "@/lib/pb";
import type { Product } from "@/types";

/**
 * Build the public URL for a single product image. Prefers `image_urls`
 * (curated remote URLs) over `images` (PocketBase file uploads).
 *
 * @param product   any product record
 * @param index     which image (0 = primary)
 * @param thumb     optional PocketBase thumb spec (only applies to file uploads)
 */
export function productImage(
  product: Pick<Product, "id" | "collectionId" | "images" | "image_urls">,
  index = 0,
  thumb?: string,
): string | null {
  const urls = product.image_urls;
  if (Array.isArray(urls) && urls[index]) return urls[index];

  const files = product.images;
  if (Array.isArray(files) && files[index]) {
    return fileUrl(
      { id: product.id, collectionId: product.collectionId },
      files[index],
      thumb ? { thumb } : undefined,
    );
  }
  return null;
}

/** Build URLs for every product image in order. */
export function productImageList(
  product: Pick<Product, "id" | "collectionId" | "images" | "image_urls">,
  thumb?: string,
): string[] {
  const urls = Array.isArray(product.image_urls) ? product.image_urls : [];
  const files = Array.isArray(product.images) ? product.images : [];
  const fileUrls = files.map((f) =>
    fileUrl({ id: product.id, collectionId: product.collectionId }, f, thumb ? { thumb } : undefined),
  );
  return [...urls, ...fileUrls];
}