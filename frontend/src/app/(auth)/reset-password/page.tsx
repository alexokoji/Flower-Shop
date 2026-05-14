"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { resetPassword } from "@/lib/auth";
import { extractError } from "@/lib/errors";

const schema = z
  .object({
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    password_confirmation: z.string(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

type Form = z.infer<typeof schema>;

function ResetPasswordInner() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token");

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  if (!token) {
    return (
      <div className="surface-luxe p-6 space-y-3">
        <p className="display-serif text-xl">Invalid link</p>
        <p className="text-sm text-muted-foreground">
          The reset link is missing required information. Please request a new one.
        </p>
        <Link href="/forgot-password" className="btn-outline-gold inline-flex !text-sm">
          Request a new link
        </Link>
      </div>
    );
  }

  const onSubmit = async (values: Form) => {
    setServerError({});
    try {
      await resetPassword({
        token,
        password: values.password,
        password_confirmation: values.password_confirmation,
      });
      toast.success("Password updated. Please sign in with your new password.");
      router.push("/login");
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Almost there</p>
        <h1 className="display-serif text-4xl mt-1">Set a new password</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Choose a strong new password for your account.
        </p>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation">Confirm new password</Label>
          <Input
            id="password_confirmation"
            type="password"
            autoComplete="new-password"
            {...register("password_confirmation")}
          />
          {errors.password_confirmation && (
            <p className="text-xs text-destructive">{errors.password_confirmation.message}</p>
          )}
        </div>
        <AuthFormError message={serverError.message} errors={serverError.errors} />
        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <ResetPasswordInner />
    </Suspense>
  );
}
