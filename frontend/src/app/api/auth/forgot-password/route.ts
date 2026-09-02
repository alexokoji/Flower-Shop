import { z } from "zod";
import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { touch } from "@/lib/db/serialize";
import { randomToken } from "@/lib/auth/session";
import { ok, fromZod, route } from "@/lib/api/respond";
import type { UserDoc } from "@/lib/db/types";

const schema = z.object({ email: z.string().email() });

/**
 * Issues a single-use reset token valid for one hour.
 *
 * PocketBase sent this email itself; there is no mail transport in this stack
 * yet, so the token is stored and the delivery step is left to be wired up
 * (Resend/SES/Postmark). The response is deliberately identical whether or not
 * the address exists, so this cannot be used to enumerate accounts.
 */
export const POST = route(async (req: Request) => {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return fromZod(parsed.error);

  const email = parsed.data.email.trim().toLowerCase();
  const users = await coll<UserDoc>(C.users);
  const user = await users.findOne({ email });

  if (user) {
    const token = randomToken();
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          reset_token: token,
          reset_expires: new Date(Date.now() + 60 * 60 * 1000),
          ...touch(),
        },
      }
    );

    const link = `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/reset-password?token=${token}`;
    if (process.env.NODE_ENV !== "production") {
      console.log(`[auth] password reset for ${email}: ${link}`);
    } else {
      // TODO: send this through the transactional mail provider.
      console.warn(`[auth] reset token issued for ${email} but no mailer is configured.`);
    }
  }

  return ok({ success: true });
});
