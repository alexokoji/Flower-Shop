import { z } from "zod";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { stamps, toRecord } from "@/lib/db/serialize";
import { hashPassword, signSession, setSessionCookie } from "@/lib/auth/session";
import { ok, badRequest, fromZod, route } from "@/lib/api/respond";
import type { UserDoc } from "@/lib/db/types";

const schema = z
  .object({
    email: z.string().email("Enter a valid email").max(200),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    passwordConfirm: z.string().optional(),
    first_name: z.string().min(1, "Required").max(60),
    last_name: z.string().min(1, "Required").max(60),
    phone: z.string().max(32).optional().or(z.literal("")),
    marketing_opt_in: z.boolean().optional(),
  })
  .refine((d) => !d.passwordConfirm || d.password === d.passwordConfirm, {
    path: ["passwordConfirm"],
    message: "Passwords do not match",
  });

export const POST = route(async (req: Request) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);
  const body = parsed.data;

  const users = await coll<UserDoc>(C.users);
  const email = body.email.trim().toLowerCase();

  if (await users.findOne({ email })) {
    return badRequest("That email is already registered.", {
      email: { message: "Already registered" },
    });
  }

  // `role` is assigned here, never accepted from the request — signup can only
  // ever create a customer.
  const doc: UserDoc = {
    email,
    password_hash: await hashPassword(body.password),
    role: "customer",
    first_name: body.first_name.trim(),
    last_name: body.last_name.trim(),
    phone: body.phone || "",
    verified: false,
    marketing_opt_in: !!body.marketing_opt_in,
    preferred_currency: "USD",
    locale: "en",
    last_login_at: new Date(),
    ...stamps(),
  };

  const res = await users.insertOne(doc);
  const uid = String(res.insertedId);

  await setSessionCookie(await signSession({ uid, role: "customer", email }));

  const record = toRecord({ ...doc, _id: res.insertedId })!;
  delete (record as unknown as Record<string, unknown>).password_hash;
  return ok({ record });
});
