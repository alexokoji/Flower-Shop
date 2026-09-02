import { storeFile } from "@/lib/db/files";
import type { SessionClaims } from "@/lib/auth/session";

/**
 * Read a request body as a plain object, whether it arrived as JSON or as
 * multipart form data.
 *
 * The PocketBase SDK sent FormData whenever a record carried a file, so the
 * upload path has to keep working: any File in the form is streamed into GridFS
 * and the field is replaced with `"<id>/<filename>"` — the shape
 * `/api/files/{id}/{name}` expects.
 */
export async function readBody(
  req: Request,
  ctx: { collection: string; session: SessionClaims | null }
): Promise<Record<string, unknown>> {
  const type = req.headers.get("content-type") ?? "";

  if (!type.includes("multipart/form-data")) {
    try {
      return (await req.json()) as Record<string, unknown>;
    } catch {
      return {};
    }
  }

  const form = await req.formData();
  const out: Record<string, unknown> = {};

  for (const [key, value] of form.entries()) {
    if (value instanceof File) {
      if (!value.size) continue; // empty file input
      const stored = await storeFile(value, {
        owner: ctx.session?.uid ?? "",
        collection: ctx.collection,
        field: key,
      });
      out[key] = `${stored.id}/${stored.filename}`;
      continue;
    }

    // FormData is all strings; recover the JSON-ish values the API expects.
    const raw = String(value);
    if (raw === "true" || raw === "false") out[key] = raw === "true";
    else if (raw !== "" && !isNaN(Number(raw)) && /^-?\d+(\.\d+)?$/.test(raw)) out[key] = Number(raw);
    else if (raw.startsWith("{") || raw.startsWith("[")) {
      try {
        out[key] = JSON.parse(raw);
      } catch {
        out[key] = raw;
      }
    } else out[key] = raw;
  }

  return out;
}
