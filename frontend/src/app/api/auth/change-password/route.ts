import { z } from "zod";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { toObjectId, touch } from "@/lib/db/serialize";
import { hashPassword, verifyPassword, currentSession, clearSessionCookie } from "@/lib/auth/session";
import { ok, fail, fromZod, route, unauthorized } from "@/lib/api/respond";
import type { UserDoc } from "@/lib/db/types";

const schema = z
  .object({
    current: z.string().min(1, "Enter your current password"),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    passwordConfirm: z.string(),
  })
  .refine((d) => d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  });

export const POST = route(async (req: Request) => {
  const s = await currentSession();
  if (!s) return unauthorized();

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);

  const _id = toObjectId(s.uid);
  if (!_id) return unauthorized();

  const users = await coll<UserDoc>(C.users);
  const user = await users.findOne({ _id });
  if (!user) return unauthorized();

  if (!(await verifyPassword(parsed.data.current, user.password_hash))) {
    return fail(400, "Your current password is incorrect.", {
      current: { message: "Incorrect password" },
    });
  }

  await users.updateOne(
    { _id },
    { $set: { password_hash: await hashPassword(parsed.data.password), ...touch() } }
  );

  // Force a fresh sign-in so any other session with the old password is dropped.
  await clearSessionCookie();
  return ok({ success: true });
});
