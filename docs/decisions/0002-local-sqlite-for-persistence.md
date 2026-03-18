# ADR-0002: Local SQLite for Persistence

- **Status:** Accepted
- **Date:** 2025-01-01
- **Deciders:** Project lead

## Context and Problem Statement

The app needs to persist a user's movie list and rankings across sessions. Movies are imported from CSV, enriched with TMDB data, and ranked via comparisons. We need a storage solution that supports ordered data, fast queries, and works offline.

## Decision Drivers

- Offline-first — app must work without network after initial import
- Rank management requires atomic position updates (shift operations)
- No user accounts or multi-device sync needed
- Single-user, single-device scope

## Considered Options

1. **expo-sqlite** — Local SQLite via Expo SDK
2. **AsyncStorage** — Key-value store (React Native)
3. **Cloud database (Supabase / Firebase)** — Remote persistence

## Decision Outcome

**Chosen option: "expo-sqlite"**, because ranking operations require ordered inserts and batch updates (shifting ranks), which map naturally to SQL. Local storage eliminates auth complexity and ensures offline functionality.

### Consequences

- **Good:** SQL makes rank management straightforward — `UPDATE movies SET rank = rank + 1 WHERE rank >= ?` shifts movies in one statement.
- **Good:** Zero network dependency after import. App works in airplane mode.
- **Good:** No auth, no user accounts, no privacy concerns with cloud data.
- **Bad:** No cross-device sync. Rankings are device-local.
- **Bad:** Data loss if user uninstalls the app (no backup).
- **Neutral:** Single table is sufficient for current requirements but may need migration tooling if schema evolves.

## Pros and Cons of the Options

### expo-sqlite

- ✅ SQL queries for ordered data and batch updates
- ✅ Fully offline — no network needed after import
- ✅ No auth complexity
- ✅ Part of Expo SDK — no extra native config
- ❌ No cross-device sync
- ❌ Data lost on uninstall

### AsyncStorage

- ✅ Simple key-value API
- ✅ Offline capable
- ❌ No query language — rank management would require manual array manipulation
- ❌ Performance degrades with large datasets
- ❌ No atomic batch operations

### Cloud Database

- ✅ Cross-device sync
- ✅ Automatic backups
- ❌ Requires user auth
- ❌ Network dependency
- ❌ Privacy considerations for user data
- ❌ Cost at scale

## Links

- [expo-sqlite documentation](https://docs.expo.dev/versions/latest/sdk/sqlite/)
- [Data Model](../architecture/data-model.md)
