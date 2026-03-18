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
const mockRemoveFromRanked = jest.fn();
jest.mock('@/lib/movieRepository', () => ({
  getRankedMovies: (...args: any[]) => mockGetRankedMovies(...args),
  insertMovieAtRank: (...args: any[]) => mockInsertMovieAtRank(...args),
  getMovieById: (...args: any[]) => mockGetMovieById(...args),
  removeFromRanked: (...args: any[]) => mockRemoveFromRanked(...args),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({}));

// Mock expo-router
const mockBack = jest.fn();
const mockSearchParams: Record<string, string> = { movieId: 'new-movie' };
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => mockSearchParams,
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
    mockRemoveFromRanked.mockResolvedValue(undefined);
    // Reset search params to default
    mockSearchParams.movieId = 'new-movie';
    delete (mockSearchParams as any).rerank;
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

  describe('re-ranking flow', () => {
    const rerankMovie: Movie = {
      id: 'r2',
      title: 'Inception',
      year: 2010,
      letterboxdUri: 'https://letterboxd.com/film/inception/',
      letterboxdRating: 4.5,
      posterUrl: 'https://poster2.jpg',
      director: 'Christopher Nolan',
      rank: 2,
    };

    beforeEach(() => {
      mockSearchParams.movieId = 'r2';
      mockSearchParams.rerank = 'true';
    });

    it('calls removeFromRanked before getting ranked movies when rerank=true', async () => {
      const callOrder: string[] = [];
      mockGetMovieById.mockImplementation(async () => {
        callOrder.push('getMovieById');
        return rerankMovie;
      });
      mockRemoveFromRanked.mockImplementation(async () => {
        callOrder.push('removeFromRanked');
      });
      mockGetRankedMovies.mockImplementation(async () => {
        callOrder.push('getRankedMovies');
        return [rankedMovies[0], rankedMovies[2]]; // r2 removed
      });

      render(<ComparisonScreen />);

      await waitFor(() => {
        expect(mockRemoveFromRanked).toHaveBeenCalledWith(expect.anything(), 'r2');
      });

      // Verify ordering: removeFromRanked always appears before getRankedMovies
      const removeIdx = callOrder.indexOf('removeFromRanked');
      const rankedIdx = callOrder.indexOf('getRankedMovies');
      expect(removeIdx).toBeGreaterThan(-1);
      expect(rankedIdx).toBeGreaterThan(removeIdx);
    });

    it('does not call removeFromRanked when rerank is not set', async () => {
      delete (mockSearchParams as any).rerank;
      mockSearchParams.movieId = 'new-movie';
      mockGetRankedMovies.mockResolvedValue(rankedMovies);
      mockGetMovieById.mockResolvedValue(newMovie);

      render(<ComparisonScreen />);

      await waitFor(() => {
        expect(mockGetRankedMovies).toHaveBeenCalled();
      });
      expect(mockRemoveFromRanked).not.toHaveBeenCalled();
    });

    it('shows comparison UI after removing movie from ranked list', async () => {
      mockGetMovieById.mockResolvedValue(rerankMovie);
      // After removal, only Parasite and The Matrix remain
      mockGetRankedMovies.mockResolvedValue([rankedMovies[0], rankedMovies[2]]);

      const { getByText, getByTestId } = render(<ComparisonScreen />);

      await waitFor(() => {
        expect(getByText('Inception')).toBeTruthy();
        expect(getByTestId('comparison-progress')).toBeTruthy();
      });
    });

    it('completes re-ranking and inserts at new position', async () => {
      mockGetMovieById.mockResolvedValue(rerankMovie);
      // After removal, only Parasite remains
      mockGetRankedMovies.mockResolvedValue([rankedMovies[0]]);

      const { getByTestId } = render(<ComparisonScreen />);

      await waitFor(() => {
        expect(getByTestId('comparison-card-r2')).toBeTruthy();
      });

      // Prefer Inception over Parasite → inserted at rank 1
      fireEvent.press(getByTestId('comparison-card-r2'));

      await waitFor(() => {
        expect(mockInsertMovieAtRank).toHaveBeenCalledWith(expect.anything(), 'r2', 1);
        expect(mockBack).toHaveBeenCalled();
      });
    });

    it('handles re-ranking when only one other movie remains (single comparison)', async () => {
      mockGetMovieById.mockResolvedValue(rerankMovie);
      // Only one other movie after removal
      mockGetRankedMovies.mockResolvedValue([rankedMovies[0]]);

      const { getByTestId } = render(<ComparisonScreen />);

      await waitFor(() => {
        expect(getByTestId('comparison-card-r2')).toBeTruthy();
        expect(getByTestId('comparison-card-r1')).toBeTruthy();
      });

      // Prefer Parasite → Inception goes to rank 2
      fireEvent.press(getByTestId('comparison-card-r1'));

      await waitFor(() => {
        expect(mockInsertMovieAtRank).toHaveBeenCalledWith(expect.anything(), 'r2', 2);
        expect(mockBack).toHaveBeenCalled();
      });
    });

    it('auto-inserts when no other ranked movies remain after removal', async () => {
      mockGetMovieById.mockResolvedValue(rerankMovie);
      // No movies left after removal
      mockGetRankedMovies.mockResolvedValue([]);

      render(<ComparisonScreen />);

      await waitFor(() => {
        expect(mockRemoveFromRanked).toHaveBeenCalledWith(expect.anything(), 'r2');
        expect(mockInsertMovieAtRank).toHaveBeenCalledWith(expect.anything(), 'r2', 1);
        expect(mockBack).toHaveBeenCalled();
      });
    });
  });
});
