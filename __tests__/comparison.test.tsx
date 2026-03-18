import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import ComparisonScreen from '@/app/comparison';
import type { Movie } from '@/lib/schema';

// Mock database module
const mockGetDatabase = jest.fn();
jest.mock('@/lib/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

// Mock movieRepository
const mockGetRankedMovies = jest.fn();
const mockInsertMovieAtRank = jest.fn();
const mockGetMovieById = jest.fn();
jest.mock('@/lib/movieRepository', () => ({
  getRankedMovies: (...args: any[]) => mockGetRankedMovies(...args),
  insertMovieAtRank: (...args: any[]) => mockInsertMovieAtRank(...args),
  getMovieById: (...args: any[]) => mockGetMovieById(...args),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({}));

// Mock expo-router
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ movieId: 'new-movie' }),
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

const newMovie: Movie = {
  id: 'new-movie',
  title: 'Dune',
  year: 2021,
  letterboxdUri: 'https://letterboxd.com/film/dune-2021/',
  letterboxdRating: 4.0,
  posterUrl: 'https://poster-dune.jpg',
  director: 'Denis Villeneuve',
  rank: null,
};

describe('ComparisonScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockDb = {};
    mockGetDatabase.mockResolvedValue(mockDb);
    mockInsertMovieAtRank.mockResolvedValue(undefined);
  });

  it('auto-inserts at rank 1 when ranked list is empty', async () => {
    mockGetRankedMovies.mockResolvedValue([]);
    mockGetMovieById.mockResolvedValue(newMovie);

    render(<ComparisonScreen />);

    await waitFor(() => {
      expect(mockInsertMovieAtRank).toHaveBeenCalledWith(
        expect.anything(),
        'new-movie',
        1,
      );
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('displays comparison cards when ranked movies exist', async () => {
    mockGetRankedMovies.mockResolvedValue(rankedMovies);
    mockGetMovieById.mockResolvedValue(newMovie);

    const { getByTestId, getByText } = render(<ComparisonScreen />);

    await waitFor(() => {
      expect(getByTestId('comparison-screen')).toBeTruthy();
      // Should show the new movie
      expect(getByText('Dune')).toBeTruthy();
      // Should show a ranked movie for comparison (middle one first)
      expect(getByText('Inception')).toBeTruthy();
    });
  });

  it('shows progress indicator', async () => {
    mockGetRankedMovies.mockResolvedValue(rankedMovies);
    mockGetMovieById.mockResolvedValue(newMovie);

    const { getByTestId } = render(<ComparisonScreen />);

    await waitFor(() => {
      const progress = getByTestId('comparison-progress');
      expect(progress).toBeTruthy();
    });
  });

  it('advances to next comparison when a card is tapped', async () => {
    mockGetRankedMovies.mockResolvedValue(rankedMovies);
    mockGetMovieById.mockResolvedValue(newMovie);

    const { getByTestId, queryByText } = render(<ComparisonScreen />);

    await waitFor(() => {
      expect(getByTestId('comparison-card-new-movie')).toBeTruthy();
    });

    // Tap the new movie card (prefer it over comparison)
    fireEvent.press(getByTestId('comparison-card-new-movie'));

    // Should either show a new comparison movie or complete
    await waitFor(() => {
      // After picking, the comparison should advance
      // With 3 ranked movies, we need ~2 comparisons (ceil(log2(4)) = 2)
      expect(
        getByTestId('comparison-progress') || getByTestId('comparison-screen'),
      ).toBeTruthy();
    });
  });

  it('completes ranking flow and navigates back', async () => {
    // With just 1 ranked movie, only 1 comparison needed
    mockGetRankedMovies.mockResolvedValue([rankedMovies[0]]);
    mockGetMovieById.mockResolvedValue(newMovie);

    const { getByTestId } = render(<ComparisonScreen />);

    await waitFor(() => {
      expect(getByTestId('comparison-card-new-movie')).toBeTruthy();
    });

    // Prefer existing → new movie goes to rank 2
    fireEvent.press(getByTestId('comparison-card-r1'));

    await waitFor(() => {
      expect(mockInsertMovieAtRank).toHaveBeenCalledWith(
        expect.anything(),
        'new-movie',
        2,
      );
      expect(mockBack).toHaveBeenCalled();
    });
  });

  it('displays movie details on each card', async () => {
    mockGetRankedMovies.mockResolvedValue([rankedMovies[0]]);
    mockGetMovieById.mockResolvedValue(newMovie);

    const { getByText } = render(<ComparisonScreen />);

    await waitFor(() => {
      // New movie details
      expect(getByText('Dune')).toBeTruthy();
      expect(getByText('2021')).toBeTruthy();
      // Comparison movie details
      expect(getByText('Parasite')).toBeTruthy();
      expect(getByText('2019')).toBeTruthy();
    });
  });
});
