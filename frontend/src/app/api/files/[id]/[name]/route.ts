import { readFile } from "@/lib/db/files";
import { currentSession } from "@/lib/auth/session";

/**
 * GET /api/files/{id}/{name} — serve an uploaded file.
 *
 * Uploads here are payment receipts, so they are private: only the uploader or
 * an admin may read one. The `{name}` segment is cosmetic (it gives browsers a
 * sensible download name); authorisation is entirely on the id.
 */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string; name: string }> }) {
  const { id } = await ctx.params;

  const file = await readFile(id);
  if (!file) return new Response("Not found", { status: 404 });

  const s = await currentSession();
  const allowed = s && (s.role === "admin" || s.uid === file.owner);
  if (!allowed) {
    // Same response as a missing file — do not confirm the id exists.
    return new Response("Not found", { status: 404 });
  }

  return new Response(new Uint8Array(file.buffer), {
    headers: {
      "Content-Type": file.contentType,
      "Content-Length": String(file.buffer.length),
      "Content-Disposition": `inline; filename="${file.filename}"`,
      // Private: never cached by a shared proxy.
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
