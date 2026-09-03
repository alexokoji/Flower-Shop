"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Package, Truck, User, MapPin, ShieldCheck, Loader2 } from "lucide-react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { pb, pbCall } from "@/lib/pb";
import { extractError } from "@/lib/errors";
import { formatPrice } from "@/lib/utils";
import { COUNTRIES } from "@/data";
import {
  PACKAGE_LABEL,
  SERVICE_BLURB,
  SERVICE_LABEL,
  volumetricKg,
  type PackageType,
  type ServiceType,
  type Shipment,
} from "@/lib/shipments";

const name = z.string().min(2, "Required").max(120);
const company = z.string().max(120).optional().or(z.literal(""));
const phone = z.string().min(6, "Required").max(32);
const email = z.string().email("Enter a valid email").optional().or(z.literal(""));
const street = z.string().min(4, "Required").max(240);
const city = z.string().min(2, "Required").max(80);
const region = z.string().max(80).optional().or(z.literal(""));
const postal = z.string().max(24).optional().or(z.literal(""));
const country = z.string().min(2, "Required").max(60);

const schema = z.object({
  reference: z.string().max(60).optional().or(z.literal("")),
  service_type: z.enum(["same_day", "overnight", "express", "standard", "economy", "freight"]),
  package_type: z.enum(["parcel", "envelope", "document", "box", "pallet", "crate"]),

  sender_name: name,
  sender_company: company,
  sender_phone: phone,
  sender_email: email,
  sender_address: street,
  sender_city: city,
  sender_state: region,
  sender_postal_code: postal,
  sender_country: country,

  receiver_name: name,
  receiver_company: company,
  receiver_phone: phone,
  receiver_email: email,
  receiver_address: street,
  receiver_city: city,
  receiver_state: region,
  receiver_postal_code: postal,
  receiver_country: country,

  pieces: z.coerce.number().int().min(1).max(999),
  weight_kg: z.coerce.number().min(0.01, "Enter a weight"),
  length_cm: z.coerce.number().min(0).optional(),
  width_cm: z.coerce.number().min(0).optional(),
  height_cm: z.coerce.number().min(0).optional(),
  contents: z.string().min(3, "Describe the contents").max(500),
  declared_value: z.coerce.number().min(0).optional(),

  fragile: z.boolean().optional(),
  insured: z.boolean().optional(),
  signature_required: z.boolean().optional(),

  payment_method: z.enum(["prepaid", "collect_on_delivery", "invoice"]),
  pickup_date: z.string().optional().or(z.literal("")),
  notes: z.string().max(1000).optional().or(z.literal("")),
});

type Form = z.infer<typeof schema>;

interface Quote {
  currency: string;
  volumetric_kg: number;
  chargeable_kg: number;
  is_international: boolean;
  shipping_cost: number;
  insurance_fee: number;
  tax_total: number;
  total_cost: number;
  transit_days: number;
}

const SERVICES: ServiceType[] = ["same_day", "overnight", "express", "standard", "economy", "freight"];
const PACKAGES: PackageType[] = ["parcel", "envelope", "document", "box", "pallet", "crate"];

