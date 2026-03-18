export interface TmdbResult {
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
      return { posterUrl: null, director: null };
    }

    const data = await response.json();
    return {
      posterUrl: data.posterUrl ?? null,
      director: data.director ?? null,
    };
  } catch {
    return { posterUrl: null, director: null };
  }
}
