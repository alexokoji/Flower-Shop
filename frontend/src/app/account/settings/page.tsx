"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { useSession } from "@/hooks/use-session";
import { updateProfile, updatePassword as updatePasswordApi } from "@/lib/auth";
import { extractError } from "@/lib/errors";
import type { User } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormError } from "@/components/auth/auth-form-error";

const profileSchema = z.object({
  first_name: z.string().min(1).max(60),
  last_name: z.string().min(1).max(60),
  phone: z.string().optional().or(z.literal("")),
  preferred_currency: z.string().length(3).optional().or(z.literal("")),
  marketing_opt_in: z.boolean().optional(),
});
type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z
  .object({
    current_password: z.string().min(1),
    password: z.string().min(8).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });
type PasswordForm = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { user, refetch } = useSession();

  return (
    <div className="space-y-8">
      <ProfileCard user={user} onSaved={() => { refetch(); }} />
      <PasswordCard userId={user?.id} />
      <ChangeEmailNote />
    </div>
  );
}

function ProfileCard({ user, onSaved }: { user: User | null | undefined; onSaved: (u: User) => void }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProfileForm>({ resolver: zodResolver(profileSchema) });
  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  useEffect(() => {
    if (user) {
      reset({
        first_name: user.first_name,
        last_name: user.last_name,
        phone: user.phone ?? "",
        preferred_currency: user.preferred_currency ?? "USD",
        marketing_opt_in: user.marketing_opt_in,
      });
    }
  }, [user, reset]);

  const onSubmit = async (values: ProfileForm) => {
    if (!user) return;
    setServerError({});
    try {
      const payload: Partial<User> = {
        first_name: values.first_name,
        last_name: values.last_name,
        phone: values.phone || "",
        preferred_currency: (values.preferred_currency || "USD").toUpperCase(),
        marketing_opt_in: !!values.marketing_opt_in,
      };
      const updated = await updateProfile(user.id, payload);
      toast.success("Profile updated.");
      onSaved(updated);
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  return (
    <section className="surface-luxe p-6 lg:p-8">
      <h2 className="display-serif text-2xl">Profile</h2>
      <p className="text-sm text-muted-foreground mt-1">
        Signed in as <span className="font-medium">{user?.email}</span>
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
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
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...register("phone")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="preferred_currency">Preferred currency</Label>
            <Input id="preferred_currency" placeholder="USD" maxLength={3} {...register("preferred_currency")} />
            {errors.preferred_currency && (
              <p className="text-xs text-destructive">{errors.preferred_currency.message}</p>
            )}
          </div>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register("marketing_opt_in")} className="mt-1 size-4 accent-roseGold" />
          <span>I'd like to receive seasonal letters and quiet promotions.</span>
        </label>
        <AuthFormError message={serverError.message} errors={serverError.errors} />
        <div>
          <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Saving…" : "Save changes"}</Button>
        </div>
      </form>
    </section>
  );
}

function PasswordCard({ userId }: { userId: string | undefined }) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  const onSubmit = async (values: PasswordForm) => {
    if (!userId) return;
    setServerError({});
    try {
      await updatePasswordApi(userId, values.current_password, values.password, values.password_confirmation);
      toast.success("Password updated.");
      reset();
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  return (
    <section className="surface-luxe p-6 lg:p-8">
      <h2 className="display-serif text-2xl">Change password</h2>
      <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="current_password">Current password</Label>
          <Input id="current_password" type="password" autoComplete="current-password" {...register("current_password")} />
          {errors.current_password && <p className="text-xs text-destructive">{errors.current_password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">At least 8 chars with upper, lower, number</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation">Confirm new password</Label>
          <Input id="password_confirmation" type="password" autoComplete="new-password" {...register("password_confirmation")} />
          {errors.password_confirmation && <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>}
        </div>
        <AuthFormError message={serverError.message} errors={serverError.errors} />
        <div>
          <Button type="submit" disabled={isSubmitting} variant="outline">
            {isSubmitting ? "Updating…" : "Update password"}
          </Button>
        </div>
      </form>
    </section>
  );
}

function ChangeEmailNote() {
  return (
    <section className="surface-luxe p-6 lg:p-8">
      <h2 className="display-serif text-2xl">Change email</h2>
      <p className="text-sm text-muted-foreground mt-2">
        For security, changing your email is a two-step process — request a change here and we'll send a confirmation
        link to the new address. Coming in a later phase.
      </p>
    </section>
  );
}
