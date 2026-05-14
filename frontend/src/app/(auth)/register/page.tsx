"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { registerAccount } from "@/lib/auth";
import { extractError } from "@/lib/errors";

const schema = z
  .object({
    first_name: z.string().min(1, "Required").max(60),
    last_name: z.string().min(1, "Required").max(60),
    email: z.string().email("Enter a valid email"),
    phone: z.string().optional(),
    password: z
      .string()
      .min(8, "At least 8 characters")
      .regex(/[a-z]/, "Include a lowercase letter")
      .regex(/[A-Z]/, "Include an uppercase letter")
      .regex(/\d/, "Include a number"),
    password_confirmation: z.string(),
    marketing_opt_in: z.boolean().optional(),
  })
  .refine((d) => d.password === d.password_confirmation, {
    path: ["password_confirmation"],
    message: "Passwords do not match",
  });

type Form = z.infer<typeof schema>;

export default function RegisterPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });
  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});

  const onSubmit = async (values: Form) => {
    setServerError({});
    try {
      const user = await registerAccount(values);
      toast.success(`Welcome to Xperience Delivery, ${user.first_name}.`);
      router.push("/account");
      router.refresh();
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Begin your journal</p>
        <h1 className="display-serif text-4xl mt-1">Create an account</h1>
        <p className="text-sm text-muted-foreground mt-2">
          Already have one?{" "}
          <Link href="/login" className="underline underline-offset-4 hover:text-roseGold">
            Sign in
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="first_name">First name</Label>
            <Input id="first_name" autoComplete="given-name" {...register("first_name")} />
            {errors.first_name && <p className="text-xs text-destructive">{errors.first_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="last_name">Last name</Label>
            <Input id="last_name" autoComplete="family-name" {...register("last_name")} />
            {errors.last_name && <p className="text-xs text-destructive">{errors.last_name.message}</p>}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input id="phone" type="tel" autoComplete="tel" {...register("phone")} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" autoComplete="new-password" {...register("password")} />
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
          <p className="text-xs text-muted-foreground">Minimum 8 characters with upper, lower, and a number.</p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="password_confirmation">Confirm password</Label>
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

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" {...register("marketing_opt_in")} className="mt-1 size-4 accent-roseGold" />
          <span>I'd like to receive seasonal letters and quiet promotions.</span>
        </label>

        <AuthFormError message={serverError.message} errors={serverError.errors} />

        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? "Creating…" : "Create account"}
        </Button>

        <p className="text-xs text-muted-foreground">
          By creating an account you agree to our{" "}
          <Link href="/terms" className="underline underline-offset-4">Terms</Link> and{" "}
          <Link href="/privacy" className="underline underline-offset-4">Privacy policy</Link>.
        </p>
      </form>
    </div>
  );
}
