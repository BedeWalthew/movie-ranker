import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import UnrankedScreen from '@/app/(tabs)/unranked';
import type { Movie } from '@/lib/schema';

// Mock database module
const mockGetDatabase = jest.fn();
jest.mock('@/lib/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

// Mock movieRepository
const mockGetUnrankedMovies = jest.fn();
jest.mock('@/lib/movieRepository', () => ({
  getUnrankedMovies: (...args: any[]) => mockGetUnrankedMovies(...args),
}));

// Mock expo-sqlite
jest.mock('expo-sqlite', () => ({}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

const sampleMovies: Movie[] = [
  {
    id: '1',
    title: 'Parasite',
    year: 2019,
    letterboxdUri: 'https://letterboxd.com/film/parasite/',
    letterboxdRating: 5,
    posterUrl: 'https://image.tmdb.org/poster1.jpg',
    director: 'Bong Joon-ho',
    rank: null,
  },
  {
    id: '2',
    title: 'The Matrix',
    year: 1999,
    letterboxdUri: 'https://letterboxd.com/film/the-matrix/',
    letterboxdRating: 4.5,
    posterUrl: null,
    director: 'Lana Wachowski',
    rank: null,
  },
];

describe('UnrankedScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const mockDb = {};
    mockGetDatabase.mockResolvedValue(mockDb);
  });

  it('renders the unranked screen container', async () => {
    mockGetUnrankedMovies.mockResolvedValue([]);
    const { getByTestId } = render(<UnrankedScreen />);
    expect(getByTestId('unranked-screen')).toBeTruthy();
  });

  it('shows empty state when no unranked movies exist', async () => {
    mockGetUnrankedMovies.mockResolvedValue([]);
    const { getByTestId } = render(<UnrankedScreen />);

    await waitFor(() => {
      expect(getByTestId('unranked-empty')).toBeTruthy();
    });
  });

  it('displays movie titles when unranked movies exist', async () => {
    mockGetUnrankedMovies.mockResolvedValue(sampleMovies);
    const { getByText } = render(<UnrankedScreen />);

    await waitFor(() => {
      expect(getByText('Parasite')).toBeTruthy();
      expect(getByText('The Matrix')).toBeTruthy();
    });
  });

  it('displays movie years', async () => {
    mockGetUnrankedMovies.mockResolvedValue(sampleMovies);
    const { getByText } = render(<UnrankedScreen />);

    await waitFor(() => {
      expect(getByText(/2019/)).toBeTruthy();
      expect(getByText(/1999/)).toBeTruthy();
    });
  });

  it('displays Letterboxd ratings', async () => {
    mockGetUnrankedMovies.mockResolvedValue(sampleMovies);
    const { getAllByTestId } = render(<UnrankedScreen />);

    await waitFor(() => {
      const ratingElements = getAllByTestId(/movie-rating-/);
      expect(ratingElements.length).toBe(2);
    });
  });

  it('renders poster images for movies with posterUrl', async () => {
    mockGetUnrankedMovies.mockResolvedValue(sampleMovies);
    const { getByTestId } = render(<UnrankedScreen />);

    await waitFor(() => {
      const poster = getByTestId('movie-poster-1');
      expect(poster).toBeTruthy();
    });
  });

  it('renders placeholder for movies without posterUrl', async () => {
    mockGetUnrankedMovies.mockResolvedValue(sampleMovies);
    const { getByTestId } = render(<UnrankedScreen />);

    await waitFor(() => {
      const placeholder = getByTestId('movie-poster-placeholder-2');
      expect(placeholder).toBeTruthy();
    });
  });

  it('uses FlatList for rendering (has movie-list testID)', async () => {
    mockGetUnrankedMovies.mockResolvedValue(sampleMovies);
    const { getByTestId } = render(<UnrankedScreen />);

    await waitFor(() => {
      expect(getByTestId('movie-list')).toBeTruthy();
    });
  });
});
