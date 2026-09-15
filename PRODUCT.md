# Product

<!-- impeccable:product-schema 1 -->

## Platform

ios

## Users

People who want a true, personal ordering of every film they have seen: Letterboxd users who import their watched list as a CSV, and anyone else who adds films one at a time by title. Primary scene: alone on a phone, in the evening or on a commute, in short sessions of a few minutes, answering "which of these two did I like more?" until the list settles. Intended for App Store release, so first-run and empty states must teach the loop without a manual.

## Product Purpose

Movie Ranker turns a flat watched list into a ranked list through pairwise choices. Import a Letterboxd CSV or add films by title, then rank films one at a time by answering a handful of head-to-head comparisons each. Success is a ranked list the user trusts and enjoys revisiting, and a top ten they want to share.

## Positioning

Ranking by binary insertion: each new film needs only about log2(N) comparisons against films already ranked, so a 500-film list is placed in around nine taps rather than by dragging rows. The rank is derived from decisions, never typed or dragged, which is why the list feels honest.

## Operating Context

- Films enter two ways: a Letterboxd export CSV (Import CSV in the menu), or one at a time from the Add a film sheet (the plus in the navigation bar and the empty-state buttons), which searches TMDB by title. Posters, year and director come through the project's Cloudflare Worker TMDB proxy (`/movie` for imports, `/search` and `/details` for adding).
- A film already on the reel is recognised by TMDB id, or by title and year for imports made before ids were recorded. Search shows it as on the reel (Rank) or ranked (its number) instead of offering Add; an import completes a film added by hand with its Letterboxd link and rating instead of duplicating it.
- All state lives in a local SQLite database on the device; there is no account and no sync.
- Two pools: Unranked (imported, not yet placed) and Ranked (ordered, rank 1 is best).
- Ranking a film opens the comparison flow as a modal; abandoning it changes nothing.
- A ranked film can be re-ranked; it keeps its rank until the new position is decided.
- Share Top 10 renders the first ten ranked posters into an image and opens the system share sheet.
- Reset Movies deletes everything and is the only destructive action.

## Capabilities and Constraints

- Stack: Expo 55, expo-router, React Native 0.83, expo-sqlite, expo-image. Tests run under Jest with React Native Testing Library; screens carry testIDs that the suite relies on.
- Fields per film: title, year, director, Letterboxd link and rating (0.5 to 5 stars; both missing for films added by hand, the rating may be missing on imports), poster URL (may be missing), TMDB id (missing on imports made before it was recorded), rank (null when unranked).
- Filtering by title search and by minimum Letterboxd rating exists on both lists.
- Portrait only, iPhone only (no tablet layout).
- Redesign scope confirmed 2026-09-14: nothing in navigation or flows is sacred except the binary comparison mechanism and the data model. Appearance is dark only.
- Requested: the Ranked screen is a vertical deck carousel with one poster in focus, neighbours receding on lower levels, ranks wrapping so #1 follows the last; a "rank a random movie" action sits at the top of the Ranked screen and opens the comparison flow for a random unranked film.

## Brand Commitments

Name: Movie Ranker. No logo or wordmark beyond the app icon. No colour or type commitments carried over; the previous look is evidence only.

## Evidence on Hand

- Real poster imagery arrives per film from TMDB at import time. Screens must handle missing posters.
- No testimonials, ratings, press or user counts exist. Do not fabricate any.

## Product Principles

- Every rank is earned by a choice; the interface never lets a rank be typed or dragged.
- The poster is the unit of identity; text supports it.
- Sessions are short; the next comparison is always one tap away.
- Nothing is lost by leaving mid-flow.
- Native iPhone conventions govern navigation and controls; character lives in the deck, the type and the motion.
