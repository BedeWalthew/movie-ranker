import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import RankedScreen from '@/app/(tabs)/index';
import type { Movie } from '@/lib/schema';

// Mock database module
const mockGetDatabase = jest.fn();
jest.mock('@/lib/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

// Mock movieRepository
const mockGetRankedMovies = jest.fn();
jest.mock('@/lib/movieRepository', () => ({
  getRankedMovies: (...args: any[]) => mockGetRankedMovies(...args),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({}));

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush, back: jest.fn() }),
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = require('react');
    useEffect(() => { cb(); }, []);
  },
}));

const rankedMovies: Movie[] = [
  {
    id: 'r1',
    title: 'Parasite',
    year: 2019,
    letterboxdUri: 'https://letterboxd.com/film/parasite/',
    letterboxdRating: 5,
    posterUrl: 'https://poster1.jpg',
    director: 'Bong Joon-ho',
    rank: 1,
  },
  {
    id: 'r2',
    title: 'Inception',
    year: 2010,
    letterboxdUri: 'https://letterboxd.com/film/inception/',
    letterboxdRating: 4.5,
    posterUrl: 'https://poster2.jpg',
    director: 'Christopher Nolan',
    rank: 2,
  },
  {
    id: 'r3',
    title: 'The Matrix',
    year: 1999,
    letterboxdUri: 'https://letterboxd.com/film/the-matrix/',
    letterboxdRating: 4.2,
    posterUrl: null,
    director: 'Lana Wachowski',
    rank: 3,
  },
];

describe('RankedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockDb = {};
    mockGetDatabase.mockResolvedValue(mockDb);
  });

  it('renders ranked movies list', async () => {
    mockGetRankedMovies.mockResolvedValue(rankedMovies);
    const { getByTestId } = render(<RankedScreen />);

    await waitFor(() => {
      expect(getByTestId('ranked-list')).toBeTruthy();
    });
  });

  it('shows re-rank button for each ranked movie', async () => {
    mockGetRankedMovies.mockResolvedValue(rankedMovies);
    const { getByTestId } = render(<RankedScreen />);

    await waitFor(() => {
      expect(getByTestId('rerank-button-r1')).toBeTruthy();
      expect(getByTestId('rerank-button-r2')).toBeTruthy();
      expect(getByTestId('rerank-button-r3')).toBeTruthy();
    });
  });

  it('navigates to comparison screen with rerank=true when re-rank is pressed', async () => {
    mockGetRankedMovies.mockResolvedValue(rankedMovies);
    const { getByTestId } = render(<RankedScreen />);

    await waitFor(() => {
      expect(getByTestId('rerank-button-r1')).toBeTruthy();
    });

    fireEvent.press(getByTestId('rerank-button-r1'));

    expect(mockPush).toHaveBeenCalledWith('/comparison?movieId=r1&rerank=true');
  });

  it('navigates with correct movieId for different movies', async () => {
    mockGetRankedMovies.mockResolvedValue(rankedMovies);
    const { getByTestId } = render(<RankedScreen />);

    await waitFor(() => {
      expect(getByTestId('rerank-button-r2')).toBeTruthy();
    });

    fireEvent.press(getByTestId('rerank-button-r2'));

    expect(mockPush).toHaveBeenCalledWith('/comparison?movieId=r2&rerank=true');
  });

  it('shows empty state when no ranked movies exist', async () => {
    mockGetRankedMovies.mockResolvedValue([]);
    const { getByTestId, queryByTestId } = render(<RankedScreen />);

    await waitFor(() => {
      expect(getByTestId('ranked-placeholder')).toBeTruthy();
    });
    expect(queryByTestId('rerank-button-r1')).toBeNull();
  });
});
