import { createHash } from "node:crypto";

export function getClientIdentity(
  headers: Headers,
  salt = process.env.RATE_LIMIT_SALT ?? "devpath-local-rate-limit",
): string {
  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const rawIdentity = forwarded || headers.get("x-real-ip")?.trim() || "anonymous";
  return createHash("sha256").update(`${salt}:${rawIdentity}`).digest("hex");
}

