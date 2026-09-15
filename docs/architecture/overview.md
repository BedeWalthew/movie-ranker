# Architecture Overview

> Movie Ranker is a local-first iOS app with a lightweight API proxy for TMDB enrichment.

## System Diagram

```
┌──────────────────────────────────────────┐
│       Mobile App (Expo + React Native)   │
│                                          │
│  ┌────────────┐    ┌──────────────────┐  │
│  │   Screens  │    │   Lib (Logic)    │  │
│  │  Ranked    │◄──►│  movieRepository │  │
│  │  Unranked  │    │  binaryInsertion │  │
│  │  Compare   │    │  csv parser      │  │
│  │  Detail    │    │  importService   │  │
│  │  Share     │    │  movieFilters    │  │
│  └────────────┘    └───────┬──────────┘  │
│                            │             │
│                    ┌───────▼──────────┐   │
│                    │  SQLite (local)  │   │
│                    └─────────────────┘   │
└────────────────────┬─────────────────────┘
                     │ GET /movie?title&year
                     ▼
┌──────────────────────────────────────────┐
│       Cloudflare Worker (TMDB Proxy)     │
│                                          │
│  Rate Limiter → TMDB Search → Credits   │
│  (30 req/min)   (poster URL)  (director) │
└────────────────────┬─────────────────────┘
                     │
                     ▼
              TMDB REST API
        (api.themoviedb.org/3)
```

## Components

### Mobile App

Built with Expo 55 and React Native 0.83. Uses expo-router for file-based navigation with two tab screens, two modal screens, and a detail screen.

**Navigation structure:**

```
Stack (root)
├── Tabs
│   ├── Ranked (index.tsx)      — Sorted movie list with search/filter
│   └── Unranked (unranked.tsx) — Imported movies awaiting ranking
├── Movie Detail (/movie/[id])  — Full poster, metadata, rank label
├── Comparison (modal)          — Binary A-vs-B ranking flow
└── Share (modal)               — Top 10 poster grid + native share
```

### Business Logic (lib/)

Pure TypeScript modules with no UI framework dependencies, making them independently testable:

- **movieRepository** — All SQLite CRUD operations (insert, query, rank management)
- **binaryInsertion** — Immutable state machine for binary search ranking
- **csv** — Letterboxd CSV parser with quoted field handling
- **importService** — Orchestrates CSV → dedupe → TMDB fetch → DB insert
- **movieFilters** — Title search and rating filter with AND composition
- **tmdbClient** — HTTP client for the Worker proxy

### SQLite Database

Local-only persistence using expo-sqlite. Single `movies` table stores all movie data with an optional `rank` column (null = unranked, integer = ranked position).

### Cloudflare Worker

Stateless HTTP proxy that keeps the TMDB API key server-side. `GET /movie?title=X&year=Y` returns the TMDB id, poster URL and director for an imported film; `GET /search?query=X` and `GET /details?id=N` back the Add a film sheet. Rate-limited to 300 requests per minute per IP, shared across endpoints. See `worker/README.md`.

## Key Design Decisions

- **Local-first**: All data stored on-device in SQLite. No user accounts or cloud sync.
- **Server-side API key**: TMDB key never leaves the Worker. App only knows the Worker URL.
- **Binary insertion**: O(log n) comparisons to rank a movie against an existing list.
- **Immutable state machine**: Comparison flow uses pure functions — each `pick()` returns a new state object.

## Related

- [Tech Stack](tech-stack.md) — Detailed framework and library choices
- [Data Model](data-model.md) — SQLite schema and entity relationships
- [ADR-0001: Expo with file-based routing](../decisions/0001-use-expo-with-file-based-routing.md)
- [ADR-0003: Cloudflare Worker](../decisions/0003-cloudflare-worker-tmdb-proxy.md)
