import { searchMovie, searchMovies, getMovieDetails, type Env } from "./tmdb";
import { checkRateLimit } from "./rateLimit";

type Handler = (params: URLSearchParams, env: Env) => Promise<Response>;

const invalid = () => Response.json({ error: "Invalid parameters" }, { status: 400 });

/** GET /movie?title=&year= — poster and director for an imported film. */
const handleMovie: Handler = async (params, env) => {
  const title = params.get("title");
  const year = params.get("year");

  if (!title || !year) {
    return Response.json(
      { error: "Missing required query parameters: title and year" },
      { status: 400 },
    );
  }

  if (title.length > 200 || !/^\d{4}$/.test(year)) return invalid();

  const result = await searchMovie(title, year, env.TMDB_API_KEY);

  if (result.posterUrl === null && result.director === null) {
    return Response.json(result, { status: 404 });
  }

  return Response.json(result);
};

/** GET /search?query= — films matching a title, for adding one by hand. */
const handleSearch: Handler = async (params, env) => {
  const query = params.get("query")?.trim();

  if (!query) {
    return Response.json({ error: "Missing required query parameter: query" }, { status: 400 });
  }

  if (query.length > 200) return invalid();

  const results = await searchMovies(query, env.TMDB_API_KEY);
  return Response.json({ results });
};

/** GET /details?id= — one film by TMDB id, with its director. */
const handleDetails: Handler = async (params, env) => {
  const id = params.get("id");

  if (!id) {
    return Response.json({ error: "Missing required query parameter: id" }, { status: 400 });
  }

  if (!/^\d{1,10}$/.test(id)) return invalid();

  const details = await getMovieDetails(Number(id), env.TMDB_API_KEY);

  if (!details) {
    return Response.json({ error: "Not found" }, { status: 404 });
  }

  return Response.json(details);
};

const routes: Record<string, Handler> = {
  "/movie": handleMovie,
  "/search": handleSearch,
  "/details": handleDetails,
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const handler = routes[url.pathname];

    if (!handler) {
      return Response.json({ error: "Not found" }, { status: 404 });
    }

    if (request.method !== "GET") {
      return Response.json({ error: "Method not allowed" }, { status: 405 });
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
      return await handler(url.searchParams, env);
    } catch {
      return Response.json({ error: "Internal server error" }, { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
