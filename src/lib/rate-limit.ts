// ============================================================
// Simple in-memory sliding window rate limiter
// ============================================================
// For production multi-instance deployments, replace the Map
// with a shared store (Redis INCR + EXPIRE).

const windowMs = 60_000; // 1-minute window

const store = new Map<string, { count: number; resetAt: number }>();

// Cleanup expired entries every 60 s to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt) store.delete(key);
  }
}, 60_000).unref?.(); // .unref() so the timer doesn't keep the process alive

export function rateLimit(
  key: string,
  maxRequests: number,
): { allowed: boolean; remaining: number } {
  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: maxRequests - entry.count };
}
