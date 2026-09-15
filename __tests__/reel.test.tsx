import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { Reel, reelCopies, wrapIndex, restsOnRelease, PITCH } from '@/lib/components/Reel';
import type { Movie } from '@/lib/schema';

function film(i: number): Movie {
  return {
    id: `m${i}`,
    title: `Film ${i}`,
    year: 2000 + i,
    letterboxdUri: null,
    letterboxdRating: null,
    posterUrl: null,
    director: null,
    rank: i + 1,
    tmdbId: null,
  };
}

describe('reelCopies', () => {
  it('keeps at least 60 frames of travel either side of the middle copy', () => {
    for (const n of [2, 3, 7, 21, 59, 60, 61, 140]) {
      const copies = reelCopies(n);
      expect(copies % 2).toBe(1);
      expect(n * Math.floor(copies / 2)).toBeGreaterThanOrEqual(60);
    }
  });

  it('uses three copies once a list is long enough on its own', () => {
    expect(reelCopies(140)).toBe(3);
  });

  it('does not loop fewer than two films', () => {
    expect(reelCopies(0)).toBe(1);
    expect(reelCopies(1)).toBe(1);
  });
});

describe('wrapIndex', () => {
  const n = 21;
  const middle = 63;

  it('leaves a frame in the middle copy where it is', () => {
    expect(wrapIndex(63, n, middle)).toBeNull();
    expect(wrapIndex(83, n, middle)).toBeNull();
  });

  it('moves a frame from any other copy to the same film in the middle copy', () => {
    expect(wrapIndex(84, n, middle)).toBe(63);
    expect(wrapIndex(62, n, middle)).toBe(83);
    expect(wrapIndex(5, n, middle)).toBe(68);
    expect(wrapIndex(140, n, middle)).toBe(77);
  });
});

describe('restsOnRelease', () => {
  it('is at rest when released still, exactly on a frame', () => {
    expect(restsOnRelease(PITCH * 12, 0)).toBe(true);
    expect(restsOnRelease(PITCH * 12, undefined)).toBe(true);
  });

  it('is not at rest while a fling is still moving', () => {
    expect(restsOnRelease(PITCH * 12, 2.4)).toBe(false);
    expect(restsOnRelease(PITCH * 12, -0.5)).toBe(false);
  });

  it('is not at rest when released between frames, because the snap is still to come', () => {
    expect(restsOnRelease(PITCH * 12 + 40, 0)).toBe(false);
  });
});

describe('Reel', () => {
  it('lets a fling run with the finger’s speed instead of stopping at the next frame', () => {
    render(<Reel testID="reel" movies={[film(0), film(1), film(2)]} onOpen={jest.fn()} onRerank={jest.fn()} />);

    const list = screen.getByTestId('reel');
    expect(list.props.decelerationRate).toBe('normal');
    expect(list.props.disableIntervalMomentum).toBeFalsy();
    expect(list.props.snapToInterval).toBe(PITCH);
  });

  it('gives each film exactly one tagged frame, in the middle copy', () => {
    render(<Reel testID="reel" movies={[film(0), film(1), film(2)]} onOpen={jest.fn()} onRerank={jest.fn()} />);

    expect(screen.getAllByTestId('ranked-item-m0')).toHaveLength(1);
  });
});
