import React from 'react';
import { render, screen, waitFor } from '@testing-library/react-native';
import RankedScreen from '@/app/(tabs)/index';
import UnrankedScreen from '@/app/(tabs)/unranked';

// Mock database module
const mockGetDatabase = jest.fn().mockResolvedValue({});
jest.mock('@/lib/database', () => ({
  getDatabase: () => mockGetDatabase(),
}));

const mockGetUnrankedMovies = jest.fn().mockResolvedValue([]);
const mockGetRankedMovies = jest.fn().mockResolvedValue([]);
jest.mock('@/lib/movieRepository', () => ({
  getUnrankedMovies: (...args: any[]) => mockGetUnrankedMovies(...args),
  getRankedMovies: (...args: any[]) => mockGetRankedMovies(...args),
}));

jest.mock('expo-sqlite', () => ({}));

// Mock expo-router
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({ push: jest.fn(), back: jest.fn() })),
}));

describe('Screen Components', () => {
  describe('RankedScreen', () => {
    it('should render with ranked-screen testID', () => {
      render(<RankedScreen />);
      expect(screen.getByTestId('ranked-screen')).toBeTruthy();
    });

    it('should display placeholder text', async () => {
      render(<RankedScreen />);
      const placeholder = await screen.findByTestId('ranked-placeholder');
      expect(placeholder).toBeTruthy();
      expect(screen.getByText('Ranked Movies')).toBeTruthy();
    });

    it('should use dark background color', () => {
      render(<RankedScreen />);
      const container = screen.getByTestId('ranked-screen');
      expect(container.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/^#[0-1][0-9A-Fa-f]/),
        })
      );
    });
  });

  describe('UnrankedScreen', () => {
    it('should render with unranked-screen testID', () => {
      render(<UnrankedScreen />);
      expect(screen.getByTestId('unranked-screen')).toBeTruthy();
    });

    it('should display empty state text when no movies', async () => {
      render(<UnrankedScreen />);
      const emptyState = await screen.findByTestId('unranked-empty');
      expect(emptyState).toBeTruthy();
      expect(screen.getByText('Unranked Movies')).toBeTruthy();
    });

    it('should use dark background color', () => {
      render(<UnrankedScreen />);
      const container = screen.getByTestId('unranked-screen');
      expect(container.props.style).toMatchObject(
        expect.objectContaining({
          backgroundColor: expect.stringMatching(/^#[0-1][0-9A-Fa-f]/),
        })
      );
    });
  });
});
