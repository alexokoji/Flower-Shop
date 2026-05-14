"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { Loader2, Lock } from "lucide-react";

import { useAuth } from "@/stores/auth";
import { useCart } from "@/stores/cart";
import { COUNTRIES } from "@/data";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CartLine } from "@/components/cart/cart-line";
import { OrderSummary } from "@/components/cart/order-summary";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { placeOrder, estimateShipping } from "@/lib/checkout";
import { extractError } from "@/lib/errors";
import { pb } from "@/lib/pb";
import type { Address } from "@/types";
import {
  payWithPaystack, payWithFlutterwave, payWithMonnify,
  usePaymentSdk, type Provider,
} from "@/lib/payments";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  phone: z.string().min(4, "Phone is required").max(32),
  first_name: z.string().min(1, "Required").max(60),
  last_name: z.string().min(1, "Required").max(60),
  country_iso2: z.string().length(2),
  state: z.string().min(1, "Required").max(80),
  city: z.string().min(1, "Required").max(80),
  street_address: z.string().min(1, "Required").max(191),
  apartment: z.string().max(60).optional().or(z.literal("")),
  postal_code: z.string().max(24).optional().or(z.literal("")),
  landmark: z.string().max(120).optional().or(z.literal("")),
  shipping_method: z.enum(["standard", "express"]),
  customer_notes: z.string().max(2000).optional().or(z.literal("")),
});
type Form = z.infer<typeof schema>;

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const user = useAuth((s) => s.user);

  const [provider, setProvider] = useState<Provider>("paystack");
  const [shippingFee, setShippingFee] = useState<number | null>(null);
  const [deliveryDays, setDeliveryDays] = useState<string>("");
  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});
  const [submitting, setSubmitting] = useState(false);
  const sdkStatus = usePaymentSdk(provider);

  const { register, handleSubmit, watch, reset, formState: { errors } } = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { shipping_method: "standard", country_iso2: "US" },
  });

  // Prefill from saved address + user profile if available.
  const savedAddresses = useQuery({
    queryKey: ["addresses", user?.id],
    enabled: !!user,
    queryFn: () => pb().collection("addresses").getFullList<Address>({ filter: `user = "${user!.id}"`, sort: "-is_default_shipping" }),
  });

  useEffect(() => {
    if (!user) return;
    const def = savedAddresses.data?.find((a) => a.is_default_shipping) ?? savedAddresses.data?.[0];
    reset({
      email: user.email,
      phone: user.phone ?? def?.phone ?? "",
      first_name: def?.first_name ?? user.first_name,
      last_name: def?.last_name ?? user.last_name,
      country_iso2: def?.country_iso2 ?? "US",
      state: def?.state ?? "",
      city: def?.city ?? "",
      street_address: def?.street_address ?? "",
      apartment: def?.apartment ?? "",
      postal_code: def?.postal_code ?? "",
      landmark: def?.landmark ?? "",
      shipping_method: "standard",
      customer_notes: "",
    });
  }, [user, savedAddresses.data, reset]);

  const country = watch("country_iso2");
  const method = watch("shipping_method");

  // Re-estimate shipping when address or method changes
  useEffect(() => {
    if (!country || cart.items.length === 0) return;
    const t = setTimeout(async () => {
      try {
        const res = await estimateShipping(
          country, method,
          cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        );
        if (res.eligible) {
          setShippingFee(res.fee ?? 0);
          setDeliveryDays(res.delivery_days ?? "");
        } else {
          setShippingFee(null);
          toast.error(res.reason ?? "Cannot ship to that country.");
        }
      } catch {/* ignore */}
    }, 250);
    return () => clearTimeout(t);
  }, [country, method, cart.items]);

  const grand = useMemo(() => cart.subtotal() + (shippingFee ?? 0), [cart, shippingFee]);

  if (cart.items.length === 0) {
    return (
      <div className="container-edge py-20 text-center surface-luxe">
        <p className="display-serif text-2xl">Your cart is empty</p>
        <Button className="mt-4" onClick={() => router.push("/shop")}>Go to shop</Button>
      </div>
    );
  }

  async function onSubmit(values: Form) {
    setServerError({});
    setSubmitting(true);
    try {
      if (sdkStatus !== "ready") {
        toast.error("Payment SDK still loading, please try again.");
        return;
      }

      // 1. Create the order server-side (authoritative totals)
      const addressBlock = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone,
        country_iso2: values.country_iso2,
        state: values.state,
        city: values.city,
        street_address: values.street_address,
        apartment: values.apartment || "",
        postal_code: values.postal_code || "",
        landmark: values.landmark || "",
      };

      const order = await placeOrder({
        items: cart.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity })),
        currency: cart.currency,
        coupon_code: cart.couponCode ?? undefined,
        shipping: {
          country_iso2: values.country_iso2,
          method: values.shipping_method,
          address: addressBlock,
        },
        billing: addressBlock,
        customer_notes: values.customer_notes || undefined,
        guest: user ? undefined : {
          email: values.email, phone: values.phone,
          first_name: values.first_name, last_name: values.last_name,
        },
      });

      // 2. Hand off to the chosen payment provider
      const payParams = {
        email: values.email,
        amount: order.grand_total,
        currency: order.currency,
        reference: order.order_number,
        customer: {
          first_name: values.first_name,
          last_name: values.last_name,
          phone: values.phone,
        },
        onSuccess: () => {
          cart.clear();
          router.push(`/checkout/success?order=${order.order_number}`);
        },
        onClose: () => setSubmitting(false),
      };

      if (provider === "paystack") payWithPaystack(payParams);
      else if (provider === "flutterwave") payWithFlutterwave(payParams);
      else payWithMonnify(payParams);
    } catch (err) {
      setServerError(extractError(err));
      setSubmitting(false);
    }
  }

  return (
    <div className="container-edge py-10 lg:py-14">
      <header className="mb-8">
        <p className="eyebrow">Final step</p>
        <h1 className="display-serif text-4xl lg:text-5xl mt-2">Checkout</h1>
        {!user && (
          <p className="text-sm text-muted-foreground mt-2">
            Checking out as a guest — <a href="/login?next=/checkout" className="underline underline-offset-4 hover:text-roseGold">sign in</a> to save your details.
          </p>
        )}
      </header>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid lg:grid-cols-[1fr_400px] gap-10">
        <div className="space-y-8">
          <section className="surface-luxe p-6 lg:p-8 space-y-4">
            <h2 className="display-serif text-2xl">Contact</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Email" id="email" type="email" register={register("email")} error={errors.email?.message} />
              <Field label="Phone" id="phone" type="tel" register={register("phone")} error={errors.phone?.message} />
            </div>
          </section>

          <section className="surface-luxe p-6 lg:p-8 space-y-4">
            <h2 className="display-serif text-2xl">Shipping address</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="First name" id="first_name" register={register("first_name")} error={errors.first_name?.message} />
              <Field label="Last name" id="last_name" register={register("last_name")} error={errors.last_name?.message} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country_iso2">Country</Label>
              <select
                id="country_iso2" {...register("country_iso2")}
                className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {COUNTRIES.map((c) => <option key={c.iso2} value={c.iso2}>{c.name}</option>)}
              </select>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="State / Province" id="state" register={register("state")} error={errors.state?.message} />
              <Field label="City" id="city" register={register("city")} error={errors.city?.message} />
            </div>
            <Field label="Street address" id="street_address" register={register("street_address")} error={errors.street_address?.message} />
            <div className="grid sm:grid-cols-3 gap-3">
              <Field label="Apartment" id="apartment" register={register("apartment")} />
              <Field label="Postal code" id="postal_code" register={register("postal_code")} />
              <Field label="Landmark" id="landmark" register={register("landmark")} />
            </div>
          </section>

          <section className="surface-luxe p-6 lg:p-8 space-y-4">
            <h2 className="display-serif text-2xl">Shipping method</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <MethodRadio value="standard" label="Standard" sub={deliveryDays || "Calculated"} register={register("shipping_method")} />
              <MethodRadio value="express" label="Express" sub="Faster delivery" register={register("shipping_method")} />
            </div>
          </section>

          <section className="surface-luxe p-6 lg:p-8 space-y-4">
            <h2 className="display-serif text-2xl">Payment</h2>
            <p className="text-sm text-muted-foreground flex items-center gap-2">
              <Lock className="size-4" /> Encrypted and processed by the provider
            </p>
            <div className="grid sm:grid-cols-3 gap-3">
              <ProviderRadio value="paystack" label="Paystack" current={provider} onChange={setProvider} />
              <ProviderRadio value="flutterwave" label="Flutterwave" current={provider} onChange={setProvider} />
              <ProviderRadio value="monnify" label="Monnify" current={provider} onChange={setProvider} />
            </div>
            {sdkStatus === "loading" && (
              <p className="text-xs text-muted-foreground flex items-center gap-2"><Loader2 className="size-3 animate-spin" /> Loading payment SDK…</p>
            )}
            {sdkStatus === "error" && (
              <p className="text-xs text-destructive">Failed to load payment SDK. Try a different provider.</p>
            )}
          </section>

          <section className="surface-luxe p-6 lg:p-8 space-y-3">
            <h2 className="display-serif text-2xl">Order notes (optional)</h2>
            <textarea
              {...register("customer_notes")} rows={3}
              placeholder="Anything we should know about delivery, gift wrapping, or message cards…"
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </section>

          <AuthFormError message={serverError.message} errors={serverError.errors} />
        </div>

        <aside className="lg:sticky lg:top-24 self-start space-y-6">
          <section className="surface-luxe p-6">
            <h2 className="display-serif text-xl mb-3">Your order</h2>
            <div className="max-h-[280px] overflow-y-auto pr-1">
              {cart.items.map((i) => <CartLine key={i.product_id} item={i} compact />)}
            </div>
            <div className="mt-4 pt-4 border-t border-border">
              <OrderSummary
                currency={cart.currency}
                subtotal={cart.subtotal()}
                shippingTotal={shippingFee ?? undefined}
              />
            </div>
            <Button
              type="submit" size="lg" variant="gold" disabled={submitting}
              className="w-full mt-5"
            >
              {submitting ? "Processing…" : `Pay ${cart.currency} ${grand.toFixed(2)}`}
            </Button>
            <p className="text-[10px] text-muted-foreground text-center mt-2">
              By placing this order you agree to our <a href="/terms" className="underline">Terms</a>.
            </p>
          </section>
        </aside>
      </form>
    </div>
  );
}

function Field({
  label, id, type = "text", register, error,
}: {
  label: string; id: string; type?: string;
  register: ReturnType<ReturnType<typeof useForm<Form>>["register"]>;
  error?: string;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} type={type} {...register} />
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

function MethodRadio({
  value, label, sub, register,
}: {
  value: "standard" | "express"; label: string; sub: string;
  register: ReturnType<ReturnType<typeof useForm<Form>>["register"]>;
}) {
  return (
    <label className="flex items-start gap-3 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-roseGold has-[:checked]:bg-roseGold/5">
      <input type="radio" value={value} {...register} className="mt-1 accent-roseGold" />
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>
      </div>
    </label>
  );
}

function ProviderRadio({
  value, label, current, onChange,
}: {
  value: Provider; label: string; current: Provider; onChange: (p: Provider) => void;
}) {
  return (
    <label className="flex items-center gap-3 border border-border rounded-lg p-4 cursor-pointer has-[:checked]:border-roseGold has-[:checked]:bg-roseGold/5">
      <input type="radio" name="provider" value={value} checked={current === value} onChange={() => onChange(value)} className="accent-roseGold" />
      <span className="text-sm font-medium">{label}</span>
    </label>
  );
}