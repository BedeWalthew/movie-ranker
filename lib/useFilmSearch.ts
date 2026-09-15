import { useEffect, useRef, useState } from 'react';
import { searchFilms, type FilmSearchHit } from './tmdbClient';

export type FilmSearch =
  | { status: 'idle' }
  /** The previous query's hits stay on screen while the next search runs. */
  | { status: 'loading'; hits: FilmSearchHit[] }
  | { status: 'done'; hits: FilmSearchHit[] }
  | { status: 'failed' };

export const SEARCH_DEBOUNCE_MS = 300;
export const MIN_QUERY_LENGTH = 2;

/** Searches as a title is typed: waits for a pause, and drops answers to older queries. */
export function useFilmSearch(query: string, workerUrl: string): FilmSearch {
  const [search, setSearch] = useState<FilmSearch>({ status: 'idle' });
  const latest = useRef(0);

  useEffect(() => {
    const trimmed = query.trim();
    const request = ++latest.current;

    if (trimmed.length < MIN_QUERY_LENGTH) {
      setSearch({ status: 'idle' });
      return;
    }

    setSearch((s) => ({ status: 'loading', hits: 'hits' in s ? s.hits : [] }));
    const timer = setTimeout(async () => {
      try {
        const hits = await searchFilms(trimmed, workerUrl);
        if (request === latest.current) setSearch({ status: 'done', hits });
      } catch {
        if (request === latest.current) setSearch({ status: 'failed' });
      }
    }, SEARCH_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [query, workerUrl]);

  return search;
}
