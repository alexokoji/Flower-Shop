import { currentSession, type SessionClaims } from "@/lib/auth/session";

/**
 * Authorization.
 *
 * PocketBase enforced access with 68 declarative rules like
 *   listRule: '@request.auth.id != "" && (user = @request.auth.id || @request.auth.role = "admin")'
 * evaluated by the server on every request. MongoDB has no equivalent, so those
 * rules become the functions below — and, critically, an ownership filter that
 * is merged into the query itself.
 *
 * The rule of this module: never fetch a document and then check ownership in
 * the handler. Always constrain the QUERY, so a missing check cannot leak a row.
 */

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export async function session(): Promise<SessionClaims | null> {
  return currentSession();
}

/** Throws 401 when signed out. */
export async function requireAuth(): Promise<SessionClaims> {
  const s = await currentSession();
  if (!s) throw new HttpError(401, "You must be signed in.");
  return s;
}

/** Throws 403 unless the caller is an admin. */
export async function requireAdmin(): Promise<SessionClaims> {
  const s = await requireAuth();
  if (s.role !== "admin") throw new HttpError(403, "Administrator access required.");
  return s;
}

export function isAdmin(s: SessionClaims | null): boolean {
  return s?.role === "admin";
}

/**
 * The owner-or-admin filter, equivalent to
 *   `user = @request.auth.id || @request.auth.role = "admin"`.
 *
 * Merge into every query over user-owned data:
 *   const filter = { ...ownerFilter(s), status: "paid" };
 */
export function ownerFilter(s: SessionClaims, field = "user"): Record<string, unknown> {
  return s.role === "admin" ? {} : { [field]: s.uid };
}

/** Assert a fetched document belongs to the caller. Use only where a query filter cannot. */
export function assertOwner(s: SessionClaims, ownerId: string | undefined | null) {
  if (s.role === "admin") return;
  if (!ownerId || ownerId !== s.uid) throw new HttpError(403, "That is not yours.");
}

/** Map a thrown HttpError onto the standard envelope. */
export function errorResponse(err: unknown) {
  if (err instanceof HttpError) {
    return Response.json({ message: err.message, data: {} }, { status: err.status });
  }
  console.error("[api] unexpected:", err);
  return Response.json({ message: "Something went wrong." }, { status: 500 });
}
