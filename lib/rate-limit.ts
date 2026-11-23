// lib/rate-limit.ts
// In-memory login throttling (OWASP A07). PM2 runs a single "fork"
// instance (ecosystem.config.js), so process memory is shared by all
// requests. If the app is ever scaled to several instances, move this
// to a shared store (Redis / SQL).

interface Bucket {
  failures: number;
  resetAt: number;
}

const WINDOW_MS = 15 * 60 * 1000;
const MAX_PER_USER_IP = 5; // same username from the same IP
const MAX_PER_IP = 30; // any username from the same IP (spraying)
const MAX_PER_USER = 20; // one username from any IP (IP rotation/spoofing)

const buckets = new Map<string, Bucket>();

function bucket(key: string, now: number): Bucket {
  let b = buckets.get(key);
  if (!b || b.resetAt <= now) {
    b = { failures: 0, resetAt: now + WINDOW_MS };
    buckets.set(key, b);
  }
  return b;
}

function keys(username: string, ip: string) {
  const u = username.trim().toLowerCase();
  return { userIp: `u:${u}|${ip}`, ip: `ip:${ip}`, user: `u:${u}` };
}

/** Returns seconds to wait if blocked, or 0 if the attempt may proceed. */
export function loginRetryAfter(username: string, ip: string): number {
  const now = Date.now();
  const k = keys(username, ip);
  const a = bucket(k.userIp, now);
  const b = bucket(k.ip, now);
  const c = bucket(k.user, now);
  if (a.failures >= MAX_PER_USER_IP)
    return Math.ceil((a.resetAt - now) / 1000);
  if (b.failures >= MAX_PER_IP) return Math.ceil((b.resetAt - now) / 1000);
  if (c.failures >= MAX_PER_USER) return Math.ceil((c.resetAt - now) / 1000);
  return 0;
}

export function recordLoginFailure(username: string, ip: string): void {
  const now = Date.now();
  const k = keys(username, ip);
  bucket(k.userIp, now).failures++;
  bucket(k.ip, now).failures++;
  bucket(k.user, now).failures++;
  // opportunistic cleanup
  if (buckets.size > 10_000) {
    for (const [key, v] of buckets) if (v.resetAt <= now) buckets.delete(key);
  }
}

export function recordLoginSuccess(username: string, ip: string): void {
  const k = keys(username, ip);
  buckets.delete(k.userIp);
  buckets.delete(k.user);
}

/**
 * Client IP as set by nginx (`proxy_set_header X-Real-IP $remote_addr`).
 * Only trustworthy when nginx overwrites the header; the per-username cap
 * below still applies if an attacker spoofs it.
 */
export function clientIp(headers: Headers): string {
  const real = headers.get("x-real-ip");
  if (real) return real.trim();
  const fwd = headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",").at(-1)!.trim();
  return "unknown";
}
