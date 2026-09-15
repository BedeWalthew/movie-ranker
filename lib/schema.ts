export const DB_NAME = 'movie-ranker.db';

/** The movies table's columns, shared by its creation and its migration rebuild. */
export const MOVIE_COLUMNS = `
    id TEXT PRIMARY KEY NOT NULL,
    title TEXT NOT NULL,
    year INTEGER NOT NULL,
    letterboxdUri TEXT,
    letterboxdRating REAL,
    posterUrl TEXT,
    director TEXT,
    rank INTEGER,
    tmdbId INTEGER
`;

export const CREATE_MOVIES_TABLE = `
  CREATE TABLE IF NOT EXISTS movies (${MOVIE_COLUMNS});
`;

export const CREATE_SETTINGS_TABLE = `
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`;

export interface Movie {
  id: string;
  title: string;
  year: number;
  /** Null for a film added by hand rather than imported from Letterboxd. */
  letterboxdUri: string | null;
  letterboxdRating: number | null;
  posterUrl: string | null;
  director: string | null;
  rank: number | null;
  /** TMDB's id for the film. Null for imports made before it was recorded. */
  tmdbId: number | null;
}
