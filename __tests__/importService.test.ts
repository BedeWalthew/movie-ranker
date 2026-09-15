import { importMoviesFromCsv, type ImportProgress } from '@/lib/importService';
import * as csv from '@/lib/csv';
import * as tmdbClient from '@/lib/tmdbClient';
import * as movieRepository from '@/lib/movieRepository';
import type { ReelEntry } from '@/lib/reelMatch';

// Mock dependencies
jest.mock('@/lib/csv');
jest.mock('@/lib/tmdbClient');
jest.mock('@/lib/movieRepository');
jest.mock('expo-crypto', () => ({ randomUUID: () => 'mock-uuid' }));

const mockDb = {} as any;

const mockParseCsv = csv.parseLetterboxdCsv as jest.MockedFunction<typeof csv.parseLetterboxdCsv>;
const mockFetchDetails = tmdbClient.fetchMovieDetails as jest.MockedFunction<typeof tmdbClient.fetchMovieDetails>;
const mockInsertMovie = movieRepository.insertMovie as jest.MockedFunction<typeof movieRepository.insertMovie>;
const mockGetExistingUris = movieRepository.getExistingUris as jest.MockedFunction<typeof movieRepository.getExistingUris>;
const mockGetReelEntries = movieRepository.getReelEntries as jest.MockedFunction<typeof movieRepository.getReelEntries>;
const mockLinkLetterboxd = movieRepository.linkLetterboxd as jest.MockedFunction<typeof movieRepository.linkLetterboxd>;

const NOT_FOUND = { tmdbId: null, posterUrl: null, director: null };

