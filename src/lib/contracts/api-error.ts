import { z } from "zod";

export const ErrorCodeSchema = z.enum([
  "INVALID_INPUT",
  "RATE_LIMITED",
  "GENERATION_TIMEOUT",
  "INVALID_MODEL_OUTPUT",
  "PROVIDER_UNAVAILABLE",
  "INTERNAL_ERROR",
]);

export const ApiErrorResponseSchema = z.strictObject({
  error: z.strictObject({
    code: ErrorCodeSchema,
    message: z.string().min(1),
    retryable: z.boolean(),
    requestId: z.string().min(1),
    details: z.array(z.string()).optional(),
  }),
});

export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type ApiErrorResponse = z.infer<typeof ApiErrorResponseSchema>;
export type ApiError = ApiErrorResponse["error"];

