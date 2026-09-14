import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ComparisonScreen from '@/app/comparison';
import type { Movie } from '@/lib/schema';

const mockGetDatabase = jest.fn();
jest.mock('@/lib/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

const mockGetRankedMovies = jest.fn();
const mockInsertMovieAtRank = jest.fn();
const mockGetMovieById = jest.fn();
const mockMoveMovieToRank = jest.fn();
jest.mock('@/lib/movieRepository', () => ({
  getRankedMovies: (...args: any[]) => mockGetRankedMovies(...args),
  insertMovieAtRank: (...args: any[]) => mockInsertMovieAtRank(...args),
  getMovieById: (...args: any[]) => mockGetMovieById(...args),
  moveMovieToRank: (...args: any[]) => mockMoveMovieToRank(...args),
}));

const mockGetRankMode = jest.fn();
const mockSetRankMode = jest.fn();
jest.mock('@/lib/settingsRepository', () => ({
  getRankMode: (...args: any[]) => mockGetRankMode(...args),
  setRankMode: (...args: any[]) => mockSetRankMode(...args),
}));

jest.mock('expo-sqlite', () => ({}));

const mockBack = jest.fn();
// Stable like expo-router's own router; a fresh object per render would
// re-run the screen's initialize and reset the slot mid-test.
const mockRouter = { back: mockBack };
const mockSearchParams: Record<string, string> = { movieId: 'new-movie' };
jest.mock('expo-router', () => ({
  useRouter: () => mockRouter,
  useLocalSearchParams: () => mockSearchParams,
}));

const film = (id: string, title: string, rank: number | null): Movie => ({
  id,
  title,
  year: 2000,
  letterboxdUri: `https://letterboxd.com/film/${id}/`,
  letterboxdRating: 4,
  posterUrl: null,
  director: null,
  rank,
});

const rankedMovies = [film('r1', 'Parasite', 1), film('r2', 'Inception', 2), film('r3', 'The Matrix', 3)];
const newMovie = film('new-movie', 'Dune', null);

describe('ComparisonScreen slot mode', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDatabase.mockResolvedValue({});
    mockInsertMovieAtRank.mockResolvedValue(undefined);
    mockMoveMovieToRank.mockResolvedValue(undefined);
    mockSetRankMode.mockResolvedValue(undefined);
    mockGetRankMode.mockResolvedValue('slot');
    mockGetRankedMovies.mockResolvedValue(rankedMovies);
    mockGetMovieById.mockResolvedValue(newMovie);
    mockSearchParams.movieId = 'new-movie';
  });

  it('opens in slot mode when slot was the last mode used', async () => {
    const { getByTestId, queryByTestId } = render(<ComparisonScreen />);

    await waitFor(() => {
      expect(getByTestId('slot-reel')).toBeTruthy();
    });
    // The reel renders from the start slot (below #1), so #2 is on it.
    expect(getByTestId('slot-frame-r2')).toBeTruthy();
    expect(queryByTestId('comparison-progress')).toBeNull();
  });

  it('switches from pick to slot and remembers the choice', async () => {
    mockGetRankMode.mockResolvedValue('pick');
    const { getByTestId, queryByTestId } = render(<ComparisonScreen />);

    await waitFor(() => {
      expect(getByTestId('comparison-progress')).toBeTruthy();
    });
    expect(queryByTestId('slot-reel')).toBeNull();

    fireEvent.press(getByTestId('rank-mode-slot'));

    expect(getByTestId('slot-reel')).toBeTruthy();
    expect(mockSetRankMode).toHaveBeenCalledWith(expect.anything(), 'slot');
  });

  it('places a new film in the middle slot without scrolling', async () => {
    const { getByTestId, getByText } = render(<ComparisonScreen />);

    await waitFor(() => {
      expect(getByText('Place at #2')).toBeTruthy();
    });
    expect(getByTestId('slot-hint')).toHaveTextContent(
      'Between Parasite and Inception. Leaving now changes nothing.',
    );

    fireEvent.press(getByTestId('slot-place-button'));

    await waitFor(() => {
      expect(mockInsertMovieAtRank).toHaveBeenCalledWith(expect.anything(), 'new-movie', 2);
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('moves the slot one gap at a time and stops at the top', async () => {
    const { getByTestId, getByText } = render(<ComparisonScreen />);

    await waitFor(() => {
      expect(getByTestId('slot-reel')).toBeTruthy();
    });

    const decrement = { nativeEvent: { actionName: 'decrement' } };
    fireEvent(getByTestId('slot-reel'), 'accessibilityAction', decrement);
    fireEvent(getByTestId('slot-reel'), 'accessibilityAction', decrement);

    await waitFor(() => {
      expect(getByText('Place at #1')).toBeTruthy();
    });
    expect(getByTestId('slot-hint')).toHaveTextContent(/^Above Parasite, at the top\./);
    // Moving the slot is only looking; nothing is placed yet.
    expect(mockInsertMovieAtRank).not.toHaveBeenCalled();

    fireEvent.press(getByTestId('slot-place-button'));

    await waitFor(() => {
      expect(mockInsertMovieAtRank).toHaveBeenCalledWith(expect.anything(), 'new-movie', 1);
    });
  });

  it('re-ranks from the slot the film already holds', async () => {
    mockSearchParams.movieId = 'r2';
    mockGetMovieById.mockResolvedValue(rankedMovies[1]);

    const { getByTestId, getByText, queryByTestId } = render(<ComparisonScreen />);

    await waitFor(() => {
      expect(getByText('Place at #2')).toBeTruthy();
    });
    expect(getByTestId('slot-hint')).toHaveTextContent(/^Between Parasite and The Matrix\./);
    // The film being placed is not on the reel.
    expect(queryByTestId('slot-frame-r2')).toBeNull();

    fireEvent.press(getByTestId('slot-place-button'));

    await waitFor(() => {
      expect(mockMoveMovieToRank).toHaveBeenCalledWith(expect.anything(), 'r2', 2);
      expect(mockBack).toHaveBeenCalled();
    });
    expect(mockInsertMovieAtRank).not.toHaveBeenCalled();
  });
});
