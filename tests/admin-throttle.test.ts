import { describe, it, expect } from 'vitest';
import {
  WINDOW_MS,
  MAX_FAILURES,
  clientIp,
  retryAfterSeconds,
  recordFailure,
  clearFailures,
} from '../src/lib/admin-throttle';

// The throttle keeps module-scope state, so every test uses its own IP.
const T0 = 1_000_000_000;

function fail(ip: string, times: number, from = T0, stepMs = 1000) {
  for (let i = 0; i < times; i++) recordFailure(ip, from + i * stepMs);
}

describe('admin login throttle', () => {
  it('stays open below the failure limit', () => {
    fail('10.0.0.1', MAX_FAILURES - 1);
    expect(retryAfterSeconds('10.0.0.1', T0 + MAX_FAILURES * 1000)).toBe(0);
  });

  it('blocks at the limit and tells the caller how long to wait', () => {
    fail('10.0.0.2', MAX_FAILURES); // last failure at T0 + 9000
    const now = T0 + 10_000;
    // The oldest failure (at T0) has to age out of the window first.
    expect(retryAfterSeconds('10.0.0.2', now)).toBe((WINDOW_MS - 10_000) / 1000);
  });

  it('unblocks as failures slide out of the window', () => {
    fail('10.0.0.3', MAX_FAILURES);
    expect(retryAfterSeconds('10.0.0.3', T0 + 10_000)).toBeGreaterThan(0);
    // One ms after the oldest failure expires, only MAX-1 remain in the window.
    expect(retryAfterSeconds('10.0.0.3', T0 + WINDOW_MS + 1)).toBe(0);
  });

  it('a successful login wipes the slate', () => {
    fail('10.0.0.4', MAX_FAILURES);
    clearFailures('10.0.0.4');
    expect(retryAfterSeconds('10.0.0.4', T0 + 10_000)).toBe(0);
  });

  it('tracks IPs independently', () => {
    fail('10.0.0.5', MAX_FAILURES);
    expect(retryAfterSeconds('10.0.0.5', T0 + 10_000)).toBeGreaterThan(0);
    expect(retryAfterSeconds('10.0.0.6', T0 + 10_000)).toBe(0);
  });

  it('forgets everything after a quiet window', () => {
    fail('10.0.0.7', MAX_FAILURES);
    const later = T0 + WINDOW_MS + 10_000;
    expect(retryAfterSeconds('10.0.0.7', later)).toBe(0);
    // …and old, expired failures don't count toward a fresh streak.
    fail('10.0.0.7', 1, later);
    expect(retryAfterSeconds('10.0.0.7', later + 1000)).toBe(0);
  });
});

describe('clientIp', () => {
  const req = (xff?: string) =>
    new Request('http://localhost/admin/auth', {
      method: 'POST',
      headers: xff === undefined ? {} : { 'x-forwarded-for': xff },
    });

  it('takes the first hop of x-forwarded-for, trimmed', () => {
    expect(clientIp(req('203.0.113.7, 10.1.1.1, 10.2.2.2'))).toBe('203.0.113.7');
    expect(clientIp(req('  203.0.113.7  '))).toBe('203.0.113.7');
  });

  it("falls back to 'unknown' when the header is missing or empty", () => {
    expect(clientIp(req())).toBe('unknown');
    expect(clientIp(req(''))).toBe('unknown');
  });
});
