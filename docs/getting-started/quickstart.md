# Quickstart

> Get Movie Ranker running on the iOS Simulator in under 5 minutes.

## Prerequisites

- [x] Node.js ≥ 20.18 installed
- [x] Xcode with iOS Simulator installed
- [x] See [Prerequisites](prerequisites.md) for full list

## Steps

### Step 1 — Clone and install

```bash
git clone https://github.com/BedeWalthew/movie-ranker.git
cd movie-ranker
npm install --legacy-peer-deps
```

> **Note:** `--legacy-peer-deps` is required due to peer dependency conflicts between NativeWind and the React Native testing libraries.

### Step 2 — Start the dev server

```bash
npm start
```

Press `i` to open the iOS Simulator when the Expo dev tools load.

### Step 3 — Import movies

1. Tap the **⋯** menu in the header
2. Select **Import CSV**
3. Pick your Letterboxd `watched.csv` file
4. Movies appear in the **Unranked** tab with posters and director info

### Step 4 — Rank a movie

1. Switch to the **Unranked** tab
2. Tap **Rank** on any movie
3. Compare movies head-to-head until ranking is complete
4. The movie appears in your **Ranked** list

## Verify It Works

- The **Ranked** tab shows your ranked movies with position numbers
- The **Unranked** tab shows imported movies awaiting ranking
- Tapping a movie opens the detail screen with poster and metadata

## Next Steps

- [Local Dev Setup](local-dev-setup.md) — Deploy your own Worker, run tests
- [Architecture Overview](../architecture/overview.md) — Understand how the system works

## Troubleshooting

| Symptom | Cause | Fix |
| ------- | ----- | --- |
| `EBADENGINE` warnings during install | Node version < 20.19.4 | Safe to ignore — app works on 20.18.1+ |
| Posters don't load | Worker URL unreachable | Check `WORKER_URL` in `lib/constants.ts` |
| CSV import shows 0 imported | Wrong CSV format | Ensure you're using Letterboxd's `watched.csv` export |
| `--legacy-peer-deps` needed | NativeWind peer dep conflicts | Always use `npm install --legacy-peer-deps` |
