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

  describe("/search", () => {
    it("returns 400 when query is missing or blank", async () => {
      for (const url of ["https://worker.test/search", "https://worker.test/search?query=%20%20"]) {
        const res = await worker.fetch(makeRequest(url), env, ctx);
        expect(res.status).toBe(400);
        const body: any = await res.json();
        expect(body.error).toContain("Missing required");
      }
    });

    it("returns 400 when query is too long", async () => {
      const res = await worker.fetch(
        makeRequest(`https://worker.test/search?query=${"a".repeat(201)}`),
        env,
        ctx,
      );
      expect(res.status).toBe(400);
    });

    it("returns matching films as results", async () => {
      mockFetch.mockImplementationOnce(async () =>
        new Response(
          JSON.stringify({
            results: [{ id: 438631, title: "Dune", release_date: "2021-09-15", poster_path: "/d.jpg" }],
          }),
          { status: 200 },
        ),
      );

      const res = await worker.fetch(makeRequest("https://worker.test/search?query=dune"), env, ctx);

      expect(res.status).toBe(200);
      const body: any = await res.json();
      expect(body.results).toEqual([
        {
          tmdbId: 438631,
          title: "Dune",
          year: 2021,
          posterUrl: "https://image.tmdb.org/t/p/w500/d.jpg",
          thumbUrl: "https://image.tmdb.org/t/p/w185/d.jpg",
        },
      ]);
    });

    it("returns 500 when TMDB fails", async () => {
      mockFetch.mockImplementationOnce(async () => new Response("{}", { status: 503 }));
      const res = await worker.fetch(makeRequest("https://worker.test/search?query=dune"), env, ctx);
      expect(res.status).toBe(500);
    });
  });

  describe("/details", () => {
    it("returns 400 when id is missing or not a number", async () => {
      const missing = await worker.fetch(makeRequest("https://worker.test/details"), env, ctx);
      expect(missing.status).toBe(400);

      const invalid = await worker.fetch(makeRequest("https://worker.test/details?id=12a"), env, ctx);
      expect(invalid.status).toBe(400);
    });

    it("returns the film with its director", async () => {
      mockFetch.mockImplementationOnce(async () =>
        new Response(
          JSON.stringify({
            id: 496243,
            title: "Parasite",
            release_date: "2019-05-30",
            poster_path: null,
            credits: { crew: [{ job: "Director", name: "Bong Joon-ho" }] },
          }),
          { status: 200 },
        ),
      );

      const res = await worker.fetch(makeRequest("https://worker.test/details?id=496243"), env, ctx);

      expect(res.status).toBe(200);
      expect(await res.json()).toEqual({
        tmdbId: 496243,
        title: "Parasite",
        year: 2019,
        posterUrl: null,
        director: "Bong Joon-ho",
      });
    });

    it("returns 404 when TMDB has no such film", async () => {
      mockFetch.mockImplementationOnce(async () => new Response("{}", { status: 404 }));
      const res = await worker.fetch(makeRequest("https://worker.test/details?id=1"), env, ctx);
      expect(res.status).toBe(404);
    });

    it("returns 405 for non-GET methods", async () => {
      const res = await worker.fetch(makeRequest("https://worker.test/details?id=1", "POST"), env, ctx);
      expect(res.status).toBe(405);
    });
  });
});
