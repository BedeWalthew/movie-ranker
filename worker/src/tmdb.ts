export interface Env {
  TMDB_API_KEY: string;
}

export interface MovieResult {
  posterUrl: string | null;
  director: string | null;
}

interface TmdbSearchResult {
  id: number;
  poster_path: string | null;
}

interface TmdbSearchResponse {
  results: TmdbSearchResult[];
}

interface TmdbCrewMember {
  job: string;
  name: string;
}

interface TmdbCreditsResponse {
  crew: TmdbCrewMember[];
}

export async function searchMovie(
  title: string,
  year: string,
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<MovieResult> {
  const searchUrl = new URL("https://api.themoviedb.org/3/search/movie");
  searchUrl.searchParams.set("api_key", apiKey);
  searchUrl.searchParams.set("query", title);
  searchUrl.searchParams.set("year", year);

  const searchRes = await fetchFn(searchUrl.toString());
  if (!searchRes.ok) {
    throw new Error(`TMDB search failed: ${searchRes.status}`);
  }

  const searchData: TmdbSearchResponse = await searchRes.json();

  if (searchData.results.length === 0) {
    return { posterUrl: null, director: null };
  }

  const movie = searchData.results[0];
  const posterUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : null;

  const creditsUrl = `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${apiKey}`;
  const creditsRes = await fetchFn(creditsUrl);

  let director: string | null = null;
  if (creditsRes.ok) {
    const creditsData: TmdbCreditsResponse = await creditsRes.json();
    const directorEntry = creditsData.crew.find((c) => c.job === "Director");
    director = directorEntry?.name ?? null;
  }

  return { posterUrl, director };
}
