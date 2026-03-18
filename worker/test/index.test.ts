import { describe, it, expect, beforeEach, vi } from "vitest";
import worker from "../src/index";
import { resetRateLimits } from "../src/rateLimit";

const env = { TMDB_API_KEY: "test-key" };
const ctx = { waitUntil: () => {}, passThroughOnException: () => {} } as any;

// Prevent real TMDB network calls in integration tests
const mockFetch = vi.fn().mockResolvedValue(
  new Response(JSON.stringify({ results: [] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  }),
);
vi.stubGlobal("fetch", mockFetch);

function makeRequest(url: string, method = "GET"): Request {
  return new Request(url, { method });
}

describe("Worker Integration", () => {
  beforeEach(() => {
    resetRateLimits();
  });

  it("returns 400 when title is missing", async () => {
    const res = await worker.fetch(makeRequest("https://worker.test/movie?year=2019"), env, ctx);
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toContain("Missing required");
  });

  it("returns 400 when year is missing", async () => {
    const res = await worker.fetch(makeRequest("https://worker.test/movie?title=Parasite"), env, ctx);
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toContain("Missing required");
  });

  it("returns 400 when both params are missing", async () => {
    const res = await worker.fetch(makeRequest("https://worker.test/movie"), env, ctx);
    expect(res.status).toBe(400);
  });

  it("returns 400 when year format is invalid", async () => {
    const res = await worker.fetch(
      makeRequest("https://worker.test/movie?title=Test&year=20xx"),
      env,
      ctx,
    );
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toContain("Invalid parameters");
  });

  it("returns 400 when title is too long", async () => {
    const longTitle = "a".repeat(201);
    const res = await worker.fetch(
      makeRequest(`https://worker.test/movie?title=${longTitle}&year=2020`),
      env,
      ctx,
    );
    expect(res.status).toBe(400);
    const body: any = await res.json();
    expect(body.error).toContain("Invalid parameters");
  });

  it("returns 404 for unknown paths", async () => {
    const res = await worker.fetch(makeRequest("https://worker.test/unknown"), env, ctx);
    expect(res.status).toBe(404);
  });

  it("returns 405 for non-GET methods", async () => {
    const res = await worker.fetch(
      makeRequest("https://worker.test/movie?title=Test&year=2020", "POST"),
      env,
      ctx,
    );
    expect(res.status).toBe(405);
  });

  it("returns 429 when rate limit is exceeded", async () => {
    for (let i = 0; i < 300; i++) {
      await worker.fetch(makeRequest("https://worker.test/movie?title=Test&year=2020"), env, ctx);
    }
    const res = await worker.fetch(makeRequest("https://worker.test/movie?title=Test&year=2020"), env, ctx);
    expect(res.status).toBe(429);
    const body: any = await res.json();
    expect(body.error).toContain("Rate limit");
    expect(res.headers.get("Retry-After")).toBeTruthy();
  }, 30_000);
});
