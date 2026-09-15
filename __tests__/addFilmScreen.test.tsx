import React from 'react';
import { Alert } from 'react-native';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react-native';
import type { FilmSearchHit } from '@/lib/tmdbClient';
import type { FilmSearch } from '@/lib/useFilmSearch';
import type { ReelEntry } from '@/lib/reelMatch';

// A stable router, as on device (see the jest mock re-render note).
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockRouter = { back: mockBack, push: mockPush };
let mockScreenOptions: any = null;
const mockTransitionListeners: Array<(e: { data: { closing: boolean } }) => void> = [];
const mockNavigation = {
  addListener: jest.fn((_event: string, listener: (e: { data: { closing: boolean } }) => void) => {
    mockTransitionListeners.push(listener);
    return () => {};
  }),
};
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useNavigation: () => mockNavigation,
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = require('react');
    useEffect(() => {
      cb();
    }, [cb]);
  },
  Stack: {
    Screen: ({ options }: { options: unknown }) => {
      mockScreenOptions = options;
      return null;
    },
  },
}));

const mockDb = {};
jest.mock('@/lib/database', () => ({
  getDatabase: () => Promise.resolve(mockDb),
}));

const mockGetReelEntries = jest.fn();
jest.mock('@/lib/movieRepository', () => ({
  getReelEntries: (...args: unknown[]) => mockGetReelEntries(...args),
}));

const mockAddFilmToReel = jest.fn();
jest.mock('@/lib/addFilm', () => ({
  addFilmToReel: (...args: unknown[]) => mockAddFilmToReel(...args),
}));

const mockUseFilmSearch = jest.fn();
jest.mock('@/lib/useFilmSearch', () => ({
  useFilmSearch: (...args: unknown[]) => mockUseFilmSearch(...args),
}));

jest.mock('expo-sqlite', () => ({}));

import AddFilmScreen from '@/app/add';
import { WORKER_URL } from '@/lib/constants';

const dune: FilmSearchHit = {
  tmdbId: 438631,
  title: 'Dune',
  year: 2021,
  posterUrl: 'https://image.tmdb.org/t/p/w500/d.jpg',
  thumbUrl: 'https://image.tmdb.org/t/p/w185/d.jpg',
};

function searchReturns(search: FilmSearch) {
  mockUseFilmSearch.mockReturnValue(search);
}

function onReel(overrides: Partial<ReelEntry>): ReelEntry {
  return { id: 'm1', title: 'Dune', year: 2021, tmdbId: 438631, rank: null, letterboxdUri: null, ...overrides };
}

