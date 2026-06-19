import { NextResponse } from "next/server";
import { ZodError } from "zod";

export type ApiErrorCode =
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "AI_ERROR"
  | "DB_ERROR"
  | "INTERNAL";

export interface ErrorResponse {
  error:    string;
  code:     ApiErrorCode;
  details?: unknown;
}

export function apiError(
  message:  string,
  code:     ApiErrorCode,
  status:   number,
  details?: unknown
): NextResponse<ErrorResponse> {
  return NextResponse.json({ error: message, code, details }, { status });
}

export const Errors = {
  unauthorized: () => apiError("Authentication required", "UNAUTHORIZED", 401),
  forbidden:    () => apiError("Access denied", "FORBIDDEN", 403),
  notFound:     (what = "Resource") => apiError(`${what} not found`, "NOT_FOUND", 404),
  rateLimited:  () => apiError("Too many requests. Please wait.", "RATE_LIMITED", 429),
  validation:   (err: ZodError) => apiError(
    "Validation failed",
    "VALIDATION_ERROR",
    400,
    err.flatten()
  ),
  db: (msg: string) => apiError(`Database error: ${msg}`, "DB_ERROR", 500),
  ai: (msg: string) => apiError(`AI error: ${msg}`, "AI_ERROR", 502),
  internal: (msg = "Unexpected error") => apiError(msg, "INTERNAL", 500),
};

// Wrap route handler with error catching
export function withErrorHandler<T extends unknown[]>(
  handler: (...args: T) => Promise<NextResponse>
) {
  return async (...args: T): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ZodError) return Errors.validation(err);
      console.error("[API Error]", err);
      return Errors.internal();
    }
  };
}
