import type { SQLiteDatabase } from 'expo-sqlite';
import * as Crypto from 'expo-crypto';
import { parseLetterboxdCsv } from './csv';
import { fetchMovieDetails } from './tmdbClient';
import { insertMovie, getExistingUris } from './movieRepository';
import type { Movie } from './schema';

export interface ImportProgress {
  current: number;
  total: number;
}

export interface ImportResult {
  imported: number;
  skipped: number;
  total: number;
}

const BATCH_SIZE = 5;
const BATCH_DELAY_MS = 500;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function importMoviesFromCsv(
  db: SQLiteDatabase,
  csvContent: string,
  workerUrl: string,
  onProgress?: (progress: ImportProgress) => void,
): Promise<ImportResult> {
  const entries = parseLetterboxdCsv(csvContent);
  const total = entries.length;

  if (total === 0) {
    return { imported: 0, skipped: 0, total: 0 };
  }

  // Batch deduplication check
  const allUris = entries.map((e) => e.letterboxdUri);
  const existingUris = await getExistingUris(db, allUris);

  const newEntries = entries.filter((e) => !existingUris.has(e.letterboxdUri));
  const skipped = total - newEntries.length;

  if (newEntries.length === 0) {
    return { imported: 0, skipped, total };
  }

  let imported = 0;

  for (let i = 0; i < newEntries.length; i++) {
    const entry = newEntries[i];

    const tmdbData = await fetchMovieDetails(entry.title, entry.year, workerUrl);

    const movie: Movie = {
      id: Crypto.randomUUID(),
      title: entry.title,
      year: entry.year,
      letterboxdUri: entry.letterboxdUri,
      letterboxdRating: entry.letterboxdRating,
      posterUrl: tmdbData.posterUrl,
      director: tmdbData.director,
      rank: null,
    };

    await insertMovie(db, movie);
    imported++;

    onProgress?.({ current: imported, total: newEntries.length });

    // Throttle: pause between batches to avoid rate limiting
    if ((i + 1) % BATCH_SIZE === 0 && i + 1 < newEntries.length) {
      await delay(BATCH_DELAY_MS);
    }
  }

  return { imported, skipped, total };
}
