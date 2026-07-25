# Signed Cookie Rate Limit Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enforce five roadmap generations per anonymous browser per ten minutes using an HMAC-signed UUID cookie, without IP-based identity collisions.

**Architecture:** Add a focused HTTP identity module that verifies or creates the anonymous signed cookie and returns an optional `Set-Cookie` value. Keep the bounded in-memory limiter, change its window to ten minutes, and key it exclusively by the verified UUID. The route attaches a newly issued cookie to every response after origin validation.

**Tech Stack:** Next.js 15 Route Handlers, TypeScript, Node.js `crypto`, Vitest

## Global Constraints

- Allow exactly five generation checks in each fixed ten-minute window.
- Do not use an IP address as the limiter key or fallback.
- Store only an anonymous UUID and HMAC signature in the cookie.
- Use `COOKIE_SECRET`; require it in production and use a development-only fallback elsewhere.
- Set `HttpOnly`, `SameSite=Lax`, `Path=/api/generate-roadmap`, 30-day `Max-Age`, and production-only `Secure`.
- Preserve the bounded, instance-local limiter and document that edge abuse protection remains separate.

---

### Task 1: Signed Anonymous Browser Identity

**Files:**
- Create: `src/lib/http/client-session.ts`
- Modify: `tests/unit/http.test.ts`

**Interfaces:**
- Produces: `resolveClientSession(headers: Headers, options?): { identity: string; setCookie?: string }`
- Produces: `CLIENT_SESSION_COOKIE`, the stable cookie name used by route tests.
- Consumes: Node.js `createHmac`, `randomUUID`, and `timingSafeEqual`.

- [ ] **Step 1: Write failing identity tests**

Add tests proving that a missing cookie creates a signed UUID cookie with the required attributes, a valid cookie preserves identity after IP headers change, a tampered signature creates a replacement identity, and production without `COOKIE_SECRET` throws.

- [ ] **Step 2: Verify the tests fail for the missing module**

Run: `npm test -- --run tests/unit/http.test.ts`

Expected: FAIL because `@/lib/http/client-session` does not exist.

- [ ] **Step 3: Implement the minimal identity module**

Implement HMAC-SHA256 signing, timing-safe verification, defensive cookie parsing, 30-day serialization, development fallback secret, and dependency injection for UUID/time/environment in tests.

- [ ] **Step 4: Verify identity tests pass**

Run: `npm test -- --run tests/unit/http.test.ts`

Expected: all HTTP unit tests pass.

### Task 2: Ten-Minute Cookie-Keyed Route Limit

**Files:**
- Modify: `src/lib/http/rate-limit.ts`
- Modify: `src/app/api/generate-roadmap/route.ts`
- Modify: `tests/route/generate-roadmap-route.test.ts`

**Interfaces:**
- Consumes: `resolveClientSession(headers)` from Task 1.
- Produces: `checkRateLimit(identity, now?)` allowing five checks per 600,000 ms.

- [ ] **Step 1: Write failing route and boundary tests**

Add literal boundary assertions that checks one through five pass, the sixth at `599_999` ms remains rejected, and a request at `600_000` ms is allowed. Add route tests that carry the returned cookie, prove the sixth request receives HTTP 429 with `Retry-After`, prove a changing IP does not reset a cookie identity, and prove separate cookie identities on one IP do not collide.

- [ ] **Step 2: Verify the tests fail for the old IP identity and one-minute window**

Run: `npm test -- --run tests/unit/http.test.ts tests/route/generate-roadmap-route.test.ts`

Expected: FAIL because the route does not issue or consume the cookie and the limiter resets after one minute.

- [ ] **Step 3: Implement cookie-keyed limiting**

Resolve the session after origin validation, pass `session.identity` to the limiter, attach `session.setCookie` to success and error response headers, remove `getClientIdentity` from the route, and set the limiter window to `10 * 60_000`.

- [ ] **Step 4: Verify focused tests pass**

Run: `npm test -- --run tests/unit/http.test.ts tests/route/generate-roadmap-route.test.ts`

Expected: all focused tests pass and the provider mock is not called for request six.

### Task 3: Configuration, Documentation, and Full Verification

**Files:**
- Modify: `.env.example`
- Modify: `README.md`

**Interfaces:**
- Documents: `COOKIE_SECRET` production requirement and cookie-only fairness trade-off.

- [ ] **Step 1: Add configuration documentation**

Add `COOKIE_SECRET=` to `.env.example`. Update the README security and deployment sections from IP/edge-identity wording to the signed anonymous browser cookie, five-per-ten-minute policy, shared-IP safety, cookie-reset limitation, and separate production edge protection.

- [ ] **Step 2: Run complete verification**

Run:

```text
npm test
npm run lint -- --quiet
npm run typecheck
npm run build
```

Expected: all tests and static/build checks pass.

- [ ] **Step 3: Review the focused diff**

Run `git diff --check` and inspect only the task files to confirm no raw IP, secret, UUID signature, or private request content is logged.
