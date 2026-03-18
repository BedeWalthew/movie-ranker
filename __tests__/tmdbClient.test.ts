import { fetchMovieDetails, type TmdbResult } from '@/lib/tmdbClient';

// Mock global fetch
const mockFetch = jest.fn();
(global as any).fetch = mockFetch;

describe('fetchMovieDetails', () => {
  const workerUrl = 'https://worker.example.com';

  beforeEach(() => {
    mockFetch.mockReset();
  });

  it('returns posterUrl and director on success', async () => {
    const response: TmdbResult = {
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

  it('returns nulls when movie not found (404)', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ posterUrl: null, director: null }),
    });

    const result = await fetchMovieDetails('Unknown Film', 2099, workerUrl);

    expect(result).toEqual({ posterUrl: null, director: null });
  });

  it('returns nulls on network error', async () => {
    mockFetch.mockRejectedValueOnce(new Error('Network error'));

    const result = await fetchMovieDetails('Parasite', 2019, workerUrl);

    expect(result).toEqual({ posterUrl: null, director: null });
  });

  it('returns nulls on 500 server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: async () => ({ error: 'Internal server error' }),
    });

    const result = await fetchMovieDetails('Parasite', 2019, workerUrl);

    expect(result).toEqual({ posterUrl: null, director: null });
  });

  it('encodes special characters in title', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ posterUrl: null, director: null }),
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

    expect(result).toEqual({ posterUrl: null, director: null });
  });
});
