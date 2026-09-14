import { clampGap, describeSlot, initialSlotGap } from '@/lib/slotInsertion';
import type { Movie } from '@/lib/schema';

const film = (id: string, title: string, rank: number): Movie => ({
  id,
  title,
  year: 2000,
  letterboxdUri: `https://letterboxd.com/film/${id}/`,
  letterboxdRating: null,
  posterUrl: null,
  director: null,
  rank,
});

const ranked = [film('a', 'Alien', 1), film('b', 'Brazil', 2), film('c', 'Jaws', 3)];

describe('clampGap', () => {
  it('keeps gaps between the top and the bottom of the list', () => {
    expect(clampGap(-1, 3)).toBe(0);
    expect(clampGap(2, 3)).toBe(2);
    expect(clampGap(7, 3)).toBe(3);
  });

  it('rounds a gap caught mid-scroll to the nearest one', () => {
    expect(clampGap(1.4, 3)).toBe(1);
    expect(clampGap(1.6, 3)).toBe(2);
  });
});

describe('initialSlotGap', () => {
  it('opens a new film halfway down the list', () => {
    expect(initialSlotGap(1, null)).toBe(0);
    expect(initialSlotGap(3, null)).toBe(1);
    expect(initialSlotGap(4, null)).toBe(2);
  });

  it('opens a re-ranked film on the slot it already holds', () => {
    // #2 re-ranked against the other two: its slot is between #1 and #3.
    expect(initialSlotGap(2, 2)).toBe(1);
    expect(initialSlotGap(2, 1)).toBe(0);
    // The last film's slot is below everything else.
    expect(initialSlotGap(2, 3)).toBe(2);
  });
});

describe('describeSlot', () => {
  it('names the top, the bottom and the gaps between', () => {
    expect(describeSlot(ranked, 0)).toBe('Above Alien, at the top');
    expect(describeSlot(ranked, 1)).toBe('Between Alien and Brazil');
    expect(describeSlot(ranked, 3)).toBe('Below Jaws, at the bottom');
  });
});
