import { describe, expect, it } from "vitest";

import { AppError } from "@/lib/http/app-error";
import {
  CLIENT_SESSION_COOKIE,
  resolveClientSession,
  sessionCookieSecret,
} from "@/lib/http/client-session";
import { checkRateLimit, createRateLimiter } from "@/lib/http/rate-limit";
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

describe("signed client session", () => {
  const uuid = "11111111-1111-4111-8111-111111111111";

  it("creates a signed anonymous cookie with restrictive attributes", () => {
    const session = resolveClientSession(new Headers(), {
      createId: () => uuid,
      secret: "test-cookie-secret",
      secure: false,
    });

    expect(session.identity).toBe(uuid);
    expect(session.setCookie).toContain(`${CLIENT_SESSION_COOKIE}=`);
    expect(session.setCookie).toContain("Max-Age=2592000");
    expect(session.setCookie).toContain("Path=/api/generate-roadmap");
    expect(session.setCookie).toContain("HttpOnly");
    expect(session.setCookie).toContain("SameSite=Lax");
    expect(session.setCookie).not.toContain("Secure");
  });

  it("keeps a valid cookie identity when the request IP changes", () => {
    const created = resolveClientSession(new Headers(), {
      createId: () => uuid,
      secret: "test-cookie-secret",
      secure: true,
    });
    const cookie = created.setCookie?.split(";")[0];
    const headers = new Headers({
      cookie: cookie ?? "",
      "x-forwarded-for": "198.51.100.200",
    });

    const restored = resolveClientSession(headers, {
      createId: () => {
        throw new Error("valid cookies must not create another UUID");
      },
      secret: "test-cookie-secret",
      secure: true,
    });

    expect(restored).toEqual({ identity: uuid });
    expect(created.setCookie).toContain("Secure");
  });

  it("replaces a cookie whose signature was tampered with", () => {
    const created = resolveClientSession(new Headers(), {
      createId: () => uuid,
      secret: "test-cookie-secret",
      secure: false,
    });
    const cookie = created.setCookie?.split(";")[0] ?? "";
    const tampered = `${cookie.slice(0, -1)}${cookie.endsWith("a") ? "b" : "a"}`;
    const replacement = "22222222-2222-4222-8222-222222222222";

    const resolved = resolveClientSession(new Headers({ cookie: tampered }), {
      createId: () => replacement,
      secret: "test-cookie-secret",
      secure: false,
    });

    expect(resolved.identity).toBe(replacement);
    expect(resolved.setCookie).toContain(`${CLIENT_SESSION_COOKIE}=`);
  });

  it("requires COOKIE_SECRET in production", () => {
    expect(() => sessionCookieSecret({ NODE_ENV: "production" })).toThrow(
      "COOKIE_SECRET must be configured in production",
    );
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

  it("configures the production limiter for the exact ten-minute boundary", () => {
    for (let attempt = 1; attempt <= 5; attempt += 1) {
      expect(checkRateLimit("configured-boundary-client", 1_000).allowed).toBe(true);
    }

    expect(checkRateLimit("configured-boundary-client", 600_999)).toMatchObject({
      allowed: false,
      retryAfterSeconds: 1,
    });
    expect(checkRateLimit("configured-boundary-client", 601_000).allowed).toBe(true);
  });

  it("evicts expired entries before enforcing the map cap", () => {
    const check = createRateLimiter({ limit: 1, windowMs: 100, maxEntries: 2 });
    check("old-a", 0);
    check("old-b", 0);
    expect(check("new", 101).allowed).toBe(true);
  });
});
