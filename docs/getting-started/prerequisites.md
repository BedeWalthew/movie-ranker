# Prerequisites

> Everything you need before running Movie Ranker locally.

## System Requirements

- **macOS** — iOS Simulator requires a Mac
- **Node.js** ≥ 20.18 (tested with v20.18.1)
- **npm** (ships with Node)
- **Xcode** ≥ 15 with iOS Simulator installed
- **Git**

## Accounts & API Keys

### TMDB API Key (required for movie enrichment)

The app fetches poster images and director names from [TMDB](https://www.themoviedb.org/). The API key lives server-side on a Cloudflare Worker — it is never embedded in the mobile app.

1. Create a free account at [themoviedb.org](https://www.themoviedb.org/signup)
2. Go to **Settings → API** and request an API key
3. You'll use this key when deploying the Worker (see [Local Dev Setup](local-dev-setup.md))

### Cloudflare Account (optional — only for Worker deployment)

If you need to deploy your own TMDB proxy Worker:

1. Sign up at [dash.cloudflare.com](https://dash.cloudflare.com/sign-up)
2. Install the Wrangler CLI: `npm install -g wrangler`
3. Authenticate: `wrangler login`

### Letterboxd Account (for movie data)

Export your watched films list from [Letterboxd](https://letterboxd.com/):

1. Go to **Settings → Import & Export → Export Your Data**
2. Unzip the download and locate `watched.csv`

## Verify

```bash
node --version   # ≥ 20.18
npm --version    # ≥ 10
xcode-select -p  # /Applications/Xcode.app/Contents/Developer
git --version
```

## Next Steps

- [Quickstart](quickstart.md) — Get the app running in 5 minutes
- [Local Dev Setup](local-dev-setup.md) — Full walkthrough including Worker
