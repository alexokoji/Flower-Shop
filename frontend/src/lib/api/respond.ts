import { NextResponse } from "next/server";
import { ZodError } from "zod";

/**
 * Every API response uses PocketBase's error envelope — `{ message, data }` —
 * because src/lib/errors.ts already normalises exactly that shape into form
 * errors. Keeping the contract means the UI's error handling carries over
 * untouched.
 */

export function ok<T>(data: T, init?: number) {
  return NextResponse.json(data, { status: init ?? 200 });
}

export function fail(status: number, message: string, data?: Record<string, { message: string }>) {
  return NextResponse.json({ message, data: data ?? {} }, { status });
}

export const unauthorized = (msg = "You must be signed in.") => fail(401, msg);
export const forbidden = (msg = "You do not have access to that.") => fail(403, msg);
export const notFound = (msg = "Not found.") => fail(404, msg);
export const badRequest = (msg: string, data?: Record<string, { message: string }>) =>
  fail(400, msg, data);

/** Turn a Zod failure into the per-field envelope the forms already render. */
export function fromZod(err: ZodError) {
  const data: Record<string, { message: string }> = {};
  for (const issue of err.issues) {
    const path = issue.path.join(".") || "_";
    if (!data[path]) data[path] = { message: issue.message };
  }
  return fail(400, "Please check the highlighted fields.", data);
}

/**
 * Wrap a route handler so an unexpected throw becomes a 500 with a logged
 * cause, instead of leaking a stack trace to the client.
 */
export function route<Args extends unknown[]>(
  handler: (...args: Args) => Promise<Response>
): (...args: Args) => Promise<Response> {
  return async (...args: Args) => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ZodError) return fromZod(err);
      console.error("[api] unhandled error:", err);
      return fail(500, "Something went wrong. Please try again.");
    }
  };
}
