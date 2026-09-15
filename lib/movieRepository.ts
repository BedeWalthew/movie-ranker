import type { SQLiteDatabase } from 'expo-sqlite';
import type { Movie } from './schema';
import type { ReelEntry } from './reelMatch';

export async function insertMovie(db: SQLiteDatabase, movie: Movie): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO movies (id, title, year, letterboxdUri, letterboxdRating, posterUrl, director, rank, tmdbId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      movie.id,
      movie.title,
      movie.year,
      movie.letterboxdUri,
      movie.letterboxdRating,
      movie.posterUrl,
      movie.director,
      movie.rank,
      movie.tmdbId,
    ],
  );
}

/** Every film's identity and rank, for telling whether a film is already on the reel. */
export async function getReelEntries(db: SQLiteDatabase): Promise<ReelEntry[]> {
  return db.getAllAsync<ReelEntry>(
    'SELECT id, title, year, tmdbId, rank, letterboxdUri FROM movies',
  );
}

export async function getMovieByTmdbId(
  db: SQLiteDatabase,
  tmdbId: number,
): Promise<Movie | null> {
  return db.getFirstAsync<Movie>('SELECT * FROM movies WHERE tmdbId = ?', [tmdbId]);
}

/** Gives a film added by hand the Letterboxd link and rating from an import. */
export async function linkLetterboxd(
  db: SQLiteDatabase,
  movieId: string,
  link: { letterboxdUri: string; letterboxdRating: number | null; tmdbId: number | null },
): Promise<void> {
  await db.runAsync(
    `UPDATE movies
     SET letterboxdUri = ?, letterboxdRating = ?, tmdbId = COALESCE(tmdbId, ?)
     WHERE id = ?`,
    [link.letterboxdUri, link.letterboxdRating, link.tmdbId, movieId],
  );
}

export async function getUnrankedMovies(db: SQLiteDatabase): Promise<Movie[]> {
  return db.getAllAsync<Movie>('SELECT * FROM movies WHERE rank IS NULL');
}

export async function getUnrankedCount(db: SQLiteDatabase): Promise<number> {
  const row = await db.getFirstAsync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM movies WHERE rank IS NULL',
  );
  return row?.n ?? 0;
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

export async function moveMovieToRank(
  db: SQLiteDatabase,
  movieId: string,
  position: number,
): Promise<void> {
  // position is relative to the ranked list without this movie, which is
  // exactly the list after removeFromRanked closes the gap.
  await db.withTransactionAsync(async () => {
    await removeFromRanked(db, movieId);
    await insertMovieAtRank(db, movieId, position);
  });
}

export async function deleteAllMovies(db: SQLiteDatabase): Promise<void> {
  await db.runAsync('DELETE FROM movies');
}
