import { describe, it, expect } from "vitest";
import { searchMovie } from "../src/tmdb";

function mockFetch(responses: Record<string, { status: number; body: unknown }>): typeof fetch {
  return (async (input: RequestInfo | URL) => {
    const url = typeof input === "string" ? input : input.toString();
    for (const [pattern, resp] of Object.entries(responses)) {
      if (url.includes(pattern)) {
        return new Response(JSON.stringify(resp.body), {
          status: resp.status,
          headers: { "Content-Type": "application/json" },
        });
      }
    }
    return new Response("Not Found", { status: 404 });
  }) as typeof fetch;
}

describe("TMDB Client", () => {
  it("returns posterUrl and director for a valid movie", async () => {
    const fetcher = mockFetch({
      "search/movie": {
        status: 200,
        body: {
          results: [{ id: 496243, poster_path: "/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg" }],
        },
      },
      "496243/credits": {
        status: 200,
        body: {
          crew: [
            { job: "Producer", name: "Kwak Sin-ae" },
            { job: "Director", name: "Bong Joon-ho" },
          ],
        },
      },
    });

    const result = await searchMovie("Parasite", "2019", "fake-key", fetcher);
    expect(result.posterUrl).toBe("https://image.tmdb.org/t/p/w500/7IiTTgloJzvGI1TAYymCfbfl3vT.jpg");
    expect(result.director).toBe("Bong Joon-ho");
  });

  it("returns nulls when no movie is found", async () => {
    const fetcher = mockFetch({
      "search/movie": {
        status: 200,
        body: { results: [] },
      },
    });

    const result = await searchMovie("NonexistentMovie12345", "2099", "fake-key", fetcher);
    expect(result.posterUrl).toBeNull();
    expect(result.director).toBeNull();
  });

  it("returns null posterUrl when poster_path is null", async () => {
    const fetcher = mockFetch({
      "search/movie": {
        status: 200,
        body: { results: [{ id: 999, poster_path: null }] },
      },
      "999/credits": {
        status: 200,
        body: { crew: [{ job: "Director", name: "Unknown Director" }] },
      },
    });

    const result = await searchMovie("NoPoster", "2020", "fake-key", fetcher);
    expect(result.posterUrl).toBeNull();
    expect(result.director).toBe("Unknown Director");
  });

  it("returns null director when no director in credits", async () => {
    const fetcher = mockFetch({
      "search/movie": {
        status: 200,
        body: { results: [{ id: 100, poster_path: "/abc.jpg" }] },
      },
      "100/credits": {
        status: 200,
        body: { crew: [{ job: "Producer", name: "Some Producer" }] },
      },
    });

    const result = await searchMovie("NoDirector", "2020", "fake-key", fetcher);
    expect(result.posterUrl).toBe("https://image.tmdb.org/t/p/w500/abc.jpg");
    expect(result.director).toBeNull();
  });

  it("throws when TMDB search API returns an error", async () => {
    const fetcher = mockFetch({
      "search/movie": { status: 401, body: { status_message: "Invalid API key" } },
    });

    await expect(searchMovie("Test", "2020", "bad-key", fetcher)).rejects.toThrow(
      "TMDB search failed: 401",
    );
  });

  it("passes api_key, query, and year as search params", async () => {
    let capturedUrl = "";
    const fetcher = (async (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : input.toString();
      capturedUrl = url;
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await searchMovie("The Matrix", "1999", "my-api-key", fetcher);
    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("api_key")).toBe("my-api-key");
    expect(parsed.searchParams.get("query")).toBe("The Matrix");
    expect(parsed.searchParams.get("year")).toBe("1999");
  });
});
