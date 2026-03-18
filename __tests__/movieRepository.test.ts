import {
  insertMovie,
  getUnrankedMovies,
  getRandomUnrankedMovie,
  getMovieByLetterboxdUri,
  getExistingUris,
  getMovieById,
  getRankedMovies,
  insertMovieAtRank,
  removeFromRanked,
  deleteAllMovies,
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

  describe('getRandomUnrankedMovie', () => {
    it('returns a random unranked movie', async () => {
      const movie: Movie = {
        id: '1',
        title: 'Parasite',
        year: 2019,
        letterboxdUri: 'https://letterboxd.com/film/parasite/',
        letterboxdRating: 5,
        posterUrl: 'https://poster.jpg',
        director: 'Bong Joon-ho',
        rank: null,
      };
      mockGetFirstAsync.mockResolvedValueOnce(movie);

      const result = await getRandomUnrankedMovie(mockDb);

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('rank IS NULL'),
      );
      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY RANDOM()'),
      );
      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('LIMIT 1'),
      );
      expect(result).toEqual(movie);
    });

    it('returns null when no unranked movies exist', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await getRandomUnrankedMovie(mockDb);

      expect(result).toBeNull();
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

  describe('getMovieById', () => {
    it('returns movie when found', async () => {
      const movie: Movie = {
        id: 'test-id',
        title: 'Parasite',
        year: 2019,
        letterboxdUri: 'https://letterboxd.com/film/parasite/',
        letterboxdRating: 5,
        posterUrl: null,
        director: 'Bong Joon-ho',
        rank: 1,
      };
      mockGetFirstAsync.mockResolvedValueOnce(movie);

      const result = await getMovieById(mockDb, 'test-id');

      expect(mockGetFirstAsync).toHaveBeenCalledWith(
        expect.stringContaining('SELECT * FROM movies WHERE id = ?'),
        ['test-id'],
      );
      expect(result).toEqual(movie);
    });

    it('returns null when not found', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      const result = await getMovieById(mockDb, 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getRankedMovies', () => {
    it('returns all ranked movies ordered by rank', async () => {
      const movies: Movie[] = [
        {
          id: '1',
          title: 'Parasite',
          year: 2019,
          letterboxdUri: 'https://letterboxd.com/film/parasite/',
          letterboxdRating: 5,
          posterUrl: null,
          director: 'Bong Joon-ho',
          rank: 1,
        },
        {
          id: '2',
          title: 'Inception',
          year: 2010,
          letterboxdUri: 'https://letterboxd.com/film/inception/',
          letterboxdRating: 4.5,
          posterUrl: null,
          director: 'Christopher Nolan',
          rank: 2,
        },
      ];
      mockGetAllAsync.mockResolvedValueOnce(movies);

      const result = await getRankedMovies(mockDb);

      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('rank IS NOT NULL'),
      );
      expect(mockGetAllAsync).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY rank ASC'),
      );
      expect(result).toEqual(movies);
    });

    it('returns empty array when no ranked movies', async () => {
      mockGetAllAsync.mockResolvedValueOnce([]);
      const result = await getRankedMovies(mockDb);
      expect(result).toEqual([]);
    });
  });

  describe('insertMovieAtRank', () => {
    it('shifts existing movies down and sets rank', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await insertMovieAtRank(mockDb, 'movie-id', 3);

      // First call: shift ranks down for movies at rank >= 3
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE movies SET rank = rank + 1'),
        expect.arrayContaining([3]),
      );

      // Second call: set movie rank
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE movies SET rank ='),
        expect.arrayContaining([3, 'movie-id']),
      );
    });

    it('calls runAsync exactly twice', async () => {
      mockRunAsync.mockResolvedValue(undefined);

      await insertMovieAtRank(mockDb, 'movie-id', 1);

      expect(mockRunAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('removeFromRanked', () => {
    it('sets rank to null and closes the gap', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        id: 'movie-id',
        title: 'Test',
        year: 2020,
        letterboxdUri: 'https://letterboxd.com/film/test/',
        letterboxdRating: null,
        posterUrl: null,
        director: null,
        rank: 5,
      });
      mockRunAsync.mockResolvedValue(undefined);

      await removeFromRanked(mockDb, 'movie-id');

      // First call: set rank to null
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE movies SET rank = NULL'),
        expect.arrayContaining(['movie-id']),
      );

      // Second call: close the gap
      expect(mockRunAsync).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE movies SET rank = rank - 1'),
        expect.arrayContaining([5]),
      );
    });

    it('does nothing if movie not found', async () => {
      mockGetFirstAsync.mockResolvedValueOnce(null);

      await removeFromRanked(mockDb, 'nonexistent');

      expect(mockRunAsync).not.toHaveBeenCalled();
    });

    it('does nothing if movie has no rank', async () => {
      mockGetFirstAsync.mockResolvedValueOnce({
        id: 'movie-id',
        title: 'Test',
        year: 2020,
        letterboxdUri: 'https://letterboxd.com/film/test/',
        letterboxdRating: null,
        posterUrl: null,
        director: null,
        rank: null,
      });

      await removeFromRanked(mockDb, 'movie-id');

      expect(mockRunAsync).not.toHaveBeenCalled();
    });
  });

  describe('deleteAllMovies', () => {
    it('executes DELETE FROM movies', async () => {
      mockRunAsync.mockResolvedValueOnce(undefined);

      await deleteAllMovies(mockDb);

      expect(mockRunAsync).toHaveBeenCalledWith('DELETE FROM movies');
    });
  });
});