describe('importMoviesFromCsv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetReelEntries.mockResolvedValue([]);
  });

  it('parses CSV, deduplicates, enriches, and inserts new movies', async () => {
    mockParseCsv.mockReturnValue([
      { title: 'Parasite', year: 2019, letterboxdUri: 'https://letterboxd.com/film/parasite/', letterboxdRating: 5 },
      { title: 'The Matrix', year: 1999, letterboxdUri: 'https://letterboxd.com/film/the-matrix/', letterboxdRating: 4.5 },
    ]);

    mockGetExistingUris.mockResolvedValue(new Set());

    mockFetchDetails
      .mockResolvedValueOnce({ tmdbId: 496243, posterUrl: 'https://poster1.jpg', director: 'Bong Joon-ho' })
      .mockResolvedValueOnce({ tmdbId: 603, posterUrl: 'https://poster2.jpg', director: 'Lana Wachowski' });

    mockInsertMovie.mockResolvedValue(undefined);

    const workerUrl = 'https://worker.example.com';
    const result = await importMoviesFromCsv(mockDb, 'csv-content', workerUrl);

    expect(mockParseCsv).toHaveBeenCalledWith('csv-content');
    expect(mockGetExistingUris).toHaveBeenCalled();
    expect(mockFetchDetails).toHaveBeenCalledTimes(2);
    expect(mockInsertMovie).toHaveBeenCalledTimes(2);
    expect(result.imported).toBe(2);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(2);
  });

  it('stores the TMDB id with each imported film', async () => {
    mockParseCsv.mockReturnValue([
      { title: 'Parasite', year: 2019, letterboxdUri: 'https://letterboxd.com/film/parasite/', letterboxdRating: 5 },
    ]);
    mockGetExistingUris.mockResolvedValue(new Set());
    mockFetchDetails.mockResolvedValueOnce({ tmdbId: 496243, posterUrl: null, director: null });

    await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

    expect(mockInsertMovie).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ title: 'Parasite', tmdbId: 496243, letterboxdRating: 5 })
    );
  });

  it('skips movies that already exist in the database', async () => {
    mockParseCsv.mockReturnValue([
      { title: 'Parasite', year: 2019, letterboxdUri: 'https://letterboxd.com/film/parasite/', letterboxdRating: 5 },
      { title: 'The Matrix', year: 1999, letterboxdUri: 'https://letterboxd.com/film/the-matrix/', letterboxdRating: 4.5 },
    ]);

    // Parasite already exists
    mockGetExistingUris.mockResolvedValue(new Set(['https://letterboxd.com/film/parasite/']));

    mockFetchDetails.mockResolvedValueOnce({ tmdbId: 603, posterUrl: 'https://poster2.jpg', director: 'Lana Wachowski' });
    mockInsertMovie.mockResolvedValue(undefined);

    const result = await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

    expect(mockFetchDetails).toHaveBeenCalledTimes(1);
    expect(mockInsertMovie).toHaveBeenCalledTimes(1);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  describe('films already added by hand', () => {
    const handAdded: ReelEntry = {
      id: 'hand-1',
      title: 'Parasite',
      year: 2019,
      tmdbId: 496243,
      rank: 3,
      letterboxdUri: null,
    };

    beforeEach(() => {
      mockParseCsv.mockReturnValue([
        { title: 'Parasite', year: 2019, letterboxdUri: 'https://letterboxd.com/film/parasite/', letterboxdRating: 4.5 },
      ]);
      mockGetExistingUris.mockResolvedValue(new Set());
    });

    it('gives the film its Letterboxd link and rating instead of adding it again', async () => {
      mockGetReelEntries.mockResolvedValue([handAdded]);
      mockFetchDetails.mockResolvedValueOnce({ tmdbId: 496243, posterUrl: null, director: null });

      const result = await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

      expect(mockLinkLetterboxd).toHaveBeenCalledWith(mockDb, 'hand-1', {
        letterboxdUri: 'https://letterboxd.com/film/parasite/',
        letterboxdRating: 4.5,
        tmdbId: 496243,
      });
      expect(mockInsertMovie).not.toHaveBeenCalled();
      expect(result).toEqual({ imported: 0, skipped: 1, total: 1 });
    });

    it('matches on title and year when the TMDB lookup finds nothing', async () => {
      mockGetReelEntries.mockResolvedValue([{ ...handAdded, title: 'PARASITE' }]);
      mockFetchDetails.mockResolvedValueOnce(NOT_FOUND);

      await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

      expect(mockLinkLetterboxd).toHaveBeenCalledWith(mockDb, 'hand-1', expect.anything());
      expect(mockInsertMovie).not.toHaveBeenCalled();
    });

    it('never relinks a film that came from another Letterboxd entry', async () => {
      mockGetReelEntries.mockResolvedValue([
        { ...handAdded, letterboxdUri: 'https://letterboxd.com/film/parasite-other/' },
      ]);
      mockFetchDetails.mockResolvedValueOnce({ tmdbId: 496243, posterUrl: null, director: null });

      const result = await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

      expect(mockLinkLetterboxd).not.toHaveBeenCalled();
      expect(mockInsertMovie).toHaveBeenCalledTimes(1);
      expect(result.imported).toBe(1);
    });
  });

  it('handles TMDB returning null poster/director', async () => {
    mockParseCsv.mockReturnValue([
      { title: 'Unknown Film', year: 2020, letterboxdUri: 'https://letterboxd.com/film/unknown/', letterboxdRating: 3 },
    ]);

    mockGetExistingUris.mockResolvedValue(new Set());
    mockFetchDetails.mockResolvedValueOnce(NOT_FOUND);
    mockInsertMovie.mockResolvedValue(undefined);

    const result = await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

    expect(mockInsertMovie).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ posterUrl: null, director: null, tmdbId: null })
    );
    expect(result.imported).toBe(1);
  });

  it('calls progress callback during import', async () => {
    const entries = Array.from({ length: 3 }, (_, i) => ({
      title: `Movie ${i}`,
      year: 2020,
      letterboxdUri: `https://letterboxd.com/film/movie-${i}/`,
      letterboxdRating: 4,
    }));

    mockParseCsv.mockReturnValue(entries);
    mockGetExistingUris.mockResolvedValue(new Set());
    mockFetchDetails.mockResolvedValue(NOT_FOUND);
    mockInsertMovie.mockResolvedValue(undefined);

    const progressUpdates: ImportProgress[] = [];
    const onProgress = (p: ImportProgress) => progressUpdates.push({ ...p });

    await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com', onProgress);

    expect(progressUpdates.length).toBeGreaterThanOrEqual(3);
    expect(progressUpdates[progressUpdates.length - 1].current).toBe(3);
    expect(progressUpdates[progressUpdates.length - 1].total).toBe(3);
  });

  it('returns zero counts when CSV is empty', async () => {
    mockParseCsv.mockReturnValue([]);

    const result = await importMoviesFromCsv(mockDb, '', 'https://worker.example.com');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(0);
    expect(result.total).toBe(0);
    expect(mockFetchDetails).not.toHaveBeenCalled();
    expect(mockInsertMovie).not.toHaveBeenCalled();
  });

  it('returns zero counts when all movies are duplicates', async () => {
    mockParseCsv.mockReturnValue([
      { title: 'Parasite', year: 2019, letterboxdUri: 'https://letterboxd.com/film/parasite/', letterboxdRating: 5 },
    ]);

    mockGetExistingUris.mockResolvedValue(new Set(['https://letterboxd.com/film/parasite/']));

    const result = await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

    expect(result.imported).toBe(0);
    expect(result.skipped).toBe(1);
    expect(mockFetchDetails).not.toHaveBeenCalled();
  });
});
