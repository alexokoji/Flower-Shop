import { coll } from "@/lib/db/mongo";
import { C } from "@/lib/db/collections";
import { currentSession } from "@/lib/auth/session";
import { ok, unauthorized, route } from "@/lib/api/respond";
import type { LogisticsSettingsDoc } from "@/lib/db/types";

/**
 * GET /api/logistics/payment-methods — the customer-safe view of the admin
 * payment configuration.
 *
 * `logistics_settings` holds the PaymentPoint API and secret keys, so the row
 * is never returned wholesale. Only the fields a customer needs in order to pay
 * are copied out, field by field.
 */
export const GET = route(async () => {
  const s = await currentSession();
  if (!s) return unauthorized("Sign in to view payment options.");

  const settings = await coll<LogisticsSettingsDoc>(C.logisticsSettings);
  const cfg = await settings.findOne({ key: "default" });

  if (!cfg) {
    return ok({ bank_transfer: { enabled: false }, paymentpoint: { enabled: false } });
  }

  const bankEnabled = !!cfg.bank_transfer_enabled && !!cfg.bank_account_number;
  const ppEnabled =
    !!cfg.paymentpoint_enabled &&
    !!(process.env.PAYMENTPOINT_API_KEY || cfg.paymentpoint_api_key);

  return ok({
    currency: cfg.payment_currency || "NGN",
    support_email: cfg.support_email || "",
    support_phone: cfg.support_phone || "",
    bank_transfer: bankEnabled
      ? {
          enabled: true,
          bank_name: cfg.bank_name,
          account_name: cfg.bank_account_name,
          account_number: cfg.bank_account_number,
          branch: cfg.bank_branch,
          swift: cfg.bank_swift,
          instructions: cfg.bank_instructions,
        }
      : { enabled: false },
    paymentpoint: { enabled: ppEnabled },
  });
});
