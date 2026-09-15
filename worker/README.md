# Movie Ranker Worker

A Cloudflare Worker that proxies TMDB API requests, keeping the API key server-side.

## Endpoints

### `GET /movie?title=X&year=Y`

Poster, director and TMDB id for a film imported from a Letterboxd CSV (the top TMDB match for that title and year).

**Success (200):**
```json
{ "tmdbId": 496243, "posterUrl": "https://image.tmdb.org/t/p/w500/...", "director": "Director Name" }
```

**Not Found (404):**
```json
{ "tmdbId": null, "posterUrl": null, "director": null }
```

### `GET /search?query=X`

Films matching a title, for adding a film by hand. Up to 12 hits; films with no release year are left out.

**Success (200):**
```json
{
  "results": [
    {
      "tmdbId": 438631,
      "title": "Dune",
      "year": 2021,
      "posterUrl": "https://image.tmdb.org/t/p/w500/...",
      "thumbUrl": "https://image.tmdb.org/t/p/w185/..."
    }
  ]
}
```

### `GET /details?id=N`

One film by TMDB id, with its director.

**Success (200):**
```json
{ "tmdbId": 496243, "title": "Parasite", "year": 2019, "posterUrl": "https://image.tmdb.org/t/p/w500/...", "director": "Bong Joon-ho" }
```

**Not Found (404):** TMDB has no such film, or it has no release year.

### Errors (all endpoints)

- `400` — Missing or invalid query parameter
- `404` — Unknown path
- `405` — Non-GET method
- `429` — Rate limit exceeded (300 req/min per IP)
- `500` — TMDB request failed

## Setup

```bash
cd worker
npm install
```

## Configuration

Store your TMDB API key as a Cloudflare secret (never hardcode it):

```bash
npx wrangler secret put TMDB_API_KEY
```

## Development

```bash
npm run dev
```

## Testing

```bash
npm test
```

## Deployment

```bash
npm run deploy
```

## Rate Limiting

In-memory per-IP rate limiting: 300 requests per 60-second window, shared across endpoints. Returns `429` with a `Retry-After` header when exceeded.
