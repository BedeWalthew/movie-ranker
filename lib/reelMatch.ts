import type { Movie } from './schema';

export type ReelEntry = Pick<Movie, 'id' | 'title' | 'year' | 'tmdbId' | 'rank' | 'letterboxdUri'>;

export interface ReelIndex {
  byTmdbId: Map<number, ReelEntry>;
  byTitle: Map<string, ReelEntry>;
}

/** Case, accents and punctuation differ between Letterboxd and TMDB; words and year do not. */
function titleKey(title: string, year: number): string | null {
  const words = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
  return words ? `${words}|${year}` : null;
}

export function buildReelIndex(entries: ReelEntry[]): ReelIndex {
  const index: ReelIndex = { byTmdbId: new Map(), byTitle: new Map() };
  for (const entry of entries) {
    if (entry.tmdbId !== null) index.byTmdbId.set(entry.tmdbId, entry);
    const key = titleKey(entry.title, entry.year);
    if (key) index.byTitle.set(key, entry);
  }
  return index;
}

/**
 * The film on the reel that this one is, if any. TMDB ids decide when both
 * sides have one; imports from before ids were recorded match on title and year.
 */
export function findOnReel(
  index: ReelIndex,
  film: { tmdbId: number | null; title: string; year: number },
): ReelEntry | null {
  if (film.tmdbId !== null) {
    const byId = index.byTmdbId.get(film.tmdbId);
    if (byId) return byId;
  }
  const key = titleKey(film.title, film.year);
  const byTitle = key ? index.byTitle.get(key) : undefined;
  // Two different ids with the same title and year are two different films.
  if (!byTitle || (byTitle.tmdbId !== null && film.tmdbId !== null)) return null;
  return byTitle;
}
