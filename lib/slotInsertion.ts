import type { Movie } from './schema';

// Slot mode places a film by choosing a gap in the ranked list. Gap g sits
// directly above the film at index g, so n ranked films have gaps 0..n and
// gap g gives the film rank g + 1.

export function clampGap(gap: number, rankedCount: number): number {
  return Math.min(Math.max(0, Math.round(gap)), rankedCount);
}

/**
 * Where the slot reel opens. A film being re-ranked opens on the slot it
 * already holds, so placing it without scrolling changes nothing; a new film
 * opens halfway down so its rating can't nudge the choice.
 */
export function initialSlotGap(rankedCount: number, currentRank: number | null): number {
  if (currentRank !== null) return clampGap(currentRank - 1, rankedCount);
  return Math.floor(rankedCount / 2);
}

/** A plain-language name for a gap, e.g. "Between Alien and Jaws". */
export function describeSlot(ranked: Movie[], gap: number): string {
  const n = ranked.length;
  if (n === 0) return 'At the top';
  const g = clampGap(gap, n);
  if (g === 0) return `Above ${ranked[0].title}, at the top`;
  if (g === n) return `Below ${ranked[n - 1].title}, at the bottom`;
  return `Between ${ranked[g - 1].title} and ${ranked[g].title}`;
}
