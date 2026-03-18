import * as SQLite from 'expo-sqlite';
import { DB_NAME, CREATE_MOVIES_TABLE } from './schema';

export { DB_NAME, CREATE_MOVIES_TABLE } from './schema';
export type { Movie } from './schema';

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync(CREATE_MOVIES_TABLE);
  return db;
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
