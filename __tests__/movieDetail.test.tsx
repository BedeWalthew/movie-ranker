import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { theme } from '@/lib/theme';

// Mock expo-router
const mockBack = jest.fn();
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useLocalSearchParams: jest.fn(),
  useRouter: jest.fn(() => ({ back: mockBack, push: mockPush })),
  Stack: { Screen: () => null },
}));

// Mock database
const mockGetDatabase = jest.fn();
jest.mock('@/lib/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

// Mock movieRepository
const mockGetMovieById = jest.fn();
jest.mock('@/lib/movieRepository', () => ({
  getMovieById: (...args: unknown[]) => mockGetMovieById(...args),
}));

import MovieDetailScreen from '@/app/movie/[id]';
import type { Movie } from '@/lib/schema';

const rankedMovie: Movie = {
  id: 'movie-1',
  title: 'Parasite',
  year: 2019,
  letterboxdUri: 'https://letterboxd.com/film/parasite-2019/',
  letterboxdRating: 4.5,
  posterUrl: 'https://image.tmdb.org/t/p/w500/poster.jpg',
  director: 'Bong Joon-ho',
  rank: 3,
};

const unrankedMovie: Movie = {
  id: 'movie-2',
  title: 'The Matrix',
  year: 1999,
  letterboxdUri: 'https://letterboxd.com/film/the-matrix/',
  letterboxdRating: 4.0,
  posterUrl: null,
  director: 'Lana Wachowski',
  rank: null,
};

const minimalMovie: Movie = {
  id: 'movie-3',
  title: 'Unknown Film',
  year: 2020,
  letterboxdUri: 'https://letterboxd.com/film/unknown/',
  letterboxdRating: null,
  posterUrl: null,
  director: null,
  rank: null,
};

describe('MovieDetailScreen', () => {
  const mockDb = {};

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetDatabase.mockResolvedValue(mockDb);
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'movie-1' });
  });

  it('displays movie title, year, and director', async () => {
    mockGetMovieById.mockResolvedValueOnce(rankedMovie);

    render(<MovieDetailScreen />);

    expect(await screen.findByText('Parasite')).toBeTruthy();
    expect(screen.getByText('2019')).toBeTruthy();
    expect(screen.getByText('Bong Joon-ho')).toBeTruthy();
  });

  it('displays the full-size poster image', async () => {
    mockGetMovieById.mockResolvedValueOnce(rankedMovie);

    render(<MovieDetailScreen />);

    const poster = await screen.findByTestId('detail-poster');
    expect(poster).toBeTruthy();
    expect(poster.props.source).toEqual({ uri: rankedMovie.posterUrl });
  });

  it('displays placeholder when no poster URL', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'movie-2' });
    mockGetMovieById.mockResolvedValueOnce(unrankedMovie);

    render(<MovieDetailScreen />);

    expect(await screen.findByTestId('detail-poster-placeholder')).toBeTruthy();
  });

  it('displays star rating when available', async () => {
    mockGetMovieById.mockResolvedValueOnce(rankedMovie);

    render(<MovieDetailScreen />);

    expect(await screen.findByTestId('detail-rating')).toBeTruthy();
  });

  it('does not display rating section when rating is null', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'movie-3' });
    mockGetMovieById.mockResolvedValueOnce(minimalMovie);

    render(<MovieDetailScreen />);

    await screen.findByText('Unknown Film');
    expect(screen.queryByTestId('detail-rating')).toBeNull();
  });

  it('displays rank when movie is ranked', async () => {
    mockGetMovieById.mockResolvedValueOnce(rankedMovie);

    render(<MovieDetailScreen />);

    expect(await screen.findByText('#3')).toBeTruthy();
  });

  it('displays "Unranked" label when movie has no rank', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'movie-2' });
    mockGetMovieById.mockResolvedValueOnce(unrankedMovie);

    render(<MovieDetailScreen />);

    expect(await screen.findByText('Unranked')).toBeTruthy();
  });

  it('shows "Director unknown" when director is null', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'movie-3' });
    mockGetMovieById.mockResolvedValueOnce(minimalMovie);

    render(<MovieDetailScreen />);

    expect(await screen.findByText('Director unknown')).toBeTruthy();
  });

  it('shows loading indicator initially', () => {
    mockGetMovieById.mockReturnValue(new Promise(() => {})); // never resolves

    render(<MovieDetailScreen />);

    expect(screen.getByTestId('detail-loading')).toBeTruthy();
  });

  it('fetches movie by ID from route params', async () => {
    (useLocalSearchParams as jest.Mock).mockReturnValue({ id: 'movie-1' });
    mockGetMovieById.mockResolvedValueOnce(rankedMovie);

    render(<MovieDetailScreen />);

    await screen.findByText('Parasite');
    expect(mockGetMovieById).toHaveBeenCalledWith(mockDb, 'movie-1');
  });

  it('uses dark theme background color', async () => {
    mockGetMovieById.mockResolvedValueOnce(rankedMovie);

    render(<MovieDetailScreen />);

    const container = await screen.findByTestId('detail-screen');
    expect(container.props.style).toEqual(
      expect.objectContaining({ backgroundColor: theme.colors.background }),
    );
  });
});
