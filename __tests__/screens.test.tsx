import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import RankedScreen from '@/app/(tabs)/(ranked)/index';
import UnrankedScreen from '@/app/(tabs)/(unranked)/unranked';
import { RefreshProvider } from '@/lib/refreshContext';

// Mock database module
const mockGetDatabase = jest.fn().mockResolvedValue({});
jest.mock('@/lib/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

const mockGetUnrankedMovies = jest.fn().mockResolvedValue([]);
const mockGetRankedMovies = jest.fn().mockResolvedValue([]);
const mockGetRandomUnrankedMovie = jest.fn().mockResolvedValue(null);
const mockGetUnrankedCount = jest.fn().mockResolvedValue(0);
jest.mock('@/lib/movieRepository', () => ({
  getUnrankedMovies: (...args: any[]) => mockGetUnrankedMovies(...args),
  getRankedMovies: (...args: any[]) => mockGetRankedMovies(...args),
  getRandomUnrankedMovie: (...args: any[]) => mockGetRandomUnrankedMovie(...args),
  getUnrankedCount: (...args: any[]) => mockGetUnrankedCount(...args),
}));

jest.mock('expo-sqlite', () => ({}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
  useFocusEffect: (cb: () => void) => {
    const { useEffect } = require('react');
    useEffect(() => { cb(); }, []);
  },
}));

function renderWithRefresh(ui: React.ReactElement) {
  return render(<RefreshProvider>{ui}</RefreshProvider>);
}

describe('Screen Components', () => {
  describe('RankedScreen', () => {
    it('should render with ranked-screen testID', () => {
      renderWithRefresh(<RankedScreen />);
      expect(screen.getByTestId('ranked-screen')).toBeTruthy();
    });

    it('should display the empty gate when nothing is ranked', async () => {
      renderWithRefresh(<RankedScreen />);
      const placeholder = await screen.findByTestId('ranked-placeholder');
      expect(placeholder).toBeTruthy();
      expect(screen.getByText('Nothing in the gate yet')).toBeTruthy();
    });

    it('should use dark background color', () => {
      renderWithRefresh(<RankedScreen />);
      const container = screen.getByTestId('ranked-screen');
      expect(container.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/^#[0-1][0-9A-Fa-f]/),
        })
      );
    });

    it('should show nudge card when an unranked movie exists', async () => {
      mockGetRandomUnrankedMovie.mockResolvedValueOnce({
        id: 'movie-1',
        title: 'Parasite',
        year: 2019,
        letterboxdUri: 'https://letterboxd.com/film/parasite/',
        tmdbId: null,
        letterboxdRating: 4.5,
        posterUrl: 'https://poster.jpg',
        director: 'Bong Joon-ho',
        rank: null,
      });
      mockGetRankedMovies.mockResolvedValueOnce([
        {
          id: 'ranked-1',
          title: 'Inception',
          year: 2010,
          letterboxdUri: 'https://letterboxd.com/film/inception/',
          tmdbId: null,
          letterboxdRating: 4.5,
          posterUrl: null,
          director: 'Christopher Nolan',
          rank: 1,
        },
      ]);

      renderWithRefresh(<RankedScreen />);
      const nudge = await screen.findByTestId('rank-nudge-card');
      expect(nudge).toBeTruthy();
      expect(screen.getByText('Parasite')).toBeTruthy();
    });

    it('should not show nudge card when no unranked movies exist', async () => {
      mockGetRandomUnrankedMovie.mockResolvedValueOnce(null);
      mockGetRankedMovies.mockResolvedValueOnce([
        {
          id: 'ranked-1',
          title: 'Inception',
          year: 2010,
          letterboxdUri: 'https://letterboxd.com/film/inception/',
          tmdbId: null,
          letterboxdRating: 4.5,
          posterUrl: null,
          director: 'Christopher Nolan',
          rank: 1,
        },
      ]);

      renderWithRefresh(<RankedScreen />);
      await waitFor(() => {
        expect(screen.getByTestId('ranked-list')).toBeTruthy();
      });
      expect(screen.queryByTestId('rank-nudge-card')).toBeNull();
    });

    it('should navigate to comparison on nudge press', async () => {
      const mockPush = jest.fn();
      const { useRouter } = require('expo-router');
      useRouter.mockReturnValue({ push: mockPush, back: jest.fn() });

      mockGetRandomUnrankedMovie.mockResolvedValueOnce({
        id: 'movie-1',
        title: 'Parasite',
        year: 2019,
        letterboxdUri: 'https://letterboxd.com/film/parasite/',
        tmdbId: null,
        letterboxdRating: 4.5,
        posterUrl: 'https://poster.jpg',
        director: 'Bong Joon-ho',
        rank: null,
      });
      mockGetRankedMovies.mockResolvedValueOnce([]);

      renderWithRefresh(<RankedScreen />);
      const nudge = await screen.findByTestId('rank-nudge-card');
      const { fireEvent } = require('@testing-library/react-native');
      fireEvent.press(nudge);
      expect(mockPush).toHaveBeenCalledWith({
        pathname: '/comparison',
        params: { movieId: 'movie-1' },
      });
    });
  });

  describe('UnrankedScreen', () => {
    it('should render with unranked-screen testID', () => {
      renderWithRefresh(<UnrankedScreen />);
      expect(screen.getByTestId('unranked-screen')).toBeTruthy();
    });

    it('should display empty state text when no movies', async () => {
      renderWithRefresh(<UnrankedScreen />);
      const emptyState = await screen.findByTestId('unranked-empty');
      expect(emptyState).toBeTruthy();
      expect(screen.getByText('The reel is empty')).toBeTruthy();
    });

    it('should use dark background color', () => {
      renderWithRefresh(<UnrankedScreen />);
      const container = screen.getByTestId('unranked-screen');
      expect(container.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/^#[0-1][0-9A-Fa-f]/),
        })
      );
    });
  });
});
