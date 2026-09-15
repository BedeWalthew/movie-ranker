import { describe, it, expect } from "vitest";
import { searchMovie, searchMovies, getMovieDetails } from "../src/tmdb";

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
    expect(result.tmdbId).toBe(496243);
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
    expect(result.tmdbId).toBeNull();
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

  it("passes query and year as search params and API key as Authorization header", async () => {
    let capturedUrl = "";
    let capturedHeaders: HeadersInit | undefined;
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = typeof input === "string" ? input : input.toString();
      capturedUrl = url;
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ results: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }) as typeof fetch;

    await searchMovie("The Matrix", "1999", "my-api-key", fetcher);
    const parsed = new URL(capturedUrl);
    expect(parsed.searchParams.get("api_key")).toBeNull();
    expect(parsed.searchParams.get("query")).toBe("The Matrix");
    expect(parsed.searchParams.get("year")).toBe("1999");
    expect((capturedHeaders as Record<string, string>)?.Authorization).toBe("Bearer my-api-key");
  });
});

describe("searchMovies", () => {
  it("returns title, year, full poster and thumbnail for each hit", async () => {
    const fetcher = mockFetch({
      "search/movie": {
        status: 200,
        body: {
          results: [
            { id: 438631, title: "Dune", release_date: "2021-09-15", poster_path: "/d5NX.jpg" },
            { id: 841, title: "Dune", release_date: "1984-12-14", poster_path: null },
          ],
        },
      },
    });

    const hits = await searchMovies("dune", "fake-key", fetcher);

    expect(hits).toEqual([
      {
        tmdbId: 438631,
        title: "Dune",
        year: 2021,
        posterUrl: "https://image.tmdb.org/t/p/w500/d5NX.jpg",
        thumbUrl: "https://image.tmdb.org/t/p/w185/d5NX.jpg",
      },
      { tmdbId: 841, title: "Dune", year: 1984, posterUrl: null, thumbUrl: null },
    ]);
  });

  it("skips films with no release year", async () => {
    const fetcher = mockFetch({
      "search/movie": {
        status: 200,
        body: {
          results: [
            { id: 1, title: "Announced", release_date: "", poster_path: null },
            { id: 2, title: "Undated", poster_path: null },
            { id: 3, title: "Released", release_date: "2020-01-01", poster_path: null },
          ],
        },
      },
    });

    const hits = await searchMovies("film", "fake-key", fetcher);
    expect(hits.map((h) => h.tmdbId)).toEqual([3]);
  });

  it("returns at most 12 hits", async () => {
    const results = Array.from({ length: 20 }, (_, i) => ({
      id: i + 1,
      title: `Film ${i}`,
      release_date: "2000-01-01",
      poster_path: null,
    }));
    const fetcher = mockFetch({ "search/movie": { status: 200, body: { results } } });

    expect(await searchMovies("film", "fake-key", fetcher)).toHaveLength(12);
  });

  it("searches without a year, excludes adult titles and sends the key as a header", async () => {
    let capturedUrl = "";
    let capturedHeaders: HeadersInit | undefined;
    const fetcher = (async (input: RequestInfo | URL, init?: RequestInit) => {
      capturedUrl = input.toString();
      capturedHeaders = init?.headers;
      return new Response(JSON.stringify({ results: [] }), { status: 200 });
    }) as typeof fetch;

    await searchMovies("Lock, Stock", "my-api-key", fetcher);

    const parsed = new URL(capturedUrl);
    expect(parsed.pathname).toBe("/3/search/movie");
    expect(parsed.searchParams.get("query")).toBe("Lock, Stock");
    expect(parsed.searchParams.get("year")).toBeNull();
    expect(parsed.searchParams.get("include_adult")).toBe("false");
    expect((capturedHeaders as Record<string, string>)?.Authorization).toBe("Bearer my-api-key");
  });

  it("throws when TMDB search fails", async () => {
    const fetcher = mockFetch({ "search/movie": { status: 503, body: {} } });
    await expect(searchMovies("dune", "fake-key", fetcher)).rejects.toThrow("TMDB search failed: 503");
  });
});

describe("getMovieDetails", () => {
  it("returns the film with its director in one request", async () => {
    const urls: string[] = [];
    const fetcher = (async (input: RequestInfo | URL) => {
      urls.push(input.toString());
      return new Response(
        JSON.stringify({
          id: 496243,
          title: "Parasite",
          release_date: "2019-05-30",
          poster_path: "/7IiT.jpg",
          credits: { crew: [{ job: "Director", name: "Bong Joon-ho" }] },
        }),
        { status: 200 },
      );
    }) as typeof fetch;

    const details = await getMovieDetails(496243, "fake-key", fetcher);

    expect(urls).toEqual(["https://api.themoviedb.org/3/movie/496243?append_to_response=credits"]);
    expect(details).toEqual({
      tmdbId: 496243,
      title: "Parasite",
      year: 2019,
      posterUrl: "https://image.tmdb.org/t/p/w500/7IiT.jpg",
      director: "Bong Joon-ho",
    });
  });

  it("returns null when TMDB has no such film", async () => {
    const fetcher = mockFetch({ "movie/999999": { status: 404, body: {} } });
    expect(await getMovieDetails(999999, "fake-key", fetcher)).toBeNull();
  });

  it("returns null for a film with no release year", async () => {
    const fetcher = mockFetch({
      "movie/5": { status: 200, body: { id: 5, title: "Someday", release_date: "", poster_path: null } },
    });
    expect(await getMovieDetails(5, "fake-key", fetcher)).toBeNull();
  });

  it("throws on other TMDB errors", async () => {
    const fetcher = mockFetch({ "movie/5": { status: 500, body: {} } });
    await expect(getMovieDetails(5, "fake-key", fetcher)).rejects.toThrow("TMDB movie failed: 500");
  });
});
