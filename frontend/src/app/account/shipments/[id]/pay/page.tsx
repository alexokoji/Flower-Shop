"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  ArrowLeft,
  Banknote,
  BadgeCheck,
  Building2,
  Check,
  Clock,
  Copy,
  Loader2,
  Upload,
} from "lucide-react";

import { pb, pbCall } from "@/lib/pb";
import { extractError } from "@/lib/errors";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SERVICE_LABEL, type Shipment } from "@/lib/shipments";

interface PaymentMethods {
  currency: string;
  support_email: string;
  support_phone: string;
  bank_transfer:
    | {
        enabled: true;
        bank_name: string;
        account_name: string;
        account_number: string;
        branch?: string;
        swift?: string;
        instructions?: string;
      }
    | { enabled: false }
    | null;
  paymentpoint: { enabled: boolean };
}

interface PaySession {
  payment_id: string;
  method: "paymentpoint" | "bank_transfer";
  status: string;
  amount: number;
  currency: string;
  reference: string;
  bank?: {
    bank_name: string;
    account_name: string;
    account_number: string;
    branch?: string;
    swift?: string;
    instructions?: string;
  };
  virtual_account?: { bank_name: string; account_name: string; account_number: string };
}

export default function ShipmentPayPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();

  const [session, setSession] = useState<PaySession | null>(null);
  const [starting, setStarting] = useState<"paymentpoint" | "bank_transfer" | null>(null);

  const { data: shipment, isLoading } = useQuery({
    queryKey: ["shipment", id],
    queryFn: () => pb().collection("shipments").getOne<Shipment>(id),
    // While a PaymentPoint transfer is in flight the webhook flips this to
    // paid, so poll until it does.
    refetchInterval: (q) =>
      (q.state.data as Shipment | undefined)?.payment_status === "paid" ? false : 8000,
  });

  const { data: methods } = useQuery({
    queryKey: ["logistics-payment-methods"],
    queryFn: () => pbCall<PaymentMethods>("/api/logistics/payment-methods"),
  });

  const paid = shipment?.payment_status === "paid";

  useEffect(() => {
    if (paid) {
      qc.invalidateQueries({ queryKey: ["shipments"] });
    }
  }, [paid, qc]);

  if (isLoading) return <p className="text-sm text-muted-foreground">Loading…</p>;
  if (!shipment) return <p className="text-sm text-muted-foreground">Shipment not found.</p>;

  const start = async (method: "paymentpoint" | "bank_transfer") => {
    setStarting(method);
    try {
      const s = await pbCall<PaySession>("/api/logistics/pay", {
        method: "POST",
        body: JSON.stringify({ shipment_id: shipment.id, method }),
      });
      setSession(s);
    } catch (err) {
      toast.error(extractError(err).message);
    } finally {
      setStarting(null);
    }
  };

  /* ---------------------------------------------------------------- paid */
  if (paid) {
    return (
      <div className="space-y-6">
        <section className="rounded-2xl border border-border bg-card shadow-soft p-10 text-center">
          <BadgeCheck className="size-10 mx-auto text-success" />
          <h2 className="display text-display-sm mt-4">Payment confirmed</h2>
          <p className="text-sm text-muted-foreground mt-2">
            Your shipment is live. Tracking number{" "}
            <strong className="tracking-wider">{shipment.tracking_code}</strong>
          </p>
          <div className="flex flex-wrap justify-center gap-2 mt-6">
            <Link href={`/account/shipments/${shipment.id}`} className="btn-gold !text-xs">
              View shipment
            </Link>
            <Link
              href={`/account/shipments/${shipment.id}/receipt`}
              className="btn-outline-gold !text-xs"
            >
              Get receipt
            </Link>
          </div>
        </section>
      </div>
    );
  }

  /* -------------------------------------------------------------- unpaid */
  const bank = methods?.bank_transfer?.enabled ? methods.bank_transfer : null;
  const ppEnabled = !!methods?.paymentpoint?.enabled;

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/account/shipments"
          className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="size-3.5" /> All shipments
        </Link>
        <h2 className="display text-xl mt-2">Pay for your shipment</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Tracking goes live on Veloxa as soon as your payment is confirmed.
        </p>
      </div>

      <div className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
        <div className="space-y-6 min-w-0">
          {!session ? (
            <section className="rounded-2xl border border-border bg-card shadow-soft p-6">
              <h3 className="display text-lg mb-1">Choose how to pay</h3>
              <p className="text-xs text-muted-foreground mb-5">
                Both options settle to Veloxa. Transfers are confirmed automatically where supported.
              </p>

              <div className="grid sm:grid-cols-2 gap-4">
                <MethodCard
                  icon={Banknote}
                  title="PaymentPoint"
                  blurb="Get a one-time account number. Your transfer is confirmed automatically, usually within minutes."
                  disabled={!ppEnabled}
                  disabledNote="Currently unavailable"
                  loading={starting === "paymentpoint"}
                  onClick={() => start("paymentpoint")}
                />
                <MethodCard
                  icon={Building2}
                  title="Bank transfer"
                  blurb="Transfer to the Veloxa company account and upload your receipt. Confirmed by our team."
                  disabled={!bank}
                  disabledNote="Currently unavailable"
                  loading={starting === "bank_transfer"}
                  onClick={() => start("bank_transfer")}
                />
              </div>

              {!ppEnabled && !bank && (
                <p className="text-sm text-destructive mt-5">
                  No payment method is configured yet. Please contact support
                  {methods?.support_email ? ` at ${methods.support_email}` : ""}.
                </p>
              )}
            </section>
          ) : session.method === "paymentpoint" ? (
            <VirtualAccountPanel session={session} onBack={() => setSession(null)} />
          ) : (
            <BankTransferPanel
              session={session}
              onBack={() => setSession(null)}
              onDeclared={() => {
                qc.invalidateQueries({ queryKey: ["shipment", id] });
                router.push(`/account/shipments/${id}`);
              }}
            />
          )}
        </div>

        {/* summary rail */}
        <aside className="rounded-2xl border border-border bg-card shadow-soft p-5 lg:sticky lg:top-24 space-y-3">
          <p className="eyebrow">Shipment</p>
          <p className="display text-xl tracking-wider">{shipment.tracking_code}</p>
          <p className="text-xs text-muted-foreground">
            {SERVICE_LABEL[shipment.service_type] ?? shipment.service_type} ·{" "}
            {shipment.chargeable_kg || shipment.weight_kg} kg
          </p>
          <p className="text-sm text-muted-foreground">
            {shipment.sender_city} → {shipment.receiver_city}, {shipment.receiver_country}
          </p>

          <dl className="space-y-2 text-sm border-t border-border pt-3 mt-3">
            <Row label="Shipping" value={formatPrice(shipment.shipping_cost, shipment.currency)} />
            {shipment.insurance_fee > 0 && (
              <Row label="Insurance" value={formatPrice(shipment.insurance_fee, shipment.currency)} />
            )}
            {shipment.tax_total > 0 && (
              <Row label="Tax" value={formatPrice(shipment.tax_total, shipment.currency)} />
            )}
          </dl>
          <div className="border-t border-border pt-3 flex items-baseline justify-between">
            <span className="text-sm text-muted-foreground">Due now</span>
            <span className="display text-xl">
              {formatPrice(shipment.total_cost, shipment.currency)}
            </span>
          </div>
        </aside>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function VirtualAccountPanel({ session, onBack }: { session: PaySession; onBack: () => void }) {
  const va = session.virtual_account;
  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft p-6 space-y-5">
      <div>
        <p className="eyebrow">PaymentPoint</p>
        <h3 className="display text-lg mt-1">Transfer to this account</h3>
        <p className="text-xs text-muted-foreground mt-1">
          This account is issued for this shipment only. We confirm your payment automatically — keep this
          page open.
        </p>
      </div>

      <dl className="rounded-xl border border-border divide-y divide-border">
        <CopyRow label="Bank" value={va?.bank_name ?? "—"} />
        <CopyRow label="Account name" value={va?.account_name ?? "—"} />
        <CopyRow label="Account number" value={va?.account_number ?? "—"} mono />
        <CopyRow label="Amount" value={formatPrice(session.amount, session.currency)} />
        <CopyRow label="Narration" value={session.reference} mono />
      </dl>

      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <Clock className="size-4 animate-pulse text-accent" />
        Waiting for your transfer…
      </p>

      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
        ← Use a different method
      </button>
    </section>
  );
}

