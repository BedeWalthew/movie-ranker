import * as SQLite from 'expo-sqlite';
import { DB_NAME, CREATE_MOVIES_TABLE, CREATE_SETTINGS_TABLE, MOVIE_COLUMNS } from './schema';

export { DB_NAME, CREATE_MOVIES_TABLE, CREATE_SETTINGS_TABLE } from './schema';
export type { Movie } from './schema';

// Screens open the database together at launch; they share one migration.
let migration: Promise<void> | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(CREATE_MOVIES_TABLE);
  await db.execAsync(CREATE_SETTINGS_TABLE);
  migration ??= migrateMoviesTable(db).catch((error) => {
    migration = null;
    throw error;
  });
  await migration;
  return db;
}

/**
 * Brings a movies table from before manual adding up to date: letterboxdUri
 * becomes optional and tmdbId is added. SQLite cannot relax NOT NULL in
 * place, so the table is rebuilt with every row copied across.
 */
export async function migrateMoviesTable(db: SQLite.SQLiteDatabase): Promise<void> {
  const columns = await getTableInfo(db, 'movies');
  const letterboxdUri = columns.find((c) => c.name === 'letterboxdUri');
  const hasTmdbId = columns.some((c) => c.name === 'tmdbId');
  if (hasTmdbId && letterboxdUri?.notnull !== 1) return;

  const kept = columns.map((c) => c.name).join(', ');
  await db.withTransactionAsync(async () => {
    await db.execAsync(`
      DROP TABLE IF EXISTS movies_next;
      CREATE TABLE movies_next (${MOVIE_COLUMNS});
      INSERT INTO movies_next (${kept}) SELECT ${kept} FROM movies;
      DROP TABLE movies;
      ALTER TABLE movies_next RENAME TO movies;
    `);
  });
}

export async function getTableInfo(
  db: SQLite.SQLiteDatabase,
  tableName: string
): Promise<Array<{ name: string; type: string; notnull: number; pk: number }>> {
  const result = await db.getAllAsync<{
    name: string;
    type: string;
    notnull: number;
    pk: number;
  }>(`PRAGMA table_info(${tableName})`);
  return result;
}
