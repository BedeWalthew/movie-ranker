import { CREATE_MOVIES_TABLE, DB_NAME } from '@/lib/schema';

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

    it('should have letterboxdUri as TEXT NOT NULL', () => {
      expect(sql).toMatch(/letterboxdUri\s+TEXT\s+NOT NULL/);
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

    it('should contain all 8 required columns', () => {
      const requiredColumns = [
        'id',
        'title',
        'year',
        'letterboxdUri',
        'letterboxdRating',
        'posterUrl',
        'director',
        'rank',
      ];
      requiredColumns.forEach((col) => {
        expect(sql).toContain(col);
      });
    });
  });
});
