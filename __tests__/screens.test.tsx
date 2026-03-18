import React from 'react';
import { render, screen } from '@testing-library/react-native';
import RankedScreen from '@/app/(tabs)/index';
import UnrankedScreen from '@/app/(tabs)/unranked';

describe('Screen Components', () => {
  describe('RankedScreen', () => {
    it('should render with ranked-screen testID', () => {
      render(<RankedScreen />);
      expect(screen.getByTestId('ranked-screen')).toBeTruthy();
    });

    it('should display placeholder text', () => {
      render(<RankedScreen />);
      expect(screen.getByTestId('ranked-placeholder')).toBeTruthy();
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

    it('should display placeholder text', () => {
      render(<UnrankedScreen />);
      expect(screen.getByTestId('unranked-placeholder')).toBeTruthy();
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
