// Fixed-window in-memory rate limiter for the public routes. Good enough for
// a small hotel site on Vercel: each serverless instance keeps its own
// window, which still stops a single client hammering one instance.

const WINDOW_MS = 60_000;

type Window = { count: number; resetAt: number };
const windows = new Map<string, Window>();

/** True if this key is within its per-minute budget; false if over. */
export function checkRateLimit(key: string, maxPerMinute: number): boolean {
  const now = Date.now();
  const win = windows.get(key);
  if (!win || now >= win.resetAt) {
    windows.set(key, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  win.count += 1;
  if (win.count > maxPerMinute) return false;
  return true;
}

/** Client IP from Vercel/proxy headers, with a stable fallback. */
export function clientIp(request: Request): string {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "unknown";
}
