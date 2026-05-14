import { PbError } from "@/lib/pb";

export interface NormalizedError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
}

interface PbResponseShape {
  message?: string;
  data?: Record<string, { code?: string; message?: string }>;
}

/**
 * Convert any caught error into a uniform shape for forms.
 * Handles PocketBase SDK ClientResponseError (status, data.data field map)
 * and our custom PbError thrown from /api/checkout etc.
 */
export function extractError(err: unknown): NormalizedError {
  if (err && typeof err === "object") {
    if (err instanceof PbError) {
      return { message: err.message, status: err.status };
    }
    const anyErr = err as { status?: number; response?: PbResponseShape; data?: PbResponseShape; message?: string };
    const data = anyErr.response ?? anyErr.data;
    if (data && typeof data === "object") {
      const errors: Record<string, string[]> = {};
      if (data.data && typeof data.data === "object") {
        for (const [k, v] of Object.entries(data.data)) {
          if (v && typeof v === "object" && "message" in v) {
            errors[k] = [String((v as { message: unknown }).message)];
          }
        }
      }
      return {
        message: data.message ?? anyErr.message ?? "Something went wrong.",
        errors: Object.keys(errors).length ? errors : undefined,
        status: anyErr.status,
      };
    }
    if (anyErr.message) return { message: anyErr.message, status: anyErr.status };
  }
  return { message: "Something went wrong." };
}
