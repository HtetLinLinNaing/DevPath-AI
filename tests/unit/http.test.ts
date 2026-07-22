import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/http/app-error";
import { getClientIdentity } from "@/lib/http/client-identity";
import { createRateLimiter } from "@/lib/http/rate-limit";
import { toErrorResponse } from "@/lib/http/route-response";

describe("HTTP error mapping", () => {
  it.each([
    ["INVALID_INPUT", 400],
    ["RATE_LIMITED", 429],
    ["GENERATION_TIMEOUT", 504],
    ["INVALID_MODEL_OUTPUT", 502],
    ["PROVIDER_UNAVAILABLE", 503],
    ["INTERNAL_ERROR", 500],
  ] as const)("maps %s to status %i", (code, status) => {
    const result = toErrorResponse(new AppError(code, "Public message", true, status), "req_123");
    expect(result.status).toBe(status);
    expect(result.body).toEqual({
      error: { code, message: "Public message", retryable: true, requestId: "req_123" },
    });
  });

  it("hides unexpected error details", () => {
    const serialized = JSON.stringify(toErrorResponse(new Error("secret provider body"), "req_456"));
    expect(serialized).not.toContain("secret provider body");
    expect(serialized).toContain("INTERNAL_ERROR");
  });

  it("preserves retry-after metadata outside the response body", () => {
    const result = toErrorResponse(
      new AppError("RATE_LIMITED", "Try later.", true, 429, 12),
      "req_rate",
    );
    expect(result.retryAfterSeconds).toBe(12);
    expect(result.body.error).not.toHaveProperty("retryAfterSeconds");
  });
});

describe("client identity", () => {
  it("hashes the first forwarded address with the configured salt", () => {
    const headers = new Headers({ "x-forwarded-for": "203.0.113.4, 10.0.0.1" });
    const first = getClientIdentity(headers, "test-salt");
    const second = getClientIdentity(headers, "test-salt");
    expect(first).toBe(second);
    expect(first).not.toContain("203.0.113.4");
  });

  it("falls back without exposing a raw address", () => {
    expect(getClientIdentity(new Headers(), "test-salt")).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("rate limiter", () => {
  it("allows five requests per minute and rejects the sixth", () => {
    const check = createRateLimiter({ limit: 5, windowMs: 60_000, maxEntries: 10 });
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect(check("client", 1_000).allowed).toBe(true);
    }
    const rejected = check("client", 1_000);
    expect(rejected).toMatchObject({ allowed: false, remaining: 0, retryAfterSeconds: 60 });
  });

  it("resets after the window expires", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 1_000, maxEntries: 10 });
    expect(check("client", 1_000).allowed).toBe(true);
    expect(check("client", 1_500).allowed).toBe(false);
    expect(check("client", 2_000).allowed).toBe(true);
  });

  it("evicts expired entries before enforcing the map cap", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 100, maxEntries: 2 });
    check("old-a", 0);
    check("old-b", 0);
    expect(check("new", 101).allowed).toBe(true);
  });
});
