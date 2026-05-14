"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { forgotPassword } from "@/lib/auth";
import { extractError } from "@/lib/errors";

const schema = z.object({ email: z.string().email("Enter a valid email") });
type Form = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  const [sent, setSent] = useState(false);
  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  const onSubmit = async (values: Form) => {
    setServerError({});
    try {
      await forgotPassword(values.email);
      setSent(true);
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Recovery</p>
        <h1 className="display-serif text-4xl mt-1">Forgot password</h1>
        <p className="text-sm text-muted-foreground mt-2">
          We'll send a reset link to your email address.
        </p>
      </div>

      {sent ? (
        <div className="surface-luxe p-6 space-y-2">
          <p className="display-serif text-xl">Check your inbox</p>
          <p className="text-sm text-muted-foreground">
            If an account exists for that email, a reset link is on its way. The link expires in 60 minutes.
          </p>
          <div className="pt-2">
            <Link href="/login" className="text-sm underline underline-offset-4 hover:text-roseGold">
              Back to sign in
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" {...register("email")} />
            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
          </div>

          <AuthFormError message={serverError.message} errors={serverError.errors} />

          <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? "Sending…" : "Send reset link"}
          </Button>

          <div className="pt-2">
            <Link href="/login" className="text-sm hover:text-roseGold">
              ← Back to sign in
            </Link>
          </div>
        </form>
      )}
    </div>
  );
}
