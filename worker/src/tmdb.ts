export interface Env {
  TMDB_API_KEY: string;
}

export interface MovieResult {
  tmdbId: number | null;
  posterUrl: string | null;
  director: string | null;
}

/** One film in a title search, enough to show a row and add it to the reel. */
export interface SearchHit {
  tmdbId: number;
  title: string;
  year: number;
  /** Full-size poster, the one stored with the film. */
  posterUrl: string | null;
  /** Small poster for search rows. */
  thumbUrl: string | null;
}

export interface MovieDetails {
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string | null;
  director: string | null;
}

const TMDB_API = "https://api.themoviedb.org/3";
const POSTER_BASE = "https://image.tmdb.org/t/p/w500";
const THUMB_BASE = "https://image.tmdb.org/t/p/w185";
const MAX_SEARCH_HITS = 12;

interface TmdbSearchResult {
  id: number;
  title?: string;
  release_date?: string;
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

interface TmdbMovieResponse {
  id: number;
  title: string;
  release_date?: string;
  poster_path: string | null;
  credits?: TmdbCreditsResponse;
}

function authHeaders(apiKey: string) {
  return { Authorization: `Bearer ${apiKey}` };
}

function posterUrl(path: string | null, base = POSTER_BASE): string | null {
  return path ? `${base}${path}` : null;
}

/** "2019-05-30" → 2019. Films with no release date have no year to rank by. */
function releaseYear(releaseDate: string | undefined): number | null {
  const year = Number.parseInt(releaseDate?.slice(0, 4) ?? "", 10);
  return Number.isFinite(year) && year > 0 ? year : null;
}

function directorOf(credits: TmdbCreditsResponse | undefined): string | null {
  return credits?.crew.find((c) => c.job === "Director")?.name ?? null;
}

export async function searchMovie(
  title: string,
  year: string,
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<MovieResult> {
  const searchUrl = new URL(`${TMDB_API}/search/movie`);
  searchUrl.searchParams.set("query", title);
  searchUrl.searchParams.set("year", year);

  const searchRes = await fetchFn(searchUrl.toString(), { headers: authHeaders(apiKey) });
  if (!searchRes.ok) {
    throw new Error(`TMDB search failed: ${searchRes.status}`);
  }

  const searchData: TmdbSearchResponse = await searchRes.json();

  if (searchData.results.length === 0) {
    return { tmdbId: null, posterUrl: null, director: null };
  }

  const movie = searchData.results[0];

  const creditsUrl = `${TMDB_API}/movie/${movie.id}/credits`;
  const creditsRes = await fetchFn(creditsUrl, { headers: authHeaders(apiKey) });

  let director: string | null = null;
  if (creditsRes.ok) {
    const creditsData: TmdbCreditsResponse = await creditsRes.json();
    director = directorOf(creditsData);
  }

  return { tmdbId: movie.id, posterUrl: posterUrl(movie.poster_path), director };
}

/** Title search for adding a film by hand. Skips entries with no release year. */
export async function searchMovies(
  query: string,
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<SearchHit[]> {
  const searchUrl = new URL(`${TMDB_API}/search/movie`);
  searchUrl.searchParams.set("query", query);
  searchUrl.searchParams.set("include_adult", "false");

  const res = await fetchFn(searchUrl.toString(), { headers: authHeaders(apiKey) });
  if (!res.ok) {
    throw new Error(`TMDB search failed: ${res.status}`);
  }

  const data: TmdbSearchResponse = await res.json();
  const hits: SearchHit[] = [];
  for (const result of data.results) {
    const year = releaseYear(result.release_date);
    if (year === null || !result.title) continue;
    hits.push({
      tmdbId: result.id,
      title: result.title,
      year,
      posterUrl: posterUrl(result.poster_path),
      thumbUrl: posterUrl(result.poster_path, THUMB_BASE),
    });
    if (hits.length === MAX_SEARCH_HITS) break;
  }
  return hits;
}

/** One film by TMDB id, with its director. Null when TMDB has no such film or no year. */
export async function getMovieDetails(
  tmdbId: number,
  apiKey: string,
  fetchFn: typeof fetch = fetch,
): Promise<MovieDetails | null> {
  const res = await fetchFn(`${TMDB_API}/movie/${tmdbId}?append_to_response=credits`, {
    headers: authHeaders(apiKey),
  });
  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`TMDB movie failed: ${res.status}`);
  }

  const data: TmdbMovieResponse = await res.json();
  const year = releaseYear(data.release_date);
  if (year === null) return null;

  return {
    tmdbId: data.id,
    title: data.title,
    year,
    posterUrl: posterUrl(data.poster_path),
    director: directorOf(data.credits),
  };
}
