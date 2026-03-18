# ADR-0003: Cloudflare Worker as TMDB Proxy

- **Status:** Accepted
- **Date:** 2025-01-01
- **Deciders:** Project lead

## Context and Problem Statement

The app needs movie poster images and director names from TMDB. TMDB requires an API key for all requests. We need to decide where this API key lives and how the app accesses TMDB data.

## Decision Drivers

- API key must not be embedded in client-side code (security)
- TMDB rate limits apply per API key
- Minimal backend infrastructure preferred
- Cost should be near-zero for a personal project

## Considered Options

1. **Cloudflare Worker** — Lightweight edge proxy with secret storage
2. **Direct TMDB calls from the app** — API key in app bundle
3. **Traditional backend (Express / Fastify)** — Self-hosted API server

## Decision Outcome

**Chosen option: "Cloudflare Worker"**, because it keeps the API key server-side with zero infrastructure management. The free tier (100K requests/day) is more than sufficient, and deployment is a single `wrangler deploy` command.

### Consequences

- **Good:** API key stored as a Cloudflare secret — never in client code or source control.
- **Good:** Free tier covers all realistic usage for a personal app.
- **Good:** Edge deployment means low latency globally.
- **Good:** Per-IP rate limiting (30 req/min) protects against abuse.
- **Bad:** Additional deployment step (Worker must be deployed separately from the app).
- **Bad:** Rate limiting is per-Worker-instance (in-memory), not globally distributed.
- **Neutral:** Single endpoint (`GET /movie?title&year`) is simple but not extensible without code changes.

## Pros and Cons of the Options

### Cloudflare Worker

- ✅ API key stored as secret
- ✅ Free tier (100K req/day)
- ✅ Zero server management
- ✅ Global edge deployment
- ❌ Separate deploy from app
- ❌ Per-instance rate limiting

### Direct TMDB calls from app

- ✅ No backend needed
- ✅ Simplest architecture
- ❌ API key in app bundle (extractable)
- ❌ Key revocation requires app update
- ❌ No server-side rate limiting

### Traditional backend

- ✅ Full control over API and rate limiting
- ✅ Can add more endpoints easily
- ❌ Requires server hosting (cost)
- ❌ Server management overhead
- ❌ Overkill for a single proxy endpoint

## Links

- [Cloudflare Workers documentation](https://developers.cloudflare.com/workers/)
- [Worker source](../../worker/src/index.ts)
- [Architecture Overview](../architecture/overview.md)