describe('AddFilmScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockScreenOptions = null;
    mockGetReelEntries.mockResolvedValue([]);
    searchReturns({ status: 'idle' });
  });

  it('asks what you watched and credits TMDB before a search', async () => {
    render(<AddFilmScreen />);

    expect(await screen.findByText('What did you watch?')).toBeTruthy();
    expect(screen.getByText(/not endorsed or certified by TMDB/)).toBeTruthy();
  });

  it('searches with what is typed in the native search bar', async () => {
    render(<AddFilmScreen />);

    act(() => {
      mockScreenOptions.headerSearchBarOptions.onChangeText({ nativeEvent: { text: 'dune' } });
    });

    expect(mockUseFilmSearch).toHaveBeenLastCalledWith('dune', WORKER_URL);
    await waitFor(() => expect(mockGetReelEntries).toHaveBeenCalledWith(mockDb));
  });

  it('adds a film, then offers to rank it', async () => {
    searchReturns({ status: 'done', hits: [dune] });
    mockAddFilmToReel.mockResolvedValue({ ...onReel({}), posterUrl: dune.posterUrl, director: 'Denis Villeneuve', letterboxdRating: null });
    render(<AddFilmScreen />);
    await waitFor(() => expect(mockGetReelEntries).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId('add-button-438631'));

    await waitFor(() => expect(mockAddFilmToReel).toHaveBeenCalledWith(mockDb, dune, WORKER_URL));
    fireEvent.press(await screen.findByTestId('rank-button-438631'));
    expect(mockPush).toHaveBeenCalledWith({ pathname: '/comparison', params: { movieId: 'm1' } });
    expect(screen.getByText(/On your reel/)).toBeTruthy();
  });

  it('shows the rank of a film that is already ranked, with nothing to add', async () => {
    searchReturns({ status: 'done', hits: [dune] });
    mockGetReelEntries.mockResolvedValue([onReel({ rank: 7 })]);
    render(<AddFilmScreen />);

    expect(await screen.findByTestId('hit-rank-438631')).toBeTruthy();
    expect(screen.getByText('7')).toBeTruthy();
    expect(screen.queryByTestId('add-button-438631')).toBeNull();
    expect(screen.queryByTestId('rank-button-438631')).toBeNull();
  });

  it('recognises a film from an older import by title and year', async () => {
    searchReturns({ status: 'done', hits: [dune] });
    mockGetReelEntries.mockResolvedValue([onReel({ id: 'imported', tmdbId: null, letterboxdUri: 'https://letterboxd.com/film/dune-2021/' })]);
    render(<AddFilmScreen />);

    fireEvent.press(await screen.findByTestId('rank-button-438631'));

    expect(mockPush).toHaveBeenCalledWith({ pathname: '/comparison', params: { movieId: 'imported' } });
  });

  it('says so when a film cannot be saved, and offers Add again', async () => {
    const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
    searchReturns({ status: 'done', hits: [dune] });
    mockAddFilmToReel.mockRejectedValue(new Error('disk full'));
    render(<AddFilmScreen />);
    await waitFor(() => expect(mockGetReelEntries).toHaveBeenCalled());

    fireEvent.press(screen.getByTestId('add-button-438631'));

    await waitFor(() => expect(alert).toHaveBeenCalledWith('Film not added', expect.stringContaining('Dune')));
    expect(screen.getByTestId('add-button-438631')).toBeTruthy();
    alert.mockRestore();
  });

  it('shows a spinner while the first search runs', async () => {
    searchReturns({ status: 'loading', hits: [] });
    render(<AddFilmScreen />);

    expect(await screen.findByTestId('add-film-searching')).toBeTruthy();
  });

  it('says when nothing matches', async () => {
    searchReturns({ status: 'done', hits: [] });
    render(<AddFilmScreen />);

    act(() => {
      mockScreenOptions.headerSearchBarOptions.onChangeText({ nativeEvent: { text: 'zzzz ' } });
    });

    expect(await screen.findByText('No match')).toBeTruthy();
    expect(screen.getByText(/Nothing matches “zzzz”/)).toBeTruthy();
  });

  it('says when search cannot be reached', async () => {
    searchReturns({ status: 'failed' });
    render(<AddFilmScreen />);

    expect(await screen.findByText('Search is offline')).toBeTruthy();
  });

  it('focuses the search bar once the sheet has finished opening', async () => {
    render(<AddFilmScreen />);
    await waitFor(() => expect(mockScreenOptions).not.toBeNull());
    const focus = jest.fn();
    mockScreenOptions.headerSearchBarOptions.ref.current = { focus };

    expect(mockNavigation.addListener).toHaveBeenCalledWith('transitionEnd', expect.any(Function));
    act(() => {
      mockTransitionListeners.forEach((listener) => listener({ data: { closing: true } }));
    });
    expect(focus).not.toHaveBeenCalled();

    act(() => {
      mockTransitionListeners.forEach((listener) => listener({ data: { closing: false } }));
    });
    expect(focus).toHaveBeenCalled();
  });

  it('closes from the header', async () => {
    render(<AddFilmScreen />);
    await waitFor(() => expect(mockScreenOptions).not.toBeNull());

    const header = render(mockScreenOptions.headerRight());
    fireEvent.press(header.getByTestId('add-film-close'));

    expect(mockBack).toHaveBeenCalled();
  });
});
