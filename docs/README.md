# Movie Ranker — Documentation

> Rank your Letterboxd watched list using binary insertion comparisons.

## Contents

### Getting Started

New to the project? Start here.

- [Prerequisites](getting-started/prerequisites.md) — System requirements and accounts
- [Quickstart](getting-started/quickstart.md) — From zero to running app in 5 minutes
- [Local Dev Setup](getting-started/local-dev-setup.md) — Full environment walkthrough

### Architecture

How the system is designed and why.

- [Overview](architecture/overview.md) — High-level system diagram and component map
- [Tech Stack](architecture/tech-stack.md) — Languages, frameworks, and infrastructure choices
- [Data Model](architecture/data-model.md) — SQLite schema and entity relationships

### Decisions

Architecture Decision Records (ADRs) capturing key technical choices.

- [ADR Template](decisions/_template.md) — Copy this when recording a new decision
- [ADR-0001: Expo with file-based routing](decisions/0001-use-expo-with-file-based-routing.md)
- [ADR-0002: Local SQLite for persistence](decisions/0002-local-sqlite-for-persistence.md)
- [ADR-0003: Cloudflare Worker as TMDB proxy](decisions/0003-cloudflare-worker-tmdb-proxy.md)
- [ADR-0004: Binary insertion ranking algorithm](decisions/0004-binary-insertion-ranking-algorithm.md)
- [ADR-0005: NativeWind for styling](decisions/0005-nativewind-for-styling.md)

### Troubleshooting

Real issues encountered and how they were solved — useful reference for future projects.

- [Troubleshooting Log](troubleshooting.md)
