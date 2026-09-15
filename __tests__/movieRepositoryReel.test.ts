import { getReelEntries, getMovieByTmdbId, linkLetterboxd } from '@/lib/movieRepository';

const mockRunAsync = jest.fn();
const mockGetAllAsync = jest.fn();
const mockGetFirstAsync = jest.fn();

const mockDb = {
  runAsync: mockRunAsync,
  getAllAsync: mockGetAllAsync,
  getFirstAsync: mockGetFirstAsync,
} as any;

describe('movieRepository: films added by hand', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('getReelEntries reads each film’s identity and rank', async () => {
    const rows = [{ id: '1', title: 'Parasite', year: 2019, tmdbId: 496243, rank: 2, letterboxdUri: null }];
    mockGetAllAsync.mockResolvedValueOnce(rows);

    expect(await getReelEntries(mockDb)).toBe(rows);
    expect(mockGetAllAsync).toHaveBeenCalledWith(
      'SELECT id, title, year, tmdbId, rank, letterboxdUri FROM movies',
    );
  });

  it('getMovieByTmdbId looks the film up by TMDB id', async () => {
    mockGetFirstAsync.mockResolvedValueOnce(null);

    expect(await getMovieByTmdbId(mockDb, 496243)).toBeNull();
    expect(mockGetFirstAsync).toHaveBeenCalledWith('SELECT * FROM movies WHERE tmdbId = ?', [496243]);
  });

  it('linkLetterboxd sets the link and rating and keeps an existing TMDB id', async () => {
    await linkLetterboxd(mockDb, 'hand-1', {
      letterboxdUri: 'https://letterboxd.com/film/parasite/',
      letterboxdRating: 4.5,
      tmdbId: 496243,
    });

    const [sql, params] = mockRunAsync.mock.calls[0];
    expect(sql).toMatch(/UPDATE movies\s+SET letterboxdUri = \?, letterboxdRating = \?, tmdbId = COALESCE\(tmdbId, \?\)\s+WHERE id = \?/);
    expect(params).toEqual(['https://letterboxd.com/film/parasite/', 4.5, 496243, 'hand-1']);
  });
});
