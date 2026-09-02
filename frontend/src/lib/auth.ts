import { api, apiRequest, authStore, ApiError } from "@/lib/api/client";
import type { User } from "@/types";

/**
 * Auth against the MongoDB-backed API.
 *
 * The session is an httpOnly cookie set by the server, so nothing here handles
 * a token: `authStore` only mirrors the signed-in user for the UI to render.
 * The exported function names are unchanged from the PocketBase version.
 */

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
  const res = await apiRequest<{ record: User }>("/auth/register", {
    method: "POST",
    body: JSON.stringify({
      email: payload.email.toLowerCase(),
      password: payload.password,
      passwordConfirm: payload.password_confirmation,
      first_name: payload.first_name,
      last_name: payload.last_name,
      phone: payload.phone ?? "",
      marketing_opt_in: !!payload.marketing_opt_in,
    }),
  });
  authStore.set(res.record as never);
  return res.record;
}

export async function login(payload: LoginPayload): Promise<User> {
  const res = await apiRequest<{ record: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identity: payload.email.toLowerCase(),
      password: payload.password,
    }),
  });
  authStore.set(res.record as never);
  return res.record;
}

export async function logout() {
  try {
    await apiRequest("/auth/session", { method: "DELETE" });
  } catch {
    /* clearing locally still signs the UI out */
  }
  authStore.clear();
}

export function currentUser(): User | null {
  return (authStore.model as User | null) ?? null;
}

/** Load the session from the server cookie. Safe to call on every mount. */
export async function fetchMe(): Promise<User | null> {
  return (await authStore.load(true)) as User | null;
}

export async function forgotPassword(email: string): Promise<void> {
  await apiRequest("/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email: email.toLowerCase() }),
  });
}

export interface ResetPasswordPayload {
  token: string;
  password: string;
  password_confirmation: string;
}

export async function resetPassword(payload: ResetPasswordPayload): Promise<void> {
  await apiRequest("/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({
      token: payload.token,
      password: payload.password,
      passwordConfirm: payload.password_confirmation,
    }),
  });
}

export async function updateProfile(id: string, patch: Partial<User>): Promise<User> {
  const updated = await api().collection("users").update<User>(id, patch as Record<string, unknown>);
  authStore.set(updated as never);
  return updated;
}

/** Changing a password requires the current one, checked server-side. */
export async function updatePassword(
  _id: string,
  current: string,
  next: string,
  confirm: string
): Promise<void> {
  await apiRequest("/auth/change-password", {
    method: "POST",
    body: JSON.stringify({ current, password: next, passwordConfirm: confirm }),
  });
}

export { ApiError };
