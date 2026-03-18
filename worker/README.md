# Movie Ranker Worker

A Cloudflare Worker that proxies TMDB API requests, keeping the API key server-side.

## Endpoint

### `GET /movie?title=X&year=Y`

Returns movie poster URL and director name.

**Success (200):**
```json
{ "posterUrl": "https://image.tmdb.org/t/p/w500/...", "director": "Director Name" }
```

**Not Found (404):**
```json
{ "posterUrl": null, "director": null }
```

**Errors:**
- `400` — Missing `title` or `year` query parameter
- `405` — Non-GET method
- `429` — Rate limit exceeded (30 req/min per IP)
- `500` — Internal server error

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

In-memory per-IP rate limiting: 30 requests per 60-second window. Returns `429` with `Retry-After` header when exceeded.
