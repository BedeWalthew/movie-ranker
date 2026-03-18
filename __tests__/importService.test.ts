import { importMoviesFromCsv, type ImportProgress } from '@/lib/importService';
import * as csv from '@/lib/csv';
import * as tmdbClient from '@/lib/tmdbClient';
import * as movieRepository from '@/lib/movieRepository';

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

describe('importMoviesFromCsv', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('parses CSV, deduplicates, enriches, and inserts new movies', async () => {
    mockParseCsv.mockReturnValue([
      { title: 'Parasite', year: 2019, letterboxdUri: 'https://letterboxd.com/film/parasite/', letterboxdRating: 5 },
      { title: 'The Matrix', year: 1999, letterboxdUri: 'https://letterboxd.com/film/the-matrix/', letterboxdRating: 4.5 },
    ]);

    mockGetExistingUris.mockResolvedValue(new Set());

    mockFetchDetails
      .mockResolvedValueOnce({ posterUrl: 'https://poster1.jpg', director: 'Bong Joon-ho' })
      .mockResolvedValueOnce({ posterUrl: 'https://poster2.jpg', director: 'Lana Wachowski' });

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

  it('skips movies that already exist in the database', async () => {
    mockParseCsv.mockReturnValue([
      { title: 'Parasite', year: 2019, letterboxdUri: 'https://letterboxd.com/film/parasite/', letterboxdRating: 5 },
      { title: 'The Matrix', year: 1999, letterboxdUri: 'https://letterboxd.com/film/the-matrix/', letterboxdRating: 4.5 },
    ]);

    // Parasite already exists
    mockGetExistingUris.mockResolvedValue(new Set(['https://letterboxd.com/film/parasite/']));

    mockFetchDetails.mockResolvedValueOnce({ posterUrl: 'https://poster2.jpg', director: 'Lana Wachowski' });
    mockInsertMovie.mockResolvedValue(undefined);

    const result = await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

    expect(mockFetchDetails).toHaveBeenCalledTimes(1);
    expect(mockInsertMovie).toHaveBeenCalledTimes(1);
    expect(result.imported).toBe(1);
    expect(result.skipped).toBe(1);
  });

  it('handles TMDB returning null poster/director', async () => {
    mockParseCsv.mockReturnValue([
      { title: 'Unknown Film', year: 2020, letterboxdUri: 'https://letterboxd.com/film/unknown/', letterboxdRating: 3 },
    ]);

    mockGetExistingUris.mockResolvedValue(new Set());
    mockFetchDetails.mockResolvedValueOnce({ posterUrl: null, director: null });
    mockInsertMovie.mockResolvedValue(undefined);

    const result = await importMoviesFromCsv(mockDb, 'csv-content', 'https://worker.example.com');

    expect(mockInsertMovie).toHaveBeenCalledWith(
      mockDb,
      expect.objectContaining({ posterUrl: null, director: null })
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
    mockFetchDetails.mockResolvedValue({ posterUrl: null, director: null });
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
