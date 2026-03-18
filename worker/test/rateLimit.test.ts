import { describe, it, expect, beforeEach } from "vitest";
import { checkRateLimit, resetRateLimits } from "../src/rateLimit";

describe("Rate Limiting", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("allows the first request from an IP", () => {
    const result = checkRateLimit("1.2.3.4", 1000);
    expect(result.allowed).toBe(true);
    expect(result.retryAfterMs).toBe(0);
  });

  it("allows up to 30 requests in a window", () => {
    const now = 1000;
    for (let i = 0; i < 30; i++) {
      const result = checkRateLimit("1.2.3.4", now);
      expect(result.allowed).toBe(true);
    }
  });

  it("blocks the 31st request in the same window", () => {
    const now = 1000;
    for (let i = 0; i < 30; i++) {
      checkRateLimit("1.2.3.4", now);
    }
    const result = checkRateLimit("1.2.3.4", now);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBeGreaterThan(0);
  });

  it("resets the count after the window expires", () => {
    const now = 1000;
    for (let i = 0; i < 30; i++) {
      checkRateLimit("1.2.3.4", now);
    }
    const later = now + 61_000;
    const result = checkRateLimit("1.2.3.4", later);
    expect(result.allowed).toBe(true);
  });

  it("tracks IPs independently", () => {
    const now = 1000;
    for (let i = 0; i < 30; i++) {
      checkRateLimit("1.2.3.4", now);
    }
    const blockedResult = checkRateLimit("1.2.3.4", now);
    expect(blockedResult.allowed).toBe(false);

    const otherIp = checkRateLimit("5.6.7.8", now);
    expect(otherIp.allowed).toBe(true);
  });

  it("returns correct retryAfterMs when blocked", () => {
    const now = 1000;
    for (let i = 0; i < 30; i++) {
      checkRateLimit("1.2.3.4", now);
    }
    const result = checkRateLimit("1.2.3.4", now + 10_000);
    expect(result.allowed).toBe(false);
    expect(result.retryAfterMs).toBe(50_000);
  });
});
