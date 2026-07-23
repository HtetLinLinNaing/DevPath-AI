import type { ErrorCode } from "@/lib/contracts/api-error";

export class AppError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly retryable: boolean,
    public readonly status: number,
    public readonly retryAfterSeconds?: number,
    public readonly details?: string[],
  ) {
    super(message);
    this.name = "AppError";
  }
}

