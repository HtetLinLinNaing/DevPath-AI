# Signed Cookie Rate-Limit Design

## Goal

Limit each browser to five roadmap generations in a rolling fixed window of ten
minutes without grouping unrelated users by gateway IP address.

## Identity

The generate-roadmap route assigns an anonymous random UUID to a browser. The
server signs the UUID with HMAC-SHA256 using `COOKIE_SECRET` and stores the
`UUID.signature` value in an `HttpOnly` cookie.

The cookie is:

- scoped to `/api/generate-roadmap`;
- `SameSite=Lax`;
- `Secure` in production;
- valid for 30 days;
- inaccessible to browser JavaScript.

The server verifies the signature with a timing-safe comparison before trusting
the UUID. A missing, malformed, or invalidly signed cookie receives a new
identity. The cookie contains no job, profile, roadmap, or other personal data.

`COOKIE_SECRET` is mandatory in production. Local development and tests use a
clearly named non-production fallback so onboarding remains simple.

## Rate-Limit Policy

The existing bounded in-memory fixed-window limiter remains the storage
mechanism. Its policy changes to:

- maximum: 5 successful limit checks;
- window: 10 minutes;
- key: verified anonymous cookie UUID;
- sixth request before reset: HTTP 429 with `Retry-After`;
- request at or after the exact reset timestamp: allowed.

The limiter runs before request parsing and model invocation. A newly created
identity is used immediately for the current request and its signed cookie is
attached to the response.

There is deliberately no IP limit. This avoids collisions for users behind a
shared gateway. Clearing or blocking cookies can reset the browser identity, so
this mechanism is a fair-use and cost-control guard rather than strong bot
protection. Production edge abuse controls can be added independently without
changing the application identity model.

## Response Flow

After origin validation, the route resolves the signed-cookie identity and
checks its limiter bucket. All responses produced after that point—including
validation, rate-limit, provider, and success responses—attach the cookie when
a new identity was created.

Requests rejected by origin validation do not receive an identity cookie.

## Verification

Automated tests will prove:

1. A missing cookie creates a signed UUID cookie with the required attributes.
2. A valid signed cookie remains the same identity even when the request IP
   changes.
3. Two valid cookies from the same IP have independent limits.
4. A malformed or tampered cookie is not trusted and is replaced.
5. Requests one through five are allowed in the ten-minute window.
6. Request six is rejected with HTTP 429 and the correct `Retry-After`.
7. A request immediately before the reset remains rejected.
8. A request at the exact reset timestamp is allowed.
9. The model is never invoked for the rejected request.
