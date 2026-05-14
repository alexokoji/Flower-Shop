"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { pb } from "@/lib/pb";
import { extractError } from "@/lib/errors";
import { useAuth } from "@/stores/auth";
import { COUNTRIES } from "@/data";
import type { Address } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormError } from "@/components/auth/auth-form-error";

const addressSchema = z.object({
  label: z.string().max(40).optional().or(z.literal("")),
  first_name: z.string().min(1).max(60),
  last_name: z.string().min(1).max(60),
  phone: z.string().max(32).optional().or(z.literal("")),
  country_iso2: z.string().length(2),
  state: z.string().min(1).max(80),
  city: z.string().min(1).max(80),
  street_address: z.string().min(1).max(191),
  apartment: z.string().max(60).optional().or(z.literal("")),
  postal_code: z.string().max(24).optional().or(z.literal("")),
  landmark: z.string().max(120).optional().or(z.literal("")),
  is_default_shipping: z.boolean().optional(),
  is_default_billing: z.boolean().optional(),
});
type AddressForm = z.infer<typeof addressSchema>;

export default function AddressesPage() {
  const qc = useQueryClient();
  const userId = useAuth((s) => s.user?.id);
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);

  const addresses = useQuery({
    queryKey: ["addresses", userId],
    enabled: !!userId,
    queryFn: () =>
      pb().collection("addresses").getFullList<Address>({
        filter: `user = "${userId}"`,
        sort: "-created",
      }),
  });

  const remove = useMutation({
    mutationFn: (id: string) => pb().collection("addresses").delete(id),
    onSuccess: () => {
      toast.success("Address removed.");
      qc.invalidateQueries({ queryKey: ["addresses"] });
    },
  });

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h2 className="display-serif text-2xl">Saved addresses</h2>
        <Button onClick={() => { setCreating(true); setEditing(null); }} size="sm" variant="gold">
          <Plus className="size-4" /> Add address
        </Button>
      </header>

      {addresses.isLoading ? (
        <p className="text-sm text-muted-foreground">Loading addresses…</p>
      ) : addresses.data && addresses.data.length > 0 ? (
        <ul className="grid sm:grid-cols-2 gap-4">
          {addresses.data.map((a) => (
            <li key={a.id} className="surface-luxe p-5 flex flex-col gap-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{a.label || `${a.first_name} ${a.last_name}`}</p>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-line">
                    {a.first_name} {a.last_name}
                    {a.phone && `\n${a.phone}`}
                    {`\n${a.street_address}${a.apartment ? `, ${a.apartment}` : ""}`}
                    {`\n${a.city}, ${a.state} ${a.postal_code ?? ""}`}
                    {`\n${a.country_iso2}`}
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    aria-label="Edit"
                    onClick={() => { setEditing(a); setCreating(false); }}
                    className="p-2 rounded-md hover:bg-muted"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label="Delete"
                    onClick={() => {
                      if (confirm("Delete this address?")) remove.mutate(a.id);
                    }}
                    className="p-2 rounded-md hover:bg-muted text-destructive"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
              <div className="flex gap-2 text-[10px] uppercase tracking-widest">
                {a.is_default_shipping && <span className="px-2 py-0.5 rounded-full bg-roseGold/15 text-roseGold-600">Default shipping</span>}
                {a.is_default_billing && <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold-500">Default billing</span>}
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <div className="surface-luxe p-8 text-center">
          <p className="display-serif text-xl">No addresses saved yet</p>
          <p className="text-sm text-muted-foreground mt-1">Add one to speed up checkout.</p>
        </div>
      )}

      {(editing || creating) && userId && (
        <AddressEditor
          address={editing}
          userId={userId}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSaved={() => {
            setEditing(null);
            setCreating(false);
            qc.invalidateQueries({ queryKey: ["addresses"] });
          }}
        />
      )}
    </div>
  );
}

async function normalizeDefaults(userId: string, savedId: string, savedShipping: boolean, savedBilling: boolean) {
  if (!savedShipping && !savedBilling) return;
  const others = await pb().collection("addresses").getFullList<Address>({
    filter: `user = "${userId}" && id != "${savedId}"`,
  });
  await Promise.all(
    others.map((a) => {
      const patch: Partial<Address> = {};
      if (savedShipping && a.is_default_shipping) patch.is_default_shipping = false;
      if (savedBilling && a.is_default_billing) patch.is_default_billing = false;
      if (Object.keys(patch).length) return pb().collection("addresses").update(a.id, patch);
      return Promise.resolve();
    })
  );
}

function AddressEditor({
  address,
  userId,
  onClose,
  onSaved,
}: {
  address: Address | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AddressForm>({
    resolver: zodResolver(addressSchema),
    defaultValues: address ?? { country_iso2: "US" },
  });
  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  const onSubmit = async (values: AddressForm) => {
    setServerError({});
    try {
      const payload = {
        user: userId,
        label: values.label || "",
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || "",
        country_iso2: values.country_iso2.toUpperCase(),
        state: values.state,
        city: values.city,
        street_address: values.street_address,
        apartment: values.apartment || "",
        postal_code: values.postal_code || "",
        landmark: values.landmark || "",
        is_default_shipping: !!values.is_default_shipping,
        is_default_billing: !!values.is_default_billing,
      };
      const saved = address
        ? await pb().collection("addresses").update<Address>(address.id, payload)
        : await pb().collection("addresses").create<Address>(payload);

      await normalizeDefaults(userId, saved.id, !!values.is_default_shipping, !!values.is_default_billing);
      toast.success(address ? "Address updated." : "Address added.");
      onSaved();
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  return (
    <div className="surface-luxe p-6 lg:p-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="display-serif text-xl">{address ? "Edit address" : "New address"}</h3>
        <button onClick={onClose} className="text-sm text-muted-foreground hover:text-foreground">Cancel</button>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3" noValidate>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="label">Label (e.g. Home)</Label>
            <Input id="label" {...register("label")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...register("phone")} />
          </div>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" {...register("first_name")} />
            {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" {...register("last_name")} />
            {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country_iso2">Country</Label>
          <select
            id="country_iso2"
            {...register("country_iso2")}
            className="flex h-11 w-full rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {COUNTRIES.map((c) => (
              <option key={c.iso2} value={c.iso2}>{c.name}</option>
            ))}
          </select>
        </div>
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="state">State / Province</Label>
            <Input id="state" {...register("state")} />
            {errors.state && <p className="text-xs text-destructive">{errors.state.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">City</Label>
            <Input id="city" {...register("city")} />
            {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="street_address">Street address</Label>
          <Input id="street_address" {...register("street_address")} />
          {errors.street_address && <p className="text-xs text-destructive">{errors.street_address.message}</p>}
        </div>
        <div className="grid sm:grid-cols-3 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="apartment">Apartment</Label>
            <Input id="apartment" {...register("apartment")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="postal_code">Postal code</Label>
            <Input id="postal_code" {...register("postal_code")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="landmark">Landmark</Label>
            <Input id="landmark" {...register("landmark")} />
          </div>
        </div>
        <div className="flex flex-wrap gap-4 pt-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("is_default_shipping")} className="size-4 accent-roseGold" />
            Default shipping
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" {...register("is_default_billing")} className="size-4 accent-roseGold" />
            Default billing
          </label>
        </div>
        <AuthFormError message={serverError.message} errors={serverError.errors} />
        <div className="pt-2 flex gap-2">
          <Button type="submit" disabled={isSubmitting} variant="gold">
            {isSubmitting ? "Saving…" : address ? "Save changes" : "Add address"}
          </Button>
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
        </div>
      </form>
    </div>
  );
}
