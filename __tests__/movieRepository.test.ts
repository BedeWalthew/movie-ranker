import {
  insertMovie,
  getUnrankedMovies,
  getMovieByLetterboxdUri,
  getExistingUris,
} from '@/lib/movieRepository';
import type { Movie } from '@/lib/schema';

// Mock expo-sqlite
const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

const mockDb = {
  runAsync: mockRunAsync,
  getAllAsync: mockGetAllAsync,
  getFirstAsync: mockGetFirstAsync,
} as any;

describe('movieRepository', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('insertMovie', () => {
    it('inserts a movie with all fields', async () => {
      mockRunAsync.mockResolvedValueOnce(undefined);

      const movie: Movie = {
        id: 'test-id',
        title: 'Parasite',
        year: 2019,
        letterboxdUri: 'https://letterboxd.com/film/parasite-2019/',
        letterboxdRating: 5,
        posterUrl: 'https://image.tmdb.org/poster.jpg',
        director: 'Bong Joon-ho',
        rank: null,
      };

      await insertMovie(mockDb, movie);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR IGNORE INTO movies'),
        expect.arrayContaining([
          movie.id,
          movie.title,
          movie.year,
          movie.letterboxdUri,
          movie.letterboxdRating,
          movie.posterUrl,
          movie.director,
          movie.rank,
        ])
      );
    });

    it('inserts a movie with null optional fields', async () => {
      mockRunAsync.mockResolvedValueOnce(undefined);

      const movie: Movie = {
        id: 'test-id-2',
        title: 'Unknown Film',
        year: 2020,
        letterboxdUri: 'https://letterboxd.com/film/unknown/',
        letterboxdRating: null,
        posterUrl: null,
        director: null,
        rank: null,
      };

      await insertMovie(mockDb, movie);

      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('INSERT OR IGNORE INTO movies'),
        expect.arrayContaining([movie.id, movie.title, movie.year, movie.letterboxdUri, null, null, null, null])
      );
    });
  });

  describe('getUnrankedMovies', () => {
    it('returns all movies with rank IS NULL', async () => {
      const movies: Movie[] = [
        {
          id: '1',
          title: 'Parasite',
          year: 2019,
          letterboxdUri: 'https://letterboxd.com/film/parasite/',
          letterboxdRating: 5,
          posterUrl: 'https://poster.jpg',
          director: 'Bong Joon-ho',
          rank: null,
        },
      ];
      mockGetAllAsync.mockResolvedValueOnce(movies);

      const result = await getUnrankedMovies(mockDb);

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('rank IS NULL')
      );
      expect(result).toEqual(movies);
    });

    it('returns empty array when no unranked movies', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);
      const result = await getUnrankedMovies(mockDb);
      expect(result).toEqual([]);
    });
  });

  describe('getMovieByLetterboxdUri', () => {
    it('returns movie when found', async () => {
      const movie: Movie = {
        id: '1',
        title: 'Parasite',
        year: 2019,
        letterboxdUri: 'https://letterboxd.com/film/parasite/',
        letterboxdRating: 5,
        posterUrl: null,
        director: null,
        rank: null,
      };
      mockGetFirstAsync.mockResolvedValueOnce(movie);

      const result = await getMovieByLetterboxdUri(mockDb, 'https://letterboxd.com/film/parasite/');

      expect(result).toEqual(movie);
    });

    it('returns null when not found', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await getMovieByLetterboxdUri(mockDb, 'https://nonexistent.com/');

      expect(result).toBeNull();
    });
  });

  describe('getExistingUris', () => {
    it('returns set of existing URIs', async () => {
      mockGetAllAsync.mockResolvedValueOnce([
        { letterboxdUri: 'https://letterboxd.com/film/a/' },
        { letterboxdUri: 'https://letterboxd.com/film/b/' },
      ]);

      const result = await getExistingUris(mockDb, [
        'https://letterboxd.com/film/a/',
        'https://letterboxd.com/film/b/',
        'https://letterboxd.com/film/c/',
      ]);

      expect(result).toBeInstanceOf(Set);
      expect(result.has('https://letterboxd.com/film/a/')).toBe(true);
      expect(result.has('https://letterboxd.com/film/b/')).toBe(true);
      expect(result.has('https://letterboxd.com/film/c/')).toBe(false);
    });

    it('returns empty set when no URIs match', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);

      const result = await getExistingUris(mockDb, ['https://letterboxd.com/film/x/']);

      expect(result.size).toBe(0);
    });
  });
});
