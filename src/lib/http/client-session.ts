import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export const CLIENT_SESSION_COOKIE = "devpath_user_id";

const COOKIE_MAX_AGE_SECONDS = 30 * 24 * 60 * 60;
const COOKIE_PATH = "/api/generate-roadmap";
const DEVELOPMENT_COOKIE_SECRET = "devpath-ai-local-cookie-secret";
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type CookieEnvironment = {
  COOKIE_SECRET?: string;
  NODE_ENV?: string;
};

type ResolveClientSessionOptions = {
  createId?: () => string;
  secret?: string;
  secure?: boolean;
};

export type ClientSession = {
  identity: string;
  setCookie?: string;
};

export function sessionCookieSecret(
  environment: CookieEnvironment = process.env,
): string {
  const configured = environment.COOKIE_SECRET?.trim();
  if (configured) return configured;
  if (environment.NODE_ENV === "production") {
    throw new Error("COOKIE_SECRET must be configured in production");
  }
  return DEVELOPMENT_COOKIE_SECRET;
}

function signIdentity(identity: string, secret: string): string {
  return createHmac("sha256", secret).update(identity).digest("base64url");
}

function signaturesMatch(actual: string, expected: string): boolean {
  const actualBytes = Buffer.from(actual);
  const expectedBytes = Buffer.from(expected);
  return actualBytes.length === expectedBytes.length
    && timingSafeEqual(actualBytes, expectedBytes);
}

function cookieValue(headers: Headers): string | undefined {
  const cookieHeader = headers.get("cookie");
  if (!cookieHeader) return undefined;

  for (const part of cookieHeader.split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0) continue;
    const name = part.slice(0, separator).trim();
    if (name !== CLIENT_SESSION_COOKIE) continue;
    try {
      return decodeURIComponent(part.slice(separator + 1).trim());
    } catch {
      return undefined;
    }
  }
  return undefined;
}

function verifiedIdentity(headers: Headers, secret: string): string | undefined {
  const value = cookieValue(headers);
  if (!value) return undefined;
  const separator = value.lastIndexOf(".");
  if (separator < 1) return undefined;

  const identity = value.slice(0, separator);
  const signature = value.slice(separator + 1);
  if (!UUID_PATTERN.test(identity) || !signature) return undefined;

  const expected = signIdentity(identity, secret);
  return signaturesMatch(signature, expected) ? identity : undefined;
}

function serializeCookie(identity: string, secret: string, secure: boolean): string {
  const signedValue = `${identity}.${signIdentity(identity, secret)}`;
  return [
    `${CLIENT_SESSION_COOKIE}=${encodeURIComponent(signedValue)}`,
    `Max-Age=${COOKIE_MAX_AGE_SECONDS}`,
    `Path=${COOKIE_PATH}`,
    "HttpOnly",
    "SameSite=Lax",
    secure ? "Secure" : undefined,
  ].filter(Boolean).join("; ");
}

export function resolveClientSession(
  headers: Headers,
  options: ResolveClientSessionOptions = {},
): ClientSession {
  const secret = options.secret ?? sessionCookieSecret();
  const existingIdentity = verifiedIdentity(headers, secret);
  if (existingIdentity) return { identity: existingIdentity };

  const identity = (options.createId ?? randomUUID)();
  return {
    identity,
    setCookie: serializeCookie(
      identity,
      secret,
      options.secure ?? process.env.NODE_ENV === "production",
    ),
  };
}
