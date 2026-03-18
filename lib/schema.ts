export const DB_NAME = 'movie-ranker.db';

export const CREATE_MOVIES_TABLE = `
  CREATE TABLE IF NOT EXISTS movies (
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    letterboxdUri TEXT NOT NULL,
    letterboxdRating REAL,
    posterUrl TEXT,
    director TEXT,
    rank INTEGER
  );
`;

export interface Movie {
  id: string;
  title: string;
  year: number;
  letterboxdUri: string;
  letterboxdRating: number | null;
  posterUrl: string | null;
  director: string | null;
  rank: number | null;
}
