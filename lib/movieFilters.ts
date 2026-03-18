import type { Movie } from '@/lib/schema';

export function filterMoviesByTitle(movies: Movie[], query: string): Movie[] {
  const trimmed = query.trim();
  if (trimmed === '') return movies;
  const lower = trimmed.toLowerCase();
  return movies.filter((m) => m.title.toLowerCase().includes(lower));
}

export function filterMoviesByMinRating(movies: Movie[], minRating: number): Movie[] {
  if (minRating <= 0) return movies;
  return movies.filter(
    (m) => m.letterboxdRating !== null && m.letterboxdRating >= minRating,
  );
}

export function applyFilters(
  movies: Movie[],
  query: string,
  minRating: number | null,
): Movie[] {
  let result = filterMoviesByTitle(movies, query);
  if (minRating !== null) {
    result = filterMoviesByMinRating(result, minRating);
  }
  return result;
}
