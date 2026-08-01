import { NextResponse } from "next/server";

// Consistent JSON error shape for every route: a machine-readable code and a
// human message. Internal details never reach the browser.

export type ApiErrorCode =
  | "invalid_input"
  | "not_found"
  | "rooms_unavailable"
  | "invalid_status_transition"
  | "unauthorized"
  | "forbidden"
  | "rate_limited"
  | "internal";

export class ApiError extends Error {
  constructor(
    public code: ApiErrorCode,
    message: string,
    public status: number
  ) {
    super(message);
  }
}

export function errorResponse(code: ApiErrorCode, message: string, status: number) {
  return NextResponse.json({ error: { code, message } }, { status });
}

/** Wrap a route handler: ApiErrors map to their status, anything else to 500. */
export function handleApiError(err: unknown) {
  if (err instanceof ApiError) {
    return errorResponse(err.code, err.message, err.status);
  }
  console.error("Unhandled API error:", err);
  return errorResponse(
    "internal",
    "Something went wrong on our side. Please try again, or call the hotel.",
    500
  );
}
