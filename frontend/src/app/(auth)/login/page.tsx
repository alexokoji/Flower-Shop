"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Suspense, useState } from "react";
import { toast } from "sonner";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthFormError } from "@/components/auth/auth-form-error";
import { login } from "@/lib/auth";
import { extractError } from "@/lib/errors";

const schema = z.object({
  email: z.string().email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
  remember: z.boolean().optional(),
});
type Form = z.infer<typeof schema>;

function LoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const next = params.get("next") || "/account";

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema), defaultValues: { remember: true } });

  const [serverError, setServerError] = useState<{ message?: string; errors?: Record<string, string[]> }>({});
  const [showPassword, setShowPassword] = useState(false);

  const onSubmit = async (values: Form) => {
    setServerError({});
    try {
      const user = await login(values);
      toast.success(`Welcome back, ${user.first_name}.`);
      router.push(next);
      router.refresh();
    } catch (err) {
      setServerError(extractError(err));
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="eyebrow">Welcome back</p>
        <h1 className="display-serif text-4xl mt-1">Sign in</h1>
        <p className="text-sm text-muted-foreground mt-2">
          New here?{" "}
          <Link href="/register" className="underline underline-offset-4 hover:text-roseGold">
            Create an account
          </Link>
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" autoComplete="email" {...register("email")} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs hover:text-roseGold">
              Forgot?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              {...register("password")}
            />
            <button
              type="button"
              aria-label={showPassword ? "Hide password" : "Show password"}
              onClick={() => setShowPassword((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" {...register("remember")} className="size-4 accent-roseGold" />
          Remember me for 30 days
        </label>

        <AuthFormError message={serverError.message} errors={serverError.errors} />

        <Button type="submit" disabled={isSubmitting} className="w-full" size="lg">
          {isSubmitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted-foreground">Loading…</div>}>
      <LoginInner />
    </Suspense>
  );
}