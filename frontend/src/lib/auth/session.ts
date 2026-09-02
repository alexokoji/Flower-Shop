import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

/**
 * Sessions.
 *
 * PocketBase kept its JWT in localStorage, readable by any script on the page.
 * The replacement stores it in an httpOnly cookie instead, so XSS cannot exfil
 * a session, and the token never has to be threaded through client code.
 */

const SECRET = process.env.AUTH_SECRET ?? "";
const COOKIE = "xd_session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 14; // 14 days

if (!SECRET && process.env.NODE_ENV !== "test") {
  console.error("[auth] AUTH_SECRET is not set — sessions cannot be issued or verified.");
}

function key() {
  if (!SECRET) throw new Error("AUTH_SECRET is not configured.");
  if (SECRET.length < 32) {
    throw new Error("AUTH_SECRET must be at least 32 characters.");
  }
  return new TextEncoder().encode(SECRET);
}

export interface SessionClaims {
  uid: string;
  role: "customer" | "admin";
  email: string;
}

export async function signSession(claims: SessionClaims): Promise<string> {
  return new SignJWT({ role: claims.role, email: claims.email })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(claims.uid)
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_SECONDS}s`)
    .sign(key());
}

export async function verifySession(token: string): Promise<SessionClaims | null> {
  try {
    const { payload } = await jwtVerify(token, key());
    if (!payload.sub) return null;
    return {
      uid: String(payload.sub),
      role: payload.role === "admin" ? "admin" : "customer",
      email: String(payload.email ?? ""),
    };
  } catch {
    return null;
  }
}

/** Read the session of the current request, or null when signed out. */
export async function currentSession(): Promise<SessionClaims | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function setSessionCookie(token: string) {
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearSessionCookie() {
  const jar = await cookies();
  jar.set(COOKIE, "", { httpOnly: true, path: "/", maxAge: 0 });
}

/* -------------------------------------------------------------------------- */
/* Passwords                                                                  */
/* -------------------------------------------------------------------------- */

const ROUNDS = 12;

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, ROUNDS);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  if (!hash) return false;
  try {
    return await bcrypt.compare(plain, hash);
  } catch {
    return false;
  }
}

/** Single-use token for email verification and password resets. */
export function randomToken(bytes = 32): string {
  const arr = new Uint8Array(bytes);
  crypto.getRandomValues(arr);
  return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
}
