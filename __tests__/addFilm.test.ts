import { addFilmToReel } from '@/lib/addFilm';
import type { FilmSearchHit } from '@/lib/tmdbClient';
import type { Movie } from '@/lib/schema';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'new-film-id' }));

const mockFetchFilmDetails = jest.fn();
jest.mock('@/lib/tmdbClient', () => ({
  fetchFilmDetails: (...args: unknown[]) => mockFetchFilmDetails(...args),
}));

const mockInsertMovie = jest.fn();
const mockGetMovieByTmdbId = jest.fn();
jest.mock('@/lib/movieRepository', () => ({
  insertMovie: (...args: unknown[]) => mockInsertMovie(...args),
  getMovieByTmdbId: (...args: unknown[]) => mockGetMovieByTmdbId(...args),
}));

const db = {} as any;
const workerUrl = 'https://worker.example.com';

const hit: FilmSearchHit = {
  tmdbId: 496243,
  title: 'Parasite',
  year: 2019,
  posterUrl: 'https://image.tmdb.org/t/p/w500/p.jpg',
  thumbUrl: 'https://image.tmdb.org/t/p/w185/p.jpg',
};

describe('addFilmToReel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetMovieByTmdbId.mockResolvedValue(null);
    mockInsertMovie.mockResolvedValue(undefined);
  });

  it('adds the film unranked, with its director and full poster, and no Letterboxd link', async () => {
    mockFetchFilmDetails.mockResolvedValue({
      tmdbId: 496243,
      title: 'Parasite',
      year: 2019,
      posterUrl: 'https://image.tmdb.org/t/p/w500/p.jpg',
      director: 'Bong Joon-ho',
    });

    const movie = await addFilmToReel(db, hit, workerUrl);

    const expected: Movie = {
      id: 'new-film-id',
      title: 'Parasite',
      year: 2019,
      letterboxdUri: null,
      letterboxdRating: null,
      posterUrl: 'https://image.tmdb.org/t/p/w500/p.jpg',
      director: 'Bong Joon-ho',
      rank: null,
      tmdbId: 496243,
    };
    expect(mockFetchFilmDetails).toHaveBeenCalledWith(496243, workerUrl);
    expect(mockInsertMovie).toHaveBeenCalledWith(db, expected);
    expect(movie).toEqual(expected);
  });

  it('still adds the film from the search hit when details cannot be fetched', async () => {
    mockFetchFilmDetails.mockResolvedValue(null);

    const movie = await addFilmToReel(db, hit, workerUrl);

    expect(movie).toEqual(
      expect.objectContaining({ title: 'Parasite', year: 2019, posterUrl: hit.posterUrl, director: null, tmdbId: 496243 })
    );
    expect(mockInsertMovie).toHaveBeenCalledTimes(1);
  });

  it('returns the film already on the reel without adding it twice', async () => {
    const existing = { id: 'old', title: 'Parasite', tmdbId: 496243, rank: 4 };
    mockGetMovieByTmdbId.mockResolvedValue(existing);

    const movie = await addFilmToReel(db, hit, workerUrl);

    expect(movie).toBe(existing);
    expect(mockFetchFilmDetails).not.toHaveBeenCalled();
    expect(mockInsertMovie).not.toHaveBeenCalled();
  });

  it('lets a failed save reach the caller', async () => {
    mockFetchFilmDetails.mockResolvedValue(null);
    mockInsertMovie.mockRejectedValue(new Error('disk full'));

    await expect(addFilmToReel(db, hit, workerUrl)).rejects.toThrow('disk full');
  });
});
