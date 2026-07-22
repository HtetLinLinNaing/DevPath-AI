import type { ApiErrorResponse } from "@/lib/contracts/api-error";
import { AppError } from "@/lib/http/app-error";

export type ErrorResponseResult = {
  status: number;
  body: ApiErrorResponse;
  retryAfterSeconds?: number;
};

const INTERNAL_MESSAGE = "Something went wrong while generating your roadmap.";

export function toErrorResponse(error: unknown, requestId: string): ErrorResponseResult {
  const appError = error instanceof AppError
    ? error
    : new AppError("INTERNAL_ERROR", INTERNAL_MESSAGE, true, 500);

  return {
    status: appError.status,
    body: {
      error: {
        code: appError.code,
        message: appError.message,
        retryable: appError.retryable,
        requestId,
        ...(appError.details ? { details: appError.details } : {}),
      },
    },
    ...(appError.retryAfterSeconds === undefined
      ? {}
      : { retryAfterSeconds: appError.retryAfterSeconds }),
  };
}