function BankTransferPanel({
  session,
  onBack,
  onDeclared,
}: {
  session: PaySession;
  onBack: () => void;
  onDeclared: () => void;
}) {
  const [payerName, setPayerName] = useState("");
  const [bankName, setBankName] = useState("");
  const [ref, setRef] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const bank = session.bank;

  const submit = async () => {
    if (!payerName.trim()) {
      toast.error("Enter the name the transfer was sent from.");
      return;
    }
    setBusy(true);
    try {
      if (file) {
        const fd = new FormData();
        fd.append("proof", file);
        await pb().collection("shipment_payments").update(session.payment_id, fd);
      }
      await pbCall("/api/logistics/pay/declare", {
        method: "POST",
        body: JSON.stringify({
          payment_id: session.payment_id,
          payer_name: payerName,
          bank: bankName,
          transfer_reference: ref,
        }),
      });
      toast.success("Thank you — we'll confirm your transfer and activate tracking.");
      onDeclared();
    } catch (err) {
      toast.error(extractError(err).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft p-6 space-y-5">
      <div>
        <p className="eyebrow">Bank transfer</p>
        <h3 className="display text-lg mt-1">Transfer to Veloxa</h3>
      </div>

      <dl className="rounded-xl border border-border divide-y divide-border">
        <CopyRow label="Bank" value={bank?.bank_name ?? "—"} />
        <CopyRow label="Account name" value={bank?.account_name ?? "—"} />
        <CopyRow label="Account number" value={bank?.account_number ?? "—"} mono />
        {bank?.swift && <CopyRow label="SWIFT" value={bank.swift} mono />}
        <CopyRow label="Amount" value={formatPrice(session.amount, session.currency)} />
        <CopyRow label="Narration" value={session.reference} mono />
      </dl>

      {bank?.instructions && <p className="text-xs text-muted-foreground">{bank.instructions}</p>}

      <div className="border-t border-border pt-5 space-y-4">
        <p className="text-sm font-medium">Already transferred? Tell us.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs">Name on the account you paid from</Label>
            <Input value={payerName} onChange={(e) => setPayerName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Your bank</Label>
            <Input value={bankName} onChange={(e) => setBankName(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Transfer reference</Label>
            <Input value={ref} onChange={(e) => setRef(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Proof of payment · optional</Label>
            <label className="flex h-11 items-center gap-2 rounded-md border border-input px-4 text-sm cursor-pointer hover:border-accent/50">
              <Upload className="size-4 text-muted-foreground" />
              <span className="truncate">{file ? file.name : "Upload receipt (PNG, JPG, PDF)"}</span>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
          </div>
        </div>

        <Button type="button" className="btn-gold" disabled={busy} onClick={submit}>
          {busy ? <Loader2 className="size-4 animate-spin" /> : "I have made this transfer"}
        </Button>
        <p className="text-[11px] text-muted-foreground">
          Our team confirms transfers manually. Tracking activates the moment it clears.
        </p>
      </div>

      <button onClick={onBack} className="text-xs text-muted-foreground hover:text-foreground">
        ← Use a different method
      </button>
    </section>
  );
}

function MethodCard({
  icon: Icon,
  title,
  blurb,
  disabled,
  disabledNote,
  loading,
  onClick,
}: {
  icon: React.ElementType;
  title: string;
  blurb: string;
  disabled?: boolean;
  disabledNote?: string;
  loading?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      onClick={onClick}
      className={`text-left rounded-xl border p-4 transition-colors ${
        disabled
          ? "border-border opacity-50 cursor-not-allowed"
          : "border-border hover:border-accent hover:bg-accent/5"
      }`}
    >
      <span className="size-9 rounded-full bg-accent/12 text-accent grid place-items-center">
        {loading ? <Loader2 className="size-4 animate-spin" /> : <Icon className="size-4" />}
      </span>
      <p className="text-sm font-medium mt-3">{title}</p>
      <p className="text-xs text-muted-foreground mt-1 leading-snug">
        {disabled ? disabledNote : blurb}
      </p>
    </button>
  );
}

function CopyRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="flex items-center gap-2 min-w-0">
        <span className={`text-sm truncate ${mono ? "tracking-wider" : ""}`}>{value}</span>
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(value);
              setCopied(true);
              setTimeout(() => setCopied(false), 1500);
            } catch {
              toast.error("Could not copy.");
            }
          }}
          className="text-muted-foreground hover:text-foreground shrink-0"
          aria-label={`Copy ${label}`}
        >
          {copied ? <Check className="size-3.5" /> : <Copy className="size-3.5" />}
        </button>
      </dd>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
