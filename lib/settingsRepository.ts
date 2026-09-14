import type { SQLiteDatabase } from 'expo-sqlite';

/** How the comparison sheet places a film: two-film picks, or a gap on the reel. */
export type RankMode = 'pick' | 'slot';

const RANK_MODE_KEY = 'rankMode';

export async function getRankMode(db: SQLiteDatabase): Promise<RankMode> {
  const row = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM settings WHERE key = ?',
    [RANK_MODE_KEY],
  );
  return row?.value === 'slot' ? 'slot' : 'pick';
}

export async function setRankMode(db: SQLiteDatabase, mode: RankMode): Promise<void> {
  await db.runAsync(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
    [RANK_MODE_KEY, mode],
  );
}
