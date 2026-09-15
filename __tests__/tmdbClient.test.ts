import {
  fetchMovieDetails,
  searchFilms,
  fetchFilmDetails,
  type TmdbResult,
  type FilmSearchHit,
  type FilmDetails,
} from '@/lib/tmdbClient';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

const workerUrl = 'https://worker.example.com';
const NOT_FOUND: TmdbResult = { tmdbId: null, posterUrl: null, director: null };

describe('fetchMovieDetails', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns tmdbId, posterUrl and director on success', async () => {
    const response: TmdbResult = {
      tmdbId: 496243,
      posterUrl: 'https://image.tmdb.org/poster.jpg',
      director: 'Bong Joon-ho',
    };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => response,
    });

    const result = await fetchMovieDetails('Parasite', 2019, workerUrl);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://worker.example.com/movie?title=Parasite&year=2019'
    );
    expect(result).toEqual(response);
  });

  it('reads a missing tmdbId from an older worker as null', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posterUrl: 'https://image.tmdb.org/poster.jpg', director: 'Bong Joon-ho' }),
    });

    const result = await fetchMovieDetails('Parasite', 2019, workerUrl);

    expect(result.tmdbId).toBeNull();
  });

  it('returns nulls when movie not found (404)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => NOT_FOUND,
    });

    const result = await fetchMovieDetails('Unknown Film', 2099, workerUrl);

    expect(result).toEqual(NOT_FOUND);
  });

  it('returns nulls on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchMovieDetails('Parasite', 2019, workerUrl);

    expect(result).toEqual(NOT_FOUND);
  });

  it('returns nulls on 500 server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const result = await fetchMovieDetails('Parasite', 2019, workerUrl);

    expect(result).toEqual(NOT_FOUND);
  });

  it('encodes special characters in title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => NOT_FOUND,
    });

    await fetchMovieDetails('Lock, Stock & Two Barrels', 1998, workerUrl);

    const calledUrl = mockFetch.mock.calls[0][0];
    expect(calledUrl).toContain('title=Lock%2C+Stock+%26+Two+Barrels');
  });

  it('handles rate limit (429) by returning nulls', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 429,
      headers: { get: () => '5' },
      json: async () => ({ error: 'Rate limit exceeded' }),
    });

    const result = await fetchMovieDetails('Parasite', 2019, workerUrl);

    expect(result).toEqual(NOT_FOUND);
  });
});

describe('searchFilms', () => {
  const dune: FilmSearchHit = {
    tmdbId: 438631,
    title: 'Dune',
    year: 2021,
    posterUrl: 'https://image.tmdb.org/t/p/w500/d.jpg',
    thumbUrl: 'https://image.tmdb.org/t/p/w185/d.jpg',
  };

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns the worker results for an encoded query', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({ results: [dune] }) });

    const hits = await searchFilms('Lock, Stock & Dune', workerUrl);

    expect(mockFetch).toHaveBeenCalledWith(
      'https://worker.example.com/search?query=Lock%2C+Stock+%26+Dune'
    );
    expect(hits).toEqual([dune]);
  });

  it('returns no hits when the response has no results list', async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => ({}) });
    expect(await searchFilms('dune', workerUrl)).toEqual([]);
  });

  it('throws when the worker answers with an error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 429, json: async () => ({}) });
    await expect(searchFilms('dune', workerUrl)).rejects.toThrow('Search failed: 429');
  });

  it('throws on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    await expect(searchFilms('dune', workerUrl)).rejects.toThrow('Network error');
  });
});

describe('fetchFilmDetails', () => {
  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns the film with its director', async () => {
    const details: FilmDetails = {
      tmdbId: 496243,
      title: 'Parasite',
      year: 2019,
      posterUrl: null,
      director: 'Bong Joon-ho',
    };
    mockFetch.mockResolvedValueOnce({ ok: true, json: async () => details });

    expect(await fetchFilmDetails(496243, workerUrl)).toEqual(details);
    expect(mockFetch).toHaveBeenCalledWith('https://worker.example.com/details?id=496243');
  });

  it('returns null when the worker answers with an error', async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404, json: async () => ({}) });
    expect(await fetchFilmDetails(1, workerUrl)).toBeNull();
  });

  it('returns null on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));
    expect(await fetchFilmDetails(1, workerUrl)).toBeNull();
  });
});
