# Local Dev Setup

> Full environment walkthrough for development, testing, and Worker deployment.

## 1. App Setup

### Install dependencies

```bash
cd movie-ranker
npm install --legacy-peer-deps
```

### Start the development server

```bash
npm start
```

This launches the Expo dev server. Press:
- `i` — Open iOS Simulator
- `w` — Open in web browser
- `r` — Reload the app

### Run tests

```bash
npm test
```

Runs the full Jest suite (193 app tests + 18 worker tests).

```bash
# Run a specific test file
npx jest __tests__/binaryInsertion.test.ts

# Run tests in watch mode
npx jest --watch
```

## 2. Worker Setup

The Cloudflare Worker acts as a proxy between the app and the TMDB API, keeping the API key server-side.

### Install Worker dependencies

```bash
cd worker
npm install
```

### Set the TMDB API key

```bash
npx wrangler secret put TMDB_API_KEY
# Paste your TMDB API key when prompted
```

### Run Worker locally

```bash
npm run dev
```

The Worker starts at `http://localhost:8787`. Test it:

```bash
curl "http://localhost:8787/movie?title=Inception&year=2010"
```

Expected response:

```json
{
  "posterUrl": "https://image.tmdb.org/t/p/w500/...",
  "director": "Christopher Nolan"
}
```

### Run Worker tests

```bash
npm test
```

Uses Vitest (3 test suites, 18 tests).

### Deploy Worker to Cloudflare

```bash
npm run deploy
```

After deploying, update `WORKER_URL` in `lib/constants.ts` with your Worker's URL.

## 3. Project Structure

```
movie-ranker/
├── app/                    # Screens (Expo Router file-based routing)
│   ├── (tabs)/             # Tab navigation (Ranked + Unranked)
│   ├── movie/[id].tsx      # Movie detail screen
│   ├── comparison.tsx      # Comparison modal
│   └── share.tsx           # Share Top 10 modal
├── lib/                    # Business logic & components
│   ├── schema.ts           # Data model
│   ├── movieRepository.ts  # SQLite CRUD
│   ├── binaryInsertion.ts  # Ranking algorithm
│   ├── csv.ts              # CSV parser
│   └── components/         # Reusable UI components
├── worker/                 # Cloudflare Worker (TMDB proxy)
├── __tests__/              # Jest test suite
└── assets/                 # App icons and splash screens
```

## 4. Key Configuration Files

| File | Purpose |
| ---- | ------- |
| `app.json` | Expo app config (name, scheme, plugins) |
| `tsconfig.json` | TypeScript strict mode, `@/` path alias |
| `tailwind.config.js` | Dark theme color palette |
| `jest.config.js` | Test runner config with RN transforms |
| `babel.config.js` | Expo Babel preset |
| `worker/wrangler.toml` | Cloudflare Worker config |

## Related

- [Prerequisites](prerequisites.md) — System requirements
- [Tech Stack](../architecture/tech-stack.md) — Framework and library details
