export interface TmdbResult {
  tmdbId: number | null;
  posterUrl: string | null;
  director: string | null;
}

/** A film from a title search. */
export interface FilmSearchHit {
  tmdbId: number;
  title: string;
  year: number;
  /** Full-size poster, stored with the film when it is added. */
  posterUrl: string | null;
  /** Small poster for search rows. */
  thumbUrl: string | null;
}

export interface FilmDetails {
  tmdbId: number;
  title: string;
  year: number;
  posterUrl: string | null;
  director: string | null;
}

export async function fetchMovieDetails(
  title: string,
  year: number,
  workerUrl: string,
): Promise<TmdbResult> {
  try {
    const params = new URLSearchParams({ title, year: String(year) });
    const response = await fetch(`${workerUrl}/movie?${params}`);

    if (!response.ok) {
      return { tmdbId: null, posterUrl: null, director: null };
    }

    const data = await response.json();
    return {
      tmdbId: data.tmdbId ?? null,
      posterUrl: data.posterUrl ?? null,
      director: data.director ?? null,
    };
  } catch {
    return { tmdbId: null, posterUrl: null, director: null };
  }
}

/** Films matching a title. Throws when the search cannot run, so the sheet can say so. */
export async function searchFilms(query: string, workerUrl: string): Promise<FilmSearchHit[]> {
  const params = new URLSearchParams({ query });
  const response = await fetch(`${workerUrl}/search?${params}`);

  if (!response.ok) {
    throw new Error(`Search failed: ${response.status}`);
  }

  const data = await response.json();
  return Array.isArray(data.results) ? data.results : [];
}

/** One film with its director, or null when it cannot be fetched. */
export async function fetchFilmDetails(
  tmdbId: number,
  workerUrl: string,
): Promise<FilmDetails | null> {
  try {
    const params = new URLSearchParams({ id: String(tmdbId) });
    const response = await fetch(`${workerUrl}/details?${params}`);
    if (!response.ok) return null;
    return await response.json();
  } catch {
    return null;
  }
}