export function ShipmentForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string>("");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoting, setQuoting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      service_type: "standard",
      package_type: "parcel",
      pieces: 1,
      payment_method: "prepaid",
      sender_country: "Nigeria",
      receiver_country: "Nigeria",
    },
  });

  const w = watch();

  // Local mirror of the server's volumetric rule, so the figure updates as the
  // customer types rather than waiting on the debounced quote.
  const localVolumetric = useMemo(
    () => volumetricKg(Number(w.length_cm) || 0, Number(w.width_cm) || 0, Number(w.height_cm) || 0, Number(w.pieces) || 1),
    [w.length_cm, w.width_cm, w.height_cm, w.pieces]
  );

  // Debounced live quote from /api/logistics/quote — the same pricing code that
  // runs on create, so the figure shown is the figure charged.
  useEffect(() => {
    const weight = Number(w.weight_kg);
    if (!weight || weight <= 0) {
      setQuote(null);
      return;
    }
    setQuoting(true);
    const t = setTimeout(async () => {
      try {
        const q = await pbCall<Quote>("/api/logistics/quote", {
          method: "POST",
          body: JSON.stringify({
            service_type: w.service_type,
            pieces: w.pieces,
            weight_kg: weight,
            length_cm: w.length_cm,
            width_cm: w.width_cm,
            height_cm: w.height_cm,
            declared_value: w.declared_value,
            insured: w.insured,
            fragile: w.fragile,
            signature_required: w.signature_required,
            sender_country: w.sender_country,
            receiver_country: w.receiver_country,
          }),
        });
        setQuote(q);
      } catch {
        setQuote(null);
      } finally {
        setQuoting(false);
      }
    }, 450);
    return () => clearTimeout(t);
  }, [
    w.service_type, w.pieces, w.weight_kg, w.length_cm, w.width_cm, w.height_cm,
    w.declared_value, w.insured, w.fragile, w.signature_required,
    w.sender_country, w.receiver_country,
  ]);

  const onSubmit = async (values: Form) => {
    setServerError("");
    const userId = pb().authStore.model?.id;
    if (!userId) {
      setServerError("Your session expired. Please sign in again.");
      return;
    }
    try {
      // Costs and the tracking code are set by the server hook — anything we
      // send for those fields is overwritten. The shipment starts as a draft:
      // it only goes live (and becomes publicly trackable) once paid.
      const created = await pb().collection("shipments").create<Shipment>({
        ...values,
        user: userId,
        status: "draft",
        pickup_date: values.pickup_date || null,
      });
      toast.success("Shipment saved. Complete payment to activate tracking.");
      router.push(`/account/shipments/${created.id}/pay`);
      router.refresh();
    } catch (err) {
      const e = extractError(err);
      setServerError(e.message);
      toast.error(e.message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="grid lg:grid-cols-[1fr_320px] gap-6 items-start">
      <div className="space-y-6 min-w-0">
        {/* ---------------- service ---------------- */}
        <Section icon={Truck} title="Service" subtitle="How fast should it move?">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {SERVICES.map((s) => {
              const active = w.service_type === s;
              return (
                <button
                  type="button"
                  key={s}
                  onClick={() => setValue("service_type", s, { shouldValidate: true })}
                  className={`text-left rounded-xl border p-3 transition-colors ${
                    active ? "border-accent bg-accent/10" : "border-border hover:border-accent/50"
                  }`}
                >
                  <p className="text-sm font-medium">{SERVICE_LABEL[s]}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug">{SERVICE_BLURB[s]}</p>
                </button>
              );
            })}
          </div>

          <div className="grid sm:grid-cols-3 gap-4 mt-5">
            <Field label="Package type" error={errors.package_type?.message}>
              <select {...register("package_type")} className={selectCls}>
                {PACKAGES.map((p) => (
                  <option key={p} value={p}>{PACKAGE_LABEL[p]}</option>
                ))}
              </select>
            </Field>
            <Field label="Your reference" hint="optional" error={errors.reference?.message}>
              <Input {...register("reference")} placeholder="PO-10294" />
            </Field>
            <Field label="Requested pickup" hint="optional" error={errors.pickup_date?.message}>
              <Input type="date" {...register("pickup_date")} />
            </Field>
          </div>
        </Section>

        {/* ---------------- sender ---------------- */}
        <PartyFields who="sender" title="Sender" subtitle="Where we collect from" register={register} errors={errors} />

        {/* ---------------- receiver ---------------- */}
        <PartyFields who="receiver" title="Receiver" subtitle="Where we deliver to" register={register} errors={errors} />

        {/* ---------------- package ---------------- */}
        <Section icon={Package} title="Package details" subtitle="Recorded on the waybill — the price is the same either way">
          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Pieces" error={errors.pieces?.message}>
              <Input type="number" min={1} step={1} {...register("pieces")} />
            </Field>
            <Field label="Actual weight (kg)" error={errors.weight_kg?.message}>
              <Input type="number" min={0.01} step="0.01" {...register("weight_kg")} placeholder="2.5" />
            </Field>
            <Field label="Declared value" hint="for insurance" error={errors.declared_value?.message}>
              <Input type="number" min={0} step="0.01" {...register("declared_value")} placeholder="0.00" />
            </Field>
            <Field label="Length (cm)" error={errors.length_cm?.message}>
              <Input type="number" min={0} step="0.1" {...register("length_cm")} />
            </Field>
            <Field label="Width (cm)" error={errors.width_cm?.message}>
              <Input type="number" min={0} step="0.1" {...register("width_cm")} />
            </Field>
            <Field label="Height (cm)" error={errors.height_cm?.message}>
              <Input type="number" min={0} step="0.1" {...register("height_cm")} />
            </Field>
          </div>

          {localVolumetric > 0 && (
            <p className="text-xs text-muted-foreground mt-3">
              Volumetric weight <strong>{localVolumetric} kg</strong> (L×W×H÷5000). Recorded on the
              waybill for handling — it does not affect what you pay.
            </p>
          )}

          <div className="mt-4">
            <Field label="Contents description" error={errors.contents?.message}>
              <textarea
                {...register("contents")}
                rows={3}
                className={`${selectCls} h-auto py-2.5 resize-y`}
                placeholder="2× ceramic vases, bubble-wrapped"
              />
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-3 mt-4">
            <Toggle label="Fragile handling" {...register("fragile")} />
            <Toggle label="Insure shipment" {...register("insured")} />
            <Toggle label="Signature required" {...register("signature_required")} />
          </div>
        </Section>

        {/* ---------------- billing ---------------- */}
        <Section icon={ShieldCheck} title="Billing & notes" subtitle="How this shipment is paid for">
          {/* No currency picker: the price and the currency it is charged in are
              both set by Veloxa in admin, so offering a choice here would be a
              control that does nothing. */}
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Payment method" error={errors.payment_method?.message}>
              <select {...register("payment_method")} className={selectCls}>
                <option value="prepaid">Prepaid</option>
                <option value="collect_on_delivery">Collect on delivery</option>
                <option value="invoice">Bill to account</option>
              </select>
            </Field>
          </div>
          <div className="mt-4">
            <Field label="Special instructions" hint="optional" error={errors.notes?.message}>
              <textarea
                {...register("notes")}
                rows={3}
                className={`${selectCls} h-auto py-2.5 resize-y`}
                placeholder="Call the receiver 30 minutes before arrival."
              />
            </Field>
          </div>
        </Section>
      </div>

      {/* ---------------- quote rail ---------------- */}
      <aside className="rounded-2xl border border-border bg-card shadow-soft p-5 lg:sticky lg:top-24 space-y-4">
        <div>
          <p className="eyebrow">Live quote</p>
          <h3 className="display text-xl mt-1">{SERVICE_LABEL[w.service_type ?? "standard"]}</h3>
        </div>

        {quote ? (
          <>
            {/* Deliberately no weight row: this price does not depend on it, and
                showing one here made the rate look weight-derived. */}
            <dl className="space-y-2 text-sm">
              <Row label="Flat shipping rate" value={formatPrice(quote.shipping_cost, quote.currency)} />
            </dl>
            <div className="border-t border-border pt-3 flex items-baseline justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="display text-xl">{formatPrice(quote.total_cost, quote.currency)}</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {quote.is_international ? "International" : "Domestic"} · estimated transit{" "}
              {quote.transit_days === 0 ? "same day" : `${quote.transit_days} days`}
            </p>
            <p className="text-xs text-muted-foreground">
              One flat rate per shipment, set by Veloxa. Weight, size, distance and
              handling options do not change it.
            </p>
          </>
        ) : (
          <p className="text-sm text-muted-foreground">
            {quoting ? "Pricing…" : "Enter a package weight to confirm your price."}
          </p>
        )}

        {serverError && <p className="text-sm text-destructive">{serverError}</p>}

        <Button type="submit" disabled={isSubmitting} className="w-full btn-gold">
          {isSubmitting ? <Loader2 className="size-4 animate-spin" /> : "Continue to payment"}
        </Button>
        <p className="text-[11px] text-muted-foreground leading-snug">
          One flat rate, set by Veloxa and confirmed server-side. Tracking goes live once payment is received.
        </p>
      </aside>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/* Small building blocks                                                      */
/* -------------------------------------------------------------------------- */

const selectCls =
  "flex h-11 w-full rounded-xl border border-input bg-card px-4 py-2 text-sm " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1";

function Section({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card shadow-soft p-5 lg:p-6">
      <header className="flex items-start gap-3 mb-5">
        <span className="size-9 rounded-full bg-accent/12 text-accent grid place-items-center shrink-0">
          <Icon className="size-4" />
        </span>
        <div>
          <h2 className="display text-lg leading-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">
        {label}
        {hint && <span className="text-muted-foreground font-normal"> · {hint}</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
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

const Toggle = ({ label, ...props }: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) => (
  <label className="flex items-center gap-2.5 rounded-xl border border-border px-3 py-2.5 cursor-pointer hover:border-accent/50 transition-colors">
    <input type="checkbox" className="size-4 accent-current text-accent" {...props} />
    <span className="text-sm">{label}</span>
  </label>
);

/* eslint-disable @typescript-eslint/no-explicit-any */
function PartyFields({
  who,
  title,
  subtitle,
  register,
  errors,
}: {
  who: "sender" | "receiver";
  title: string;
  subtitle: string;
  register: any;
  errors: any;
}) {
  const Icon = who === "sender" ? User : MapPin;
  const err = (f: string) => errors?.[`${who}_${f}`]?.message as string | undefined;
  return (
    <Section icon={Icon} title={title} subtitle={subtitle}>
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Full name" error={err("name")}>
          <Input {...register(`${who}_name`)} placeholder="Ada Obi" />
        </Field>
        <Field label="Company" hint="optional" error={err("company")}>
          <Input {...register(`${who}_company`)} />
        </Field>
        <Field label="Phone" error={err("phone")}>
          <Input {...register(`${who}_phone`)} placeholder="+234 801 234 5678" />
        </Field>
        <Field label="Email" hint="optional" error={err("email")}>
          <Input type="email" {...register(`${who}_email`)} />
        </Field>
      </div>
      <div className="mt-4">
        <Field label="Street address" error={err("address")}>
          <Input {...register(`${who}_address`)} placeholder="14 Adeola Odeku Street" />
        </Field>
      </div>
      <div className="grid sm:grid-cols-4 gap-4 mt-4">
        <Field label="City" error={err("city")}>
          <Input {...register(`${who}_city`)} />
        </Field>
        <Field label="State / region" hint="optional" error={err("state")}>
          <Input {...register(`${who}_state`)} />
        </Field>
        <Field label="Postal code" hint="optional" error={err("postal_code")}>
          <Input {...register(`${who}_postal_code`)} />
        </Field>
        <Field label="Country" error={err("country")}>
          <select {...register(`${who}_country`)} className={selectCls}>
            {COUNTRIES.map((c) => (
              <option key={c.iso2} value={c.name}>{c.name}</option>
            ))}
          </select>
        </Field>
      </div>
    </Section>
  );
}
