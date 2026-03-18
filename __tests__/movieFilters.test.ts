import { filterMoviesByTitle, filterMoviesByMinRating, applyFilters } from '@/lib/movieFilters';
import type { Movie } from '@/lib/schema';

const makeMovie = (overrides: Partial<Movie> = {}): Movie => ({
  id: '1',
  title: 'Parasite',
  year: 2019,
  letterboxdUri: 'https://letterboxd.com/film/parasite/',
  letterboxdRating: 4.5,
  posterUrl: null,
  director: null,
  rank: null,
  ...overrides,
});

const sampleMovies: Movie[] = [
  makeMovie({ id: '1', title: 'Parasite', letterboxdRating: 4.5, rank: 1 }),
  makeMovie({ id: '2', title: 'The Matrix', letterboxdRating: 4.0, rank: 2 }),
  makeMovie({ id: '3', title: 'Inception', letterboxdRating: 4.2, rank: 3 }),
  makeMovie({ id: '4', title: 'Interstellar', letterboxdRating: 3.8, rank: 4 }),
  makeMovie({ id: '5', title: 'The Godfather', letterboxdRating: 5.0, rank: 5 }),
  makeMovie({ id: '6', title: 'No Rating Film', letterboxdRating: null, rank: 6 }),
];

describe('filterMoviesByTitle', () => {
  it('returns all movies when query is empty', () => {
    expect(filterMoviesByTitle(sampleMovies, '')).toEqual(sampleMovies);
  });

  it('returns all movies when query is only whitespace', () => {
    expect(filterMoviesByTitle(sampleMovies, '   ')).toEqual(sampleMovies);
  });

  it('filters by case-insensitive title match', () => {
    const result = filterMoviesByTitle(sampleMovies, 'parasite');
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('Parasite');
  });

  it('matches partial title', () => {
    const result = filterMoviesByTitle(sampleMovies, 'the');
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.title)).toEqual(['The Matrix', 'The Godfather']);
  });

  it('returns empty array when no matches found', () => {
    expect(filterMoviesByTitle(sampleMovies, 'zzzzz')).toEqual([]);
  });

  it('preserves original order', () => {
    const result = filterMoviesByTitle(sampleMovies, 'in');
    expect(result.map((m) => m.title)).toEqual(['Inception', 'Interstellar', 'No Rating Film']);
  });
});

describe('filterMoviesByMinRating', () => {
  it('returns all movies when minRating is 0', () => {
    expect(filterMoviesByMinRating(sampleMovies, 0)).toEqual(sampleMovies);
  });

  it('filters movies below min rating threshold', () => {
    const result = filterMoviesByMinRating(sampleMovies, 4.0);
    expect(result).toHaveLength(4);
    expect(result.map((m) => m.title)).toEqual([
      'Parasite',
      'The Matrix',
      'Inception',
      'The Godfather',
    ]);
  });

  it('includes movies exactly at the threshold', () => {
    const result = filterMoviesByMinRating(sampleMovies, 4.5);
    expect(result).toHaveLength(2);
    expect(result.map((m) => m.title)).toEqual(['Parasite', 'The Godfather']);
  });

  it('excludes movies with null ratings when filter is active', () => {
    const result = filterMoviesByMinRating(sampleMovies, 1);
    expect(result.find((m) => m.title === 'No Rating Film')).toBeUndefined();
  });

  it('includes movies with null ratings when minRating is 0', () => {
    const result = filterMoviesByMinRating(sampleMovies, 0);
    expect(result.find((m) => m.title === 'No Rating Film')).toBeDefined();
  });
});

describe('applyFilters', () => {
  it('returns all movies when no filters active', () => {
    expect(applyFilters(sampleMovies, '', null)).toEqual(sampleMovies);
  });

  it('applies title filter only', () => {
    const result = applyFilters(sampleMovies, 'matrix', null);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('The Matrix');
  });

  it('applies rating filter only', () => {
    const result = applyFilters(sampleMovies, '', 4.0);
    expect(result).toHaveLength(4);
  });

  it('combines title and rating with AND logic', () => {
    const result = applyFilters(sampleMovies, 'the', 4.5);
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe('The Godfather');
  });

  it('preserves original rank numbers in results', () => {
    const result = applyFilters(sampleMovies, '', 4.5);
    expect(result[0].rank).toBe(1); // Parasite
    expect(result[1].rank).toBe(5); // The Godfather
  });

  it('handles empty movies array', () => {
    expect(applyFilters([], 'test', 4.0)).toEqual([]);
  });

  it('handles large dataset efficiently', () => {
    const largeList = Array.from({ length: 1000 }, (_, i) =>
      makeMovie({
        id: String(i),
        title: `Movie ${i}`,
        letterboxdRating: (i % 5) + 1,
        rank: i + 1,
      }),
    );
    const start = performance.now();
    const result = applyFilters(largeList, 'Movie 5', 3);
    const elapsed = performance.now() - start;
    expect(elapsed).toBeLessThan(100);
    expect(result.length).toBeGreaterThan(0);
  });
});
