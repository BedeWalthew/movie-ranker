# Data Model

> Single-table SQLite schema for local movie storage and ranking.

## Overview

Movie Ranker uses a single `movies` table in a local SQLite database (`movie-ranker.db`). The database is created on first app launch via expo-sqlite and persists across sessions on-device.

## Schema

```sql
CREATE TABLE IF NOT EXISTS movies (
  id               TEXT PRIMARY KEY,
  title            TEXT    NOT NULL,
  year             INTEGER NOT NULL,
  letterboxdUri    TEXT    NOT NULL UNIQUE,
  letterboxdRating REAL,
  posterUrl        TEXT,
  director         TEXT,
  rank             INTEGER
);
```

## Fields

| Column | Type | Nullable | Description |
| ------ | ---- | -------- | ----------- |
| `id` | TEXT | No | UUID v4, generated at import time |
| `title` | TEXT | No | Movie title (from Letterboxd CSV) |
| `year` | INTEGER | No | Release year |
| `letterboxdUri` | TEXT | No | Letterboxd profile URL (unique constraint for deduplication) |
| `letterboxdRating` | REAL | Yes | User's Letterboxd rating (0–10 scale, null if unrated) |
| `posterUrl` | TEXT | Yes | TMDB poster image URL (`https://image.tmdb.org/t/p/w500/...`) |
| `director` | TEXT | Yes | Director name from TMDB credits |
| `rank` | INTEGER | Yes | Position in ranked list (1 = best). Null means unranked. |

## TypeScript Interface

```typescript
interface Movie {
  id: string;
  title: string;
  year: number;
  letterboxdUri: string;
  letterboxdRating: number | null;
  posterUrl: string | null;
  director: string | null;
  rank: number | null;
}
```

Defined in `lib/schema.ts`.

## Entity States

A movie exists in exactly one of two states:

```
┌──────────────────┐         ┌──────────────────┐
│     Unranked     │  rank   │      Ranked      │
│   (rank = NULL)  │────────►│  (rank = 1..N)   │
│                  │◄────────│                  │
└──────────────────┘ re-rank └──────────────────┘
```

- **Unranked** — `rank IS NULL`. Movie has been imported but not yet compared.
- **Ranked** — `rank` is a positive integer. Position 1 is the user's top movie.

## Rank Management

Ranks are contiguous integers starting at 1. When a movie is inserted or removed, surrounding ranks shift:

### Insert at position

```sql
-- Shift existing movies down to make room
UPDATE movies SET rank = rank + 1 WHERE rank >= ?;
-- Place the movie
UPDATE movies SET rank = ? WHERE id = ?;
```

### Remove from ranking

```sql
-- Get current rank
SELECT rank FROM movies WHERE id = ?;
-- Remove rank
UPDATE movies SET rank = NULL WHERE id = ?;
-- Close the gap
UPDATE movies SET rank = rank - 1 WHERE rank > ?;
```

## Queries

| Operation | Function | Returns |
| --------- | -------- | ------- |
| All unranked movies | `getUnrankedMovies(db)` | `Movie[]` where `rank IS NULL` |
| All ranked movies (sorted) | `getRankedMovies(db)` | `Movie[]` ordered by `rank ASC` |
| Single movie by ID | `getMovieById(db, id)` | `Movie \| null` |
| Random unranked movie | `getRandomUnrankedMovie(db)` | `Movie \| null` (for rank nudge) |
| Check existing URIs | `getExistingUris(db, uris)` | `string[]` (deduplication on import) |

All query functions are in `lib/movieRepository.ts`.

## Data Flow

```
Letterboxd CSV ──► csv.ts (parse) ──► importService.ts ──► movieRepository.ts ──► SQLite
                                          │
                                    tmdbClient.ts
                                    (poster + director)
```

1. User selects a Letterboxd CSV export
2. `csv.ts` parses entries: title, year, URI, rating
3. `importService.ts` deduplicates against existing URIs
4. For each new movie, fetches poster URL and director from the Worker
5. `movieRepository.ts` inserts the enriched movie with `rank = NULL`

## Related

- [Architecture Overview](overview.md) — System diagram
- [ADR-0002: SQLite](../decisions/0002-local-sqlite-for-persistence.md) — Why local storage
