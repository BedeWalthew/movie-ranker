import { CREATE_MOVIES_TABLE, CREATE_SETTINGS_TABLE, DB_NAME } from '@/lib/schema';
import { migrateMoviesTable } from '@/lib/database';

jest.mock('expo-sqlite', () => ({ openDatabaseAsync: jest.fn() }));

function column(name: string, notnull = 0) {
  return { name, type: 'TEXT', notnull, pk: name === 'id' ? 1 : 0 };
}

function fakeDb(columns: ReturnType<typeof column>[]) {
  return {
    getAllAsync: jest.fn().mockResolvedValue(columns),
    execAsync: jest.fn().mockResolvedValue(undefined),
    withTransactionAsync: jest.fn(async (task: () => Promise<void>) => task()),
  } as any;
}

describe('migrateMoviesTable', () => {
  const beforeManualAdding = [
    column('id', 1),
    column('title', 1),
    column('year', 1),
    column('letterboxdUri', 1),
    column('letterboxdRating'),
    column('posterUrl'),
    column('director'),
    column('rank'),
  ];

  it('rebuilds a table that requires letterboxdUri, copying every existing column', async () => {
    const db = fakeDb(beforeManualAdding);

    await migrateMoviesTable(db);

    expect(db.withTransactionAsync).toHaveBeenCalledTimes(1);
    const sql: string = db.execAsync.mock.calls[0][0];
    expect(sql).toContain('CREATE TABLE movies_next');
    expect(sql).toMatch(/letterboxdUri\s+TEXT,/);
    expect(sql).toMatch(/tmdbId\s+INTEGER/);
    const kept = 'id, title, year, letterboxdUri, letterboxdRating, posterUrl, director, rank';
    expect(sql).toContain(`INSERT INTO movies_next (${kept}) SELECT ${kept} FROM movies`);
    expect(sql).toContain('DROP TABLE movies;');
    expect(sql).toContain('ALTER TABLE movies_next RENAME TO movies');
  });

  it('leaves a current table alone', async () => {
    const db = fakeDb([
      ...beforeManualAdding.map((c) => (c.name === 'letterboxdUri' ? column('letterboxdUri') : c)),
      column('tmdbId'),
    ]);

    await migrateMoviesTable(db);

    expect(db.withTransactionAsync).not.toHaveBeenCalled();
    expect(db.execAsync).not.toHaveBeenCalled();
  });
});

describe('CREATE_SETTINGS_TABLE SQL', () => {
  it('should create a key/value settings table keyed by name', () => {
    expect(CREATE_SETTINGS_TABLE).toContain('CREATE TABLE IF NOT EXISTS settings');
    expect(CREATE_SETTINGS_TABLE).toMatch(/key\s+TEXT\s+PRIMARY KEY\s+NOT NULL/);
    expect(CREATE_SETTINGS_TABLE).toMatch(/value\s+TEXT\s+NOT NULL/);
  });
});

describe('Database Configuration', () => {
  describe('DB_NAME', () => {
    it('should use the correct database name', () => {
      expect(DB_NAME).toBe('movie-ranker.db');
    });
  });

  describe('CREATE_MOVIES_TABLE SQL', () => {
    const sql = CREATE_MOVIES_TABLE;

    it('should create the movies table', () => {
      expect(sql).toContain('CREATE TABLE IF NOT EXISTS movies');
    });

    it('should have id as TEXT PRIMARY KEY NOT NULL', () => {
      expect(sql).toMatch(/id\s+TEXT\s+PRIMARY KEY\s+NOT NULL/);
    });

    it('should have title as TEXT NOT NULL', () => {
      expect(sql).toMatch(/title\s+TEXT\s+NOT NULL/);
    });

    it('should have year as INTEGER NOT NULL', () => {
      expect(sql).toMatch(/year\s+INTEGER\s+NOT NULL/);
    });

    it('should have letterboxdUri as TEXT (nullable for films added by hand)', () => {
      expect(sql).toMatch(/letterboxdUri\s+TEXT/);
      expect(sql).not.toMatch(/letterboxdUri\s+TEXT\s+NOT NULL/);
    });

    it('should have tmdbId as INTEGER (nullable for older imports)', () => {
      expect(sql).toMatch(/tmdbId\s+INTEGER/);
      expect(sql).not.toMatch(/tmdbId\s+INTEGER\s+NOT NULL/);
    });

    it('should have letterboxdRating as REAL (nullable)', () => {
      expect(sql).toMatch(/letterboxdRating\s+REAL/);
      expect(sql).not.toMatch(/letterboxdRating\s+REAL\s+NOT NULL/);
    });

    it('should have posterUrl as TEXT (nullable)', () => {
      expect(sql).toMatch(/posterUrl\s+TEXT/);
      // Ensure posterUrl is not marked NOT NULL
      expect(sql).not.toMatch(/posterUrl\s+TEXT\s+NOT NULL/);
    });

    it('should have director as TEXT (nullable)', () => {
      expect(sql).toMatch(/director\s+TEXT/);
      expect(sql).not.toMatch(/director\s+TEXT\s+NOT NULL/);
    });

    it('should have rank as INTEGER (nullable for unranked)', () => {
      expect(sql).toMatch(/rank\s+INTEGER/);
      expect(sql).not.toMatch(/rank\s+INTEGER\s+NOT NULL/);
    });

    it('should contain all 9 required columns', () => {
      const requiredColumns = [
        'id',
        'title',
        'year',
        'letterboxdUri',
        'letterboxdRating',
        'posterUrl',
        'director',
        'rank',
        'tmdbId',
      ];
      requiredColumns.forEach((col) => {
        expect(sql).toContain(col);
      });
    });
  });
});
