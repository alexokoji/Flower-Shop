import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Route protection.
 *
 * The site is private by default: everything except the allowlist below needs a
 * signed-in account. Enforcing it here rather than inside each page means a new
 * page is protected the moment it is created — the safe direction to fail.
 *
 * The session cookie is verified, not merely detected, so a forged or expired
 * token is treated as signed out.
 */

/** Exact paths anyone may open. */
const PUBLIC_EXACT = new Set([
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
  "/verify-email",
  "/about",
  "/contact",
  "/terms",
  "/privacy",
  "/cookies",
]);

/** Prefixes that are public (assets, API — the API guards itself per route). */
const PUBLIC_PREFIXES = ["/api/", "/_next/", "/images/", "/fonts/", "/icons/"];

const PUBLIC_FILES = new Set([
  "/favicon.ico",
  "/robots.txt",
  "/sitemap.xml",
  "/manifest.webmanifest",
]);

function isPublic(pathname: string): boolean {
  if (PUBLIC_EXACT.has(pathname)) return true;
  if (PUBLIC_FILES.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((p) => pathname.startsWith(p));
}

async function hasValidSession(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get("xd_session")?.value;
  if (!token) return false;

  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 32) {
    // Misconfigured server: refuse to treat anyone as authenticated rather than
    // letting everyone through.
    console.error("[middleware] AUTH_SECRET missing or too short.");
    return false;
  }

  try {
    await jwtVerify(token, new TextEncoder().encode(secret));
    return true;
  } catch {
    return false;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, search } = req.nextUrl;

  // Public pages are served as-is. Note there is deliberately no "already
  // signed in, bounce them to /shop" rule: it hijacked the Create account link
  // for anyone holding a session, which is surprising and hard to escape. The
  // auth pages handle a signed-in visitor themselves.
  if (isPublic(pathname)) return NextResponse.next();

  if (await hasValidSession(req)) return NextResponse.next();

  // Send them to sign in, remembering where they were headed.
  const login = new URL("/login", req.url);
  login.searchParams.set("next", pathname + search);
  return NextResponse.redirect(login);
}

export const config = {
  // Skip Next internals and anything with a file extension.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
