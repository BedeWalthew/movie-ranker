import type { Movie } from './schema';

export function getEstimatedComparisons(rankedCount: number): number {
  if (rankedCount === 0) return 0;
  return Math.ceil(Math.log2(rankedCount + 1));
}

export function getNextComparison(
  rankedMovies: Movie[],
  low: number,
  high: number,
): { movie: Movie; midIndex: number } | null {
  if (low >= high) return null;
  const mid = Math.floor((low + high) / 2);
  return { movie: rankedMovies[mid], midIndex: mid };
}

export interface ComparisonState {
  isComplete: boolean;
  insertionPosition: number | null;
  comparisonMovie: Movie | null;
  comparisonNumber: number;
  estimatedTotal: number;
  movieToRank: Movie;
  pick: (preferredId: string) => ComparisonState;
}

export function resolveInsertionPosition(
  rankedMovies: Movie[],
  movieToRank: Movie,
): ComparisonState {
  if (rankedMovies.length === 0) {
    return {
      isComplete: true,
      insertionPosition: 1,
      comparisonMovie: null,
      comparisonNumber: 0,
      estimatedTotal: 0,
      movieToRank,
      pick: () => {
        throw new Error('Cannot pick: insertion already resolved');
      },
    };
  }

  return createState(rankedMovies, movieToRank, 0, rankedMovies.length, 1);
}

function createState(
  rankedMovies: Movie[],
  movieToRank: Movie,
  low: number,
  high: number,
  comparisonNumber: number,
): ComparisonState {
  const next = getNextComparison(rankedMovies, low, high);

  if (!next) {
    // low >= high: insertion position determined (1-indexed rank)
    return {
      isComplete: true,
      insertionPosition: low + 1,
      comparisonMovie: null,
      comparisonNumber: comparisonNumber - 1,
      estimatedTotal: getEstimatedComparisons(rankedMovies.length),
      movieToRank,
      pick: () => {
        throw new Error('Cannot pick: insertion already resolved');
      },
    };
  }

  return {
    isComplete: false,
    insertionPosition: null,
    comparisonMovie: next.movie,
    comparisonNumber,
    estimatedTotal: getEstimatedComparisons(rankedMovies.length),
    movieToRank,
    pick: (preferredId: string) => {
      if (preferredId === movieToRank.id) {
        // New movie is better → it should be ranked higher (lower index)
        return createState(rankedMovies, movieToRank, low, next.midIndex, comparisonNumber + 1);
      } else {
        // Existing movie is better → new movie goes after it
        return createState(rankedMovies, movieToRank, next.midIndex + 1, high, comparisonNumber + 1);
      }
    },
  };
}
