import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useFilmSearch, SEARCH_DEBOUNCE_MS } from '@/lib/useFilmSearch';
import type { FilmSearchHit } from '@/lib/tmdbClient';

const mockSearchFilms = jest.fn();
jest.mock('@/lib/tmdbClient', () => ({
  searchFilms: (...args: unknown[]) => mockSearchFilms(...args),
}));

const workerUrl = 'https://worker.example.com';

function hit(tmdbId: number, title: string): FilmSearchHit {
  return { tmdbId, title, year: 2000, posterUrl: null, thumbUrl: null };
}

function renderSearch(initial: string) {
  return renderHook(({ query }: { query: string }) => useFilmSearch(query, workerUrl), {
    initialProps: { query: initial },
  });
}

describe('useFilmSearch', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    mockSearchFilms.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('stays idle below two characters and never searches', () => {
    const { result } = renderSearch(' d ');

    act(() => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS * 3);
    });

    expect(result.current).toEqual({ status: 'idle' });
    expect(mockSearchFilms).not.toHaveBeenCalled();
  });

  it('searches once typing pauses, with the latest trimmed query', async () => {
    mockSearchFilms.mockResolvedValue([hit(1, 'Dune')]);
    const { result, rerender } = renderSearch('du');

    rerender({ query: 'dun' });
    rerender({ query: 'dune ' });
    expect(result.current).toEqual({ status: 'loading', hits: [] });

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    await waitFor(() => expect(result.current).toEqual({ status: 'done', hits: [hit(1, 'Dune')] }));
    expect(mockSearchFilms).toHaveBeenCalledTimes(1);
    expect(mockSearchFilms).toHaveBeenCalledWith('dune', workerUrl);
  });

  it('keeps the previous hits on screen while the next search runs', async () => {
    mockSearchFilms.mockResolvedValueOnce([hit(1, 'Alien')]);
    const { result, rerender } = renderSearch('alien');
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    await waitFor(() => expect(result.current.status).toBe('done'));

    rerender({ query: 'aliens' });

    expect(result.current).toEqual({ status: 'loading', hits: [hit(1, 'Alien')] });
  });

  it('ignores an answer that arrives after a newer query was typed', async () => {
    let answerFirst: (hits: FilmSearchHit[]) => void = () => {};
    mockSearchFilms
      .mockImplementationOnce(() => new Promise((resolve) => { answerFirst = resolve; }))
      .mockResolvedValueOnce([hit(2, 'Aliens')]);

    const { result, rerender } = renderSearch('alien');
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    rerender({ query: 'aliens' });
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    await waitFor(() => expect(result.current).toEqual({ status: 'done', hits: [hit(2, 'Aliens')] }));

    await act(async () => {
      answerFirst([hit(1, 'Alien')]);
    });

    expect(result.current).toEqual({ status: 'done', hits: [hit(2, 'Aliens')] });
  });

  it('reports a failed search', async () => {
    mockSearchFilms.mockRejectedValue(new Error('offline'));
    const { result } = renderSearch('dune');

    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });

    await waitFor(() => expect(result.current).toEqual({ status: 'failed' }));
  });

  it('returns to idle when the query is cleared', async () => {
    mockSearchFilms.mockResolvedValue([hit(1, 'Dune')]);
    const { result, rerender } = renderSearch('dune');
    await act(async () => {
      jest.advanceTimersByTime(SEARCH_DEBOUNCE_MS);
    });
    await waitFor(() => expect(result.current.status).toBe('done'));

    rerender({ query: '' });

    expect(result.current).toEqual({ status: 'idle' });
  });
});
