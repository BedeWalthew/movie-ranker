import { searchMovie, type Env } from "./tmdb";
import { checkRateLimit } from "./rateLimit";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname !== "/movie") {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
    }

    const title = url.searchParams.get("title");
    const year = url.searchParams.get("year");

    if (!title || !year) {
      return Response.json(
        { error: "Missing required query parameters: title and year" },
        { status: 400 },
      );
    }

    const ip = request.headers.get("CF-Connecting-IP") ?? "unknown";
    const rateCheck = checkRateLimit(ip);
    if (!rateCheck.allowed) {
      return Response.json(
        { error: "Rate limit exceeded" },
        {
          status: 429,
          headers: { "Retry-After": String(Math.ceil(rateCheck.retryAfterMs / 1000)) },
        },
      );
    }

    try {
      const result = await searchMovie(title, year, env.TMDB_API_KEY);

      if (result.posterUrl === null && result.director === null) {
        return Response.json(result, { status: 404 });
      }

      return Response.json(result);
    } catch {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
