"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Check, ExternalLink, Loader2, X } from "lucide-react";

import { pb, fileUrl } from "@/lib/pb";
import { extractError } from "@/lib/errors";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatDateTime, statusLabel, trackingUrl, type Shipment } from "@/lib/shipments";
import type { PbRecord } from "@/types";

interface LogisticsSettings extends PbRecord {
  key: string;
  bank_transfer_enabled: boolean;
  bank_name: string;
  bank_account_name: string;
  bank_account_number: string;
  bank_branch: string;
  bank_swift: string;
  bank_instructions: string;
  paymentpoint_enabled: boolean;
  paymentpoint_business_id: string;
  paymentpoint_api_key: string;
  paymentpoint_secret_key: string;
  paymentpoint_base_url: string;
  paymentpoint_bank_code: string;
  payment_currency: string;
  support_email: string;
  support_phone: string;
  shipment_flat_fee: number;
}

interface ShipmentPayment extends PbRecord {
  shipment: string;
  user: string;
  method: "paymentpoint" | "bank_transfer";
  status: "pending" | "awaiting_confirmation" | "paid" | "failed" | "cancelled";
  amount: number;
  currency: string;
  reference: string;
  payer_name: string;
  paid_from_bank: string;
  transfer_reference: string;
  proof: string;
  admin_note: string;
  paid_at: string;
  expand?: { shipment?: Shipment };
}

