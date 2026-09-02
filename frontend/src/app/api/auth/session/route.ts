import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toObjectId, toRecord } from "@/lib/db/serialize";
import { currentSession, clearSessionCookie } from "@/lib/auth/session";
import { ok, route } from "@/lib/api/respond";
import type { UserDoc } from "@/lib/db/types";

/**
 * GET  — who am I? Returns `{ record }` or `{ record: null }`, never a 401, so
 *        the client can treat "signed out" as a normal state.
 * DELETE — sign out.
 */
export const GET = route(async () => {
  const s = await currentSession();
  if (!s) return ok({ record: null });

  const _id = toObjectId(s.uid);
  if (!_id) return ok({ record: null });

  const users = await coll<UserDoc>(C.users);
  const user = await users.findOne({ _id });
  if (!user) {
    // Session references a deleted account — drop the cookie.
    await clearSessionCookie();
    return ok({ record: null });
  }

  const record = toRecord(user)!;
  delete (record as unknown as Record<string, unknown>).password_hash;
  delete (record as unknown as Record<string, unknown>).reset_token;
  delete (record as unknown as Record<string, unknown>).verify_token;
  return ok({ record });
});

export const DELETE = route(async () => {
  await clearSessionCookie();
  return ok({ success: true });
});
