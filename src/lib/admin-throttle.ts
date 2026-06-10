// ============================================================
// Brute-force throttle for the admin login: after MAX_FAILURES wrong passcodes
// from one IP inside WINDOW_MS (sliding window), /admin/auth answers 429 with
// Retry-After until the oldest failure ages out. A correct passcode clears the
// IP's slate.
//
// Deliberately in-memory and dependency-free. The Map lives at module scope, so
// on Vercel it only survives as long as one warm serverless instance and isn't
// shared across parallel instances — an attacker spread over N instances gets
// N windows, and a cold start forgets everything. That still caps online
// guessing to a crawl (vs. unlimited attempts), which is proportionate for a
// single hand-set passcode; a shared store (Turso) is the upgrade path if this
// ever needs to be airtight.
// ============================================================

export const WINDOW_MS = 15 * 60 * 1000;
export const MAX_FAILURES = 10;
const MAX_TRACKED_IPS = 1000; // sweep guard so a spray of spoofed IPs can't grow the Map unbounded

const failures = new Map<string, number[]>(); // ip -> timestamps (ms) of recent failures

/** First hop of x-forwarded-for. Vercel's proxy sets the header itself, so the
    first entry is the real client; on hosts that pass it through untouched it's
    self-reported — acceptable here (worst case the attacker rotates keys, which
    the MAX_TRACKED_IPS sweep keeps bounded). */
export function clientIp(request: Request): string {
  const firstHop = (request.headers.get('x-forwarded-for') ?? '').split(',')[0].trim();
  return firstHop || 'unknown';
}

/** Seconds the IP must wait before its next attempt — 0 when not blocked. */
export function retryAfterSeconds(ip: string, now: number = Date.now()): number {
  const recent = prune(ip, now);
  if (recent.length < MAX_FAILURES) return 0;
  // The oldest failure still inside the window has to age out first.
  const oldestCounted = recent[recent.length - MAX_FAILURES];
  return Math.max(1, Math.ceil((oldestCounted + WINDOW_MS - now) / 1000));
}

export function recordFailure(ip: string, now: number = Date.now()): void {
  if (failures.size >= MAX_TRACKED_IPS && !failures.has(ip)) sweepStale(now);
  const recent = prune(ip, now);
  recent.push(now);
  failures.set(ip, recent);
}

export function clearFailures(ip: string): void {
  failures.delete(ip);
}

/** Drop this IP's failures that fell out of the window; returns what's left. */
function prune(ip: string, now: number): number[] {
  const recent = (failures.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length === 0) failures.delete(ip);
  else failures.set(ip, recent);
  return recent;
}

function sweepStale(now: number): void {
  for (const ip of [...failures.keys()]) prune(ip, now);
}
