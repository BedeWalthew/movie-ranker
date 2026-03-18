import type { SQLiteDatabase } from 'expo-sqlite';
import type { Movie } from './schema';

export async function insertMovie(db: SQLiteDatabase, movie: Movie): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO movies (id, title, year, letterboxdUri, letterboxdRating, posterUrl, director, rank)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movie.id,
      movie.title,
      movie.year,
      movie.letterboxdUri,
      movie.letterboxdRating,
      movie.posterUrl,
      movie.director,
      movie.rank,
    ],
  );
}

export async function getUnrankedMovies(db: SQLiteDatabase): Promise<Movie[]> {
  return db.getAllAsync<Movie>('SELECT * FROM movies WHERE rank IS NULL');
}

export async function getMovieByLetterboxdUri(
  db: SQLiteDatabase,
  uri: string,
): Promise<Movie | null> {
  return db.getFirstAsync<Movie>('SELECT * FROM movies WHERE letterboxdUri = ?', [uri]);
}

export async function getExistingUris(
  db: SQLiteDatabase,
  uris: string[],
): Promise<Set<string>> {
  if (uris.length === 0) return new Set();

  const placeholders = uris.map(() => '?').join(',');
  const rows = await db.getAllAsync<{ letterboxdUri: string }>(
    `SELECT letterboxdUri FROM movies WHERE letterboxdUri IN (${placeholders})`,
    uris,
  );
  return new Set(rows.map((r) => r.letterboxdUri));
}
