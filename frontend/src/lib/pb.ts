/**
 * Compatibility layer.
 *
 * The app previously talked straight to PocketBase through this module. The
 * backend is now MongoDB behind Next.js route handlers, but the exported
 * surface is unchanged — `pb()`, `pbCall()`, `fileUrl()`, `PbError` — so the
 * call sites that import from here keep working.
 *
 * New code should import from `@/lib/api/client` directly.
 */

import { api, ApiError, apiRequest, authStore } from "@/lib/api/client";

/** @deprecated Use `api()` from @/lib/api/client. */
export function pb() {
  return api();
}

/** Kept for `catch (err) { if (err instanceof PbError) }` call sites. */
export const PbError = ApiError;
export type PbError = ApiError;

/** Build a URL for an uploaded file. */
export function fileUrl(
  record: { id: string; collectionId?: string; collectionName?: string },
  filename: string,
  query?: Record<string, string>
) {
  return api().files.getUrl(record, filename, query);
}

/**
 * Call a custom API route (checkout, tracking, payments). Previously these were
 * PocketBase JS hooks; they are now route handlers under /api.
 */
export async function pbCall<T = unknown>(path: string, init?: RequestInit): Promise<T> {
  const clean = path.startsWith("/api/") ? path.slice(4) : path.startsWith("/") ? path : `/${path}`;
  return apiRequest<T>(clean, init);
}

export { authStore };
