import { z } from "zod";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { touch } from "@/lib/db/serialize";
import { hashPassword } from "@/lib/auth/session";
import { ok, fail, fromZod, route } from "@/lib/api/respond";
import type { UserDoc } from "@/lib/db/types";

const schema = z
  .object({
    token: z.string().min(10, "Invalid reset link"),
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
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);

  const users = await coll<UserDoc>(C.users);
  // Expiry is part of the query, so a stale token simply matches nothing.
  const user = await users.findOne({
    reset_token: parsed.data.token,
    reset_expires: { $gt: new Date() },
  });

  if (!user) {
    return fail(400, "This reset link is invalid or has expired.");
  }

  await users.updateOne(
    { _id: user._id },
    {
      $set: { password_hash: await hashPassword(parsed.data.password), ...touch() },
      // Burn the token so the link cannot be replayed.
      $unset: { reset_token: "", reset_expires: "" },
    }
  );

  return ok({ success: true });
});
