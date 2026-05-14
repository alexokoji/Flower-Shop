import { pb, PbError } from "@/lib/pb";
import type { User } from "@/types";

export interface RegisterPayload {
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  password: string;
  password_confirmation: string;
  preferred_currency?: string;
  marketing_opt_in?: boolean;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export async function registerAccount(payload: RegisterPayload): Promise<User> {
  const users = pb().collection("users");

  const created = await users.create<User>({
    email: payload.email.toLowerCase(),
    password: payload.password,
    passwordConfirm: payload.password_confirmation,
    emailVisibility: true,
    first_name: payload.first_name,
    last_name: payload.last_name,
    phone: payload.phone ?? "",
    role: "customer",
    preferred_currency: (payload.preferred_currency ?? "USD").toUpperCase(),
    locale: "en",
    marketing_opt_in: !!payload.marketing_opt_in,
  });

  await users.authWithPassword(payload.email.toLowerCase(), payload.password);
  return created;
}

export async function login(payload: LoginPayload): Promise<User> {
  const res = await pb().collection("users").authWithPassword<User>(
    payload.email.toLowerCase(),
    payload.password,
  );

  try {
    await pb().collection("users").update(res.record.id, {
      last_login_at: new Date().toISOString(),
    });
  } catch { /* best-effort */ }

  return res.record;
}

export function logout() {
  pb().authStore.clear();
}

export function currentUser(): User | null {
  return (pb().authStore.model as User | null) ?? null;
}

export async function fetchMe(): Promise<User | null> {
  if (!pb().authStore.isValid) return null;
  try {
    const fresh = await pb().collection("users").authRefresh<User>();
    return fresh.record;
  } catch (err) {
    if (err instanceof PbError && err.status === 401) {
      pb().authStore.clear();
      return null;
    }
    pb().authStore.clear();
    return null;
  }
}

export async function forgotPassword(email: string): Promise<void> {
  await pb().collection("users").requestPasswordReset(email.toLowerCase());
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  password_confirmation: string;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await pb().collection("users").confirmPasswordReset(
    payload.token,
    payload.password,
    payload.password_confirmation,
  );
}

export async function updateProfile(id: string, patch: Partial<User>): Promise<User> {
  return pb().collection("users").update<User>(id, patch);
}

export async function updatePassword(id: string, current: string, next: string, confirm: string): Promise<User> {
  return pb().collection("users").update<User>(id, {
    oldPassword: current,
    password: next,
    passwordConfirm: confirm,
  });
}