export type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  retryAfterSeconds: number;
};

type RateLimitOptions = {
  limit: number;
  windowMs: number;
  maxEntries: number;
};

type Entry = { count: number; resetAt: number };

export function createRateLimiter({ limit, windowMs, maxEntries }: RateLimitOptions) {
  const entries = new Map<string, Entry>();

  return (key: string, now = Date.now()): RateLimitResult => {
    for (const [entryKey, entry] of entries) {
      if (entry.resetAt <= now) entries.delete(entryKey);
    }

    let entry = entries.get(key);
    if (!entry) {
      if (entries.size >= maxEntries) {
        const oldestKey = entries.keys().next().value as string | undefined;
        if (oldestKey) entries.delete(oldestKey);
      }
      entry = { count: 0, resetAt: now + windowMs };
      entries.set(key, entry);
    }

    const retryAfterSeconds = Math.max(0, Math.ceil((entry.resetAt - now) / 1_000));
    if (entry.count >= limit) {
      return { allowed: false, remaining: 0, resetAt: entry.resetAt, retryAfterSeconds };
    }

    entry.count += 1;
    return {
      allowed: true,
      remaining: Math.max(0, limit - entry.count),
      resetAt: entry.resetAt,
      retryAfterSeconds,
    };
  };
}

// Deployment-edge throttling is still required because this state is instance-local.
export const checkRateLimit = createRateLimiter({
  limit: 5,
  windowMs: 10 * 60_000,
  maxEntries: 10_000,
});