export default function AdminLogisticsPage() {
  const qc = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ["logistics-settings"],
    queryFn: async () =>
      pb().collection("logistics_settings").getFirstListItem<LogisticsSettings>('key = "default"'),
  });

  const { data: payments } = useQuery({
    queryKey: ["admin-shipment-payments"],
    queryFn: () =>
      pb().collection("shipment_payments").getFullList<ShipmentPayment>({
        sort: "-created",
        expand: "shipment",
      }),
  });

  const pending = payments?.filter((p) => p.status !== "paid" && p.status !== "cancelled") ?? [];
  const settled = payments?.filter((p) => p.status === "paid") ?? [];

  const decide = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "paid" | "cancelled" }) =>
      pb().collection("shipment_payments").update(id, {
        status,
        paid_at: status === "paid" ? new Date().toISOString() : "",
      }),
    onSuccess: (_d, v) => {
      toast.success(v.status === "paid" ? "Payment confirmed — shipment activated." : "Payment cancelled.");
      qc.invalidateQueries({ queryKey: ["admin-shipment-payments"] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  return (
    <div className="space-y-8">
      <div>
        <h1 className="display text-display-sm">Veloxa Logistics</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Payment details customers see, and confirmation of incoming transfers.
        </p>
      </div>

      {/* ------------------------- payments queue ------------------------- */}
      <section className="rounded-2xl border border-border bg-card shadow-soft p-6">
        <h2 className="display text-lg mb-1">Awaiting confirmation</h2>
        <p className="text-xs text-muted-foreground mb-5">
          Confirming a payment activates the shipment and makes it publicly trackable.
        </p>

        {!pending.length ? (
          <p className="text-sm text-muted-foreground">Nothing waiting. Everything is settled.</p>
        ) : (
          <ul className="space-y-3">
            {pending.map((p) => (
              <li key={p.id} className="rounded-xl border border-border p-4">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium tracking-wider">
                      {p.expand?.shipment?.tracking_code ?? p.reference}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 capitalize">
                      {p.method.replace(/_/g, " ")} · {p.status.replace(/_/g, " ")} ·{" "}
                      {formatDateTime(p.created)}
                    </p>
                    {p.payer_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Paid by {p.payer_name}
                        {p.paid_from_bank ? ` (${p.paid_from_bank})` : ""}
                        {p.transfer_reference ? ` · ref ${p.transfer_reference}` : ""}
                      </p>
                    )}
                    {p.admin_note && <p className="text-xs text-destructive mt-1">{p.admin_note}</p>}
                    <div className="flex gap-3 mt-2">
                      {p.proof && (
                        <a
                          href={fileUrl(p, p.proof)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-accent inline-flex items-center gap-1"
                        >
                          <ExternalLink className="size-3" /> View proof
                        </a>
                      )}
                      {p.expand?.shipment && (
                        <a
                          href={trackingUrl(p.expand.shipment.tracking_code)}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-muted-foreground inline-flex items-center gap-1"
                        >
                          <ExternalLink className="size-3" /> Tracking page
                        </a>
                      )}
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="display text-lg">{formatPrice(p.amount, p.currency)}</p>
                    <div className="flex gap-2 mt-2">
                      <button
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ id: p.id, status: "paid" })}
                        className="btn-gold !text-xs inline-flex items-center gap-1.5"
                      >
                        <Check className="size-3.5" /> Confirm
                      </button>
                      <button
                        disabled={decide.isPending}
                        onClick={() => decide.mutate({ id: p.id, status: "cancelled" })}
                        className="btn-outline-gold !text-xs inline-flex items-center gap-1.5"
                      >
                        <X className="size-3.5" /> Reject
                      </button>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------- settings ------------------------- */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading settings…</p>
      ) : settings ? (
        <SettingsForm settings={settings} />
      ) : (
        <p className="text-sm text-destructive">
          No settings row found. Run `npm run db:seed`, then reload.
        </p>
      )}

      {/* ------------------------- settled ------------------------- */}
      {settled.length > 0 && (
        <section className="rounded-2xl border border-border bg-card shadow-soft p-6">
          <h2 className="display text-lg mb-4">Settled payments</h2>
          <ul className="divide-y divide-border">
            {settled.slice(0, 20).map((p) => (
              <li key={p.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm tracking-wider">
                    {p.expand?.shipment?.tracking_code ?? p.reference}
                  </p>
                  <p className="text-xs text-muted-foreground capitalize">
                    {p.method.replace(/_/g, " ")} · {formatDateTime(p.paid_at || p.updated)}
                  </p>
                </div>
                {p.expand?.shipment && (
                  <span className="text-xs text-muted-foreground">
                    {statusLabel(p.expand.shipment.status)}
                  </span>
                )}
                <p className="text-sm">{formatPrice(p.amount, p.currency)}</p>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function SettingsForm({ settings }: { settings: LogisticsSettings }) {
  const qc = useQueryClient();
  const [form, setForm] = useState(settings);

  useEffect(() => setForm(settings), [settings]);

  const save = useMutation({
    mutationFn: async () => {
      const { id, collectionId, collectionName, created, updated, ...rest } = form;
      void id; void collectionId; void collectionName; void created; void updated;
      return pb().collection("logistics_settings").update(settings.id, rest);
    },
    onSuccess: () => {
      toast.success("Payment settings saved.");
      qc.invalidateQueries({ queryKey: ["logistics-settings"] });
    },
    onError: (err) => toast.error(extractError(err).message),
  });

  const set = <K extends keyof LogisticsSettings>(k: K, v: LogisticsSettings[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  return (
    <div className="grid lg:grid-cols-2 gap-6 items-start">
      {/* bank transfer */}
      <section className="rounded-2xl border border-border bg-card shadow-soft p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="display text-lg">Bank transfer</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Shown to customers who choose to pay by transfer.
            </p>
          </div>
          <Switch
            checked={!!form.bank_transfer_enabled}
            onChange={(v) => set("bank_transfer_enabled", v)}
          />
        </div>

        <Field label="Bank name">
          <Input value={form.bank_name ?? ""} onChange={(e) => set("bank_name", e.target.value)} />
        </Field>
        <Field label="Account name">
          <Input
            value={form.bank_account_name ?? ""}
            onChange={(e) => set("bank_account_name", e.target.value)}
          />
        </Field>
        <Field label="Account number">
          <Input
            value={form.bank_account_number ?? ""}
            onChange={(e) => set("bank_account_number", e.target.value)}
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Branch · optional">
            <Input value={form.bank_branch ?? ""} onChange={(e) => set("bank_branch", e.target.value)} />
          </Field>
          <Field label="SWIFT / BIC · optional">
            <Input value={form.bank_swift ?? ""} onChange={(e) => set("bank_swift", e.target.value)} />
          </Field>
        </div>
        <Field label="Instructions to the customer">
          <textarea
            rows={3}
            value={form.bank_instructions ?? ""}
            onChange={(e) => set("bank_instructions", e.target.value)}
            className="w-full rounded-xl border border-input bg-card px-4 py-2.5 text-sm resize-y"
          />
        </Field>
      </section>

      {/* paymentpoint */}
      <section className="rounded-2xl border border-border bg-card shadow-soft p-6 space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="display text-lg">PaymentPoint</h2>
            <p className="text-xs text-muted-foreground mt-1">
              Issues a one-time virtual account per shipment and confirms by webhook.
            </p>
          </div>
          <Switch
            checked={!!form.paymentpoint_enabled}
            onChange={(v) => set("paymentpoint_enabled", v)}
          />
        </div>

        <Field label="Business ID">
          <Input
            value={form.paymentpoint_business_id ?? ""}
            onChange={(e) => set("paymentpoint_business_id", e.target.value)}
          />
        </Field>
        <Field label="API key">
          <Input
            type="password"
            value={form.paymentpoint_api_key ?? ""}
            onChange={(e) => set("paymentpoint_api_key", e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <Field label="Secret key · verifies webhooks">
          <Input
            type="password"
            value={form.paymentpoint_secret_key ?? ""}
            onChange={(e) => set("paymentpoint_secret_key", e.target.value)}
            placeholder="••••••••"
          />
        </Field>
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="API base URL">
            <Input
              value={form.paymentpoint_base_url ?? ""}
              onChange={(e) => set("paymentpoint_base_url", e.target.value)}
            />
          </Field>
          <Field label="Bank code · optional">
            <Input
              value={form.paymentpoint_bank_code ?? ""}
              onChange={(e) => set("paymentpoint_bank_code", e.target.value)}
            />
          </Field>
        </div>

        <p className="text-[11px] text-muted-foreground leading-snug">
          Webhook URL to register with PaymentPoint:{" "}
          <code className="break-all">
            {(process.env.NEXT_PUBLIC_PB_URL ?? "http://localhost:8090")}/api/webhooks/paymentpoint
          </code>
          . Keys set as <code>PAYMENTPOINT_API_KEY</code> / <code>PAYMENTPOINT_SECRET_KEY</code>{" "}
          environment variables take precedence over the values stored here.
        </p>
      </section>

      {/* general */}
      <section className="rounded-2xl border border-border bg-card shadow-soft p-6 space-y-4 lg:col-span-2">
        <h2 className="display text-lg">General</h2>

        <div className="rounded-xl border border-accent/40 bg-accent/5 p-4">
          <div className="grid sm:grid-cols-[220px_1fr] gap-4 items-start">
            <Field label="Shipment price">
              <Input
                type="number"
                min={0}
                step="0.01"
                value={form.shipment_flat_fee ?? 0}
                onChange={(e) => set("shipment_flat_fee", Number(e.target.value))}
              />
            </Field>
            <p className="text-xs text-muted-foreground sm:pt-7 leading-relaxed">
              Every shipment costs this, whatever it weighs or wherever it goes. Customers see it as
              the total on the booking form and pay exactly this amount — there are no weight,
              insurance or tax surcharges on top. Changing it affects new bookings only; shipments
              already created keep the price they were quoted.
            </p>
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-4">
          <Field label="Default payment currency">
            <Input
              maxLength={3}
              value={form.payment_currency ?? ""}
              onChange={(e) => set("payment_currency", e.target.value.toUpperCase())}
            />
          </Field>
          <Field label="Support email">
            <Input
              type="email"
              value={form.support_email ?? ""}
              onChange={(e) => set("support_email", e.target.value)}
            />
          </Field>
          <Field label="Support phone">
            <Input
              value={form.support_phone ?? ""}
              onChange={(e) => set("support_phone", e.target.value)}
            />
          </Field>
        </div>

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="btn-gold">
            {save.isPending ? <Loader2 className="size-4 animate-spin" /> : "Save settings"}
          </Button>
          <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground">
            Back to dashboard
          </Link>
        </div>
      </section>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}

function Switch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`h-6 w-11 rounded-full transition-colors shrink-0 ${
        checked ? "bg-roseGold" : "bg-muted"
      }`}
    >
      <span
        className={`block size-5 rounded-full bg-white shadow transition-transform ${
          checked ? "translate-x-5" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}
