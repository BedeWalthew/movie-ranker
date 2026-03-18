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

export async function getRandomUnrankedMovie(db: SQLiteDatabase): Promise<Movie | null> {
  return db.getFirstAsync<Movie>(
    'SELECT * FROM movies WHERE rank IS NULL ORDER BY RANDOM() LIMIT 1',
  );
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

export async function getMovieById(
  db: SQLiteDatabase,
  id: string,
): Promise<Movie | null> {
  return db.getFirstAsync<Movie>('SELECT * FROM movies WHERE id = ?', [id]);
}

export async function getRankedMovies(db: SQLiteDatabase): Promise<Movie[]> {
  return db.getAllAsync<Movie>(
    'SELECT * FROM movies WHERE rank IS NOT NULL ORDER BY rank ASC',
  );
}

export async function insertMovieAtRank(
  db: SQLiteDatabase,
  movieId: string,
  position: number,
): Promise<void> {
  await db.runAsync(
    'UPDATE movies SET rank = rank + 1 WHERE rank IS NOT NULL AND rank >= ?',
    [position],
  );
  await db.runAsync('UPDATE movies SET rank = ? WHERE id = ?', [
    position,
    movieId,
  ]);
}

export async function removeFromRanked(
  db: SQLiteDatabase,
  movieId: string,
): Promise<void> {
  const movie = await db.getFirstAsync<Movie>(
    'SELECT * FROM movies WHERE id = ?',
    [movieId],
  );
  if (!movie || movie.rank === null) return;

  await db.runAsync('UPDATE movies SET rank = NULL WHERE id = ?', [movieId]);
  await db.runAsync(
    'UPDATE movies SET rank = rank - 1 WHERE rank IS NOT NULL AND rank > ?',
    [movie.rank],
  );
}

export async function deleteAllMovies(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM movies');
}
