import { z } from "zod";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toRecord, touch } from "@/lib/db/serialize";
import { verifyPassword, signSession, setSessionCookie } from "@/lib/auth/session";
import { ok, fail, fromZod, route } from "@/lib/api/respond";
import type { UserDoc } from "@/lib/db/types";

const schema = z.object({
  // Named `identity` to match PocketBase's authWithPassword payload.
  identity: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

export const POST = route(async (req: Request) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);

  const email = parsed.data.identity.trim().toLowerCase();
  const users = await coll<UserDoc>(C.users);
  const user = await users.findOne({ email });

  // One message for both branches, and the hash comparison still runs when the
  // user is missing, so response timing does not reveal which emails exist.
  const okPassword = user
    ? await verifyPassword(parsed.data.password, user.password_hash)
    : await verifyPassword(parsed.data.password, "$2a$12$invalidinvalidinvalidinvalidinvalidinvalidinvalidinvalidin");

  if (!user || !okPassword) {
    return fail(400, "Failed to authenticate.");
  }

  const uid = String(user._id);
  await users.updateOne({ _id: user._id }, { $set: { last_login_at: new Date(), ...touch() } });
  await setSessionCookie(await signSession({ uid, role: user.role, email: user.email }));

  const record = toRecord(user)!;
  delete (record as unknown as Record<string, unknown>).password_hash;
  return ok({ record });
});
