import {
  getEstimatedComparisons,
  getNextComparison,
  resolveInsertionPosition,
  type ComparisonState,
} from '@/lib/binaryInsertion';
import type { Movie } from '@/lib/schema';

function makeMovie(id: string, rank: number): Movie {
  return {
    id,
    title: `Movie ${id}`,
    year: 2020,
    letterboxdUri: `https://letterboxd.com/film/${id}/`,
    letterboxdRating: 4.0,
    posterUrl: null,
    director: null,
    rank,
  };
}

describe('getEstimatedComparisons', () => {
  it('returns 0 for an empty ranked list', () => {
    expect(getEstimatedComparisons(0)).toBe(0);
  });

  it('returns 1 for a single ranked movie', () => {
    expect(getEstimatedComparisons(1)).toBe(1);
  });

  it('returns 2 for 2-3 ranked movies', () => {
    expect(getEstimatedComparisons(2)).toBe(2);
    expect(getEstimatedComparisons(3)).toBe(2);
  });

  it('returns 3 for 4-7 ranked movies', () => {
    expect(getEstimatedComparisons(4)).toBe(3);
    expect(getEstimatedComparisons(7)).toBe(3);
  });

  it('returns 4 for 8-15 ranked movies', () => {
    expect(getEstimatedComparisons(8)).toBe(4);
    expect(getEstimatedComparisons(15)).toBe(4);
  });

  it('handles large lists', () => {
    expect(getEstimatedComparisons(100)).toBe(7);
    expect(getEstimatedComparisons(1000)).toBe(10);
  });
});

describe('getNextComparison', () => {
  it('returns the middle movie in the ranked list', () => {
    const ranked = [makeMovie('a', 1), makeMovie('b', 2), makeMovie('c', 3)];
    const result = getNextComparison(ranked, 0, 3);
    expect(result).toEqual({ movie: ranked[1], midIndex: 1 });
  });

  it('returns the first movie when low=0 and high=1', () => {
    const ranked = [makeMovie('a', 1)];
    const result = getNextComparison(ranked, 0, 1);
    expect(result).toEqual({ movie: ranked[0], midIndex: 0 });
  });

  it('returns the correct movie for different low/high bounds', () => {
    const ranked = [
      makeMovie('a', 1),
      makeMovie('b', 2),
      makeMovie('c', 3),
      makeMovie('d', 4),
      makeMovie('e', 5),
    ];
    // low=2, high=5 → mid=3
    const result = getNextComparison(ranked, 2, 5);
    expect(result).toEqual({ movie: ranked[3], midIndex: 3 });
  });

  it('returns null when low >= high (search complete)', () => {
    const ranked = [makeMovie('a', 1)];
    const result = getNextComparison(ranked, 1, 1);
    expect(result).toBeNull();
  });
});

describe('resolveInsertionPosition', () => {
  it('returns position 1 immediately for empty ranked list', () => {
    const state = resolveInsertionPosition([], makeMovie('new', 0));
    expect(state.insertionPosition).toBe(1);
    expect(state.isComplete).toBe(true);
    expect(state.comparisonNumber).toBe(0);
  });

  it('initializes state for non-empty ranked list', () => {
    const ranked = [makeMovie('a', 1)];
    const state = resolveInsertionPosition(ranked, makeMovie('new', 0));
    expect(state.isComplete).toBe(false);
    expect(state.comparisonNumber).toBe(1);
    expect(state.comparisonMovie).toEqual(ranked[0]);
    expect(state.estimatedTotal).toBe(1);
  });

  it('resolves to position 1 when new movie is preferred over all', () => {
    const ranked = [makeMovie('a', 1)];
    let state = resolveInsertionPosition(ranked, makeMovie('new', 0));

    // User prefers new movie over ranked[0] → insert before it
    state = state.pick('new');
    expect(state.isComplete).toBe(true);
    expect(state.insertionPosition).toBe(1);
  });

  it('resolves to position 2 when existing movie is preferred', () => {
    const ranked = [makeMovie('a', 1)];
    let state = resolveInsertionPosition(ranked, makeMovie('new', 0));

    // User prefers ranked[0] over new → insert after it
    state = state.pick('a');
    expect(state.isComplete).toBe(true);
    expect(state.insertionPosition).toBe(2);
  });

  it('performs binary search through larger list', () => {
    // Create a ranked list of 7 movies
    const ranked = Array.from({ length: 7 }, (_, i) => makeMovie(`m${i}`, i + 1));
    const newMovie = makeMovie('new', 0);

    let state = resolveInsertionPosition(ranked, newMovie);
    expect(state.estimatedTotal).toBe(3);

    // Simulate: new movie should be inserted at position 4
    // First comparison: mid = 3 (m3, rank 4). Prefer existing → search lower half (positions 5-7)
    expect(state.comparisonMovie!.id).toBe('m3');
    state = state.pick('m3'); // existing is better → new goes after mid

    // Second comparison: mid = 5 (m5, rank 6). Prefer new → search upper half (positions 4-5)
    expect(state.comparisonMovie!.id).toBe('m5');
    state = state.pick('new'); // new is better → new goes before mid

    // Third comparison: mid = 4 (m4, rank 5). Prefer new → insert at position 5
    expect(state.comparisonMovie!.id).toBe('m4');
    state = state.pick('new'); // new is better → insert at position 5

    expect(state.isComplete).toBe(true);
    expect(state.insertionPosition).toBe(5);
  });

  it('inserts at beginning of large list when always preferred', () => {
    const ranked = Array.from({ length: 7 }, (_, i) => makeMovie(`m${i}`, i + 1));
    const newMovie = makeMovie('new', 0);

    let state = resolveInsertionPosition(ranked, newMovie);

    // Always prefer new movie → should end up at position 1
    while (!state.isComplete) {
      state = state.pick('new');
    }

    expect(state.insertionPosition).toBe(1);
  });

  it('inserts at end of large list when never preferred', () => {
    const ranked = Array.from({ length: 7 }, (_, i) => makeMovie(`m${i}`, i + 1));
    const newMovie = makeMovie('new', 0);

    let state = resolveInsertionPosition(ranked, newMovie);

    // Always prefer existing movie → should end up at last position
    while (!state.isComplete) {
      state = state.pick(state.comparisonMovie!.id);
    }

    expect(state.insertionPosition).toBe(8);
  });

  it('tracks comparison number correctly', () => {
    const ranked = Array.from({ length: 7 }, (_, i) => makeMovie(`m${i}`, i + 1));
    const newMovie = makeMovie('new', 0);

    let state = resolveInsertionPosition(ranked, newMovie);
    expect(state.comparisonNumber).toBe(1);

    state = state.pick('new');
    if (!state.isComplete) {
      expect(state.comparisonNumber).toBe(2);

      state = state.pick('new');
      if (!state.isComplete) {
        expect(state.comparisonNumber).toBe(3);
      }
    }
  });

  it('completes in at most ceil(log2(N+1)) steps', () => {
    for (const n of [1, 2, 3, 4, 7, 8, 15, 16, 31, 32, 63]) {
      const ranked = Array.from({ length: n }, (_, i) => makeMovie(`m${i}`, i + 1));
      const newMovie = makeMovie('new', 0);
      const maxSteps = Math.ceil(Math.log2(n + 1));

      let state = resolveInsertionPosition(ranked, newMovie);
      let steps = 0;

      while (!state.isComplete) {
        state = state.pick('new');
        steps++;
      }

      expect(steps).toBeLessThanOrEqual(maxSteps);
    }
  });
});
