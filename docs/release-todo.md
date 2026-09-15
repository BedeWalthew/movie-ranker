# Release To-Do

> Everything between today's build and Movie Ranker in testers' hands (TestFlight), then on the App Store.

Last updated: 2026-09-15.

## Where things stand

- **Apple Developer Program:** paid membership, team `QT5CM4P8HB` ("bede walthew"). The current signing profile runs to 2027-08-26.
- **App:** bundle id `com.vabe.movieranker`, version `1.0.0`, build `1`, iPhone only, portrait, dark only.
- **Worker:** deployed at `https://movie-ranker-worker.bede-movie.workers.dev` (version `0fb5bba7`), with `/movie`, `/search` and `/details`.
- **Tested so far:** Release builds install and run on an iPhone 15 (iOS 26.6).

### Already done

- [x] 1024×1024 app icon (`assets/icon.png`)
- [x] Privacy manifest (`ios/MovieRanker/PrivacyInfo.xcprivacy`)
- [x] Add a film by title, no Letterboxd account needed (merged to `main`)
- [x] Worker `/search` and `/details` deployed
- [x] TMDB text credit in the Add a film sheet
- [x] Reel glides with swipe speed (merged to `main`)

## 1. Accounts and pages (you)

- [ ] Create the app in App Store Connect with bundle id `com.vabe.movieranker`
- [ ] Check "Movie Ranker" is free as an App Store name; choose a variant if not
- [ ] Accept the agreements in App Store Connect (uploads fail without them)
- [ ] Publish a privacy policy page (no account; films stay on the device; searches go through our server and are not stored)
- [ ] Publish a support page (an email address is enough)
- [ ] Create an App Store Connect API key (Users and Access → Integrations) for terminal uploads, or plan to upload from Xcode

## 2. Code and config before the first upload

- [ ] Add `ITSAppUsesNonExemptEncryption = false` (HTTPS only, so exempt), so uploads skip the export compliance question
- [ ] Update Node on this Mac (20.18 is below Expo's 20.19.4 minimum)
- [ ] Apply Expo patch updates with `npx expo install --fix` (e.g. `expo` 55.0.7 → 55.0.31, `react-native` 0.83.2 → 0.83.10), then run tests and a Release build on the phone
- [ ] Match the splash background (`#0D0D0D` in `app.json`) to the app's emulsion black (`#050505`)

## 3. First TestFlight build

- [ ] Set the build number (it must increase with every upload)
- [ ] Archive for App Store distribution and upload (API key from the terminal, or Xcode Organizer)
- [ ] Wait for processing, then answer any questions App Store Connect raises

## 4. Testers

- [ ] **Internal testers** (up to 100, no review): add them to the App Store Connect team, then to the internal group
- [ ] **External testers** (up to 10,000, public link):
  - [ ] Write the beta app description and "what to test" notes
  - [ ] Set the feedback email
  - [ ] Submit for Beta App Review (usually about a day)
  - [ ] Share the public link
- [ ] Aim for 30–50 testers so the public launch starts with reviews and ratings
- [ ] Read TestFlight crash reports and screenshot feedback after each build

## 5. Before the public App Store release

### Product

- [ ] **Backups:** iCloud backup or export/import of rankings. Deleting the app currently loses everything.
- [ ] **About screen:** TMDB logo and attribution ("This product uses the TMDB API but is not endorsed or certified by TMDB")
- [ ] **Accessibility:** check the reel and comparison sheet at large Dynamic Type sizes (not yet designed, see `DESIGN.md`)
- [ ] **Worker:** add a Cloudflare rate-limiting rule (the in-code limit resets per server instance)
- [ ] **Analytics:** decide on minimal analytics (share taps, 7-day return). Adding any changes the privacy label.

### App Store listing

- [ ] Screenshots at the 6.9" iPhone size (reel, comparison, slot mode, Add a film, Top 10 share)
- [ ] Name, subtitle, description, keywords. Keep "Letterboxd" out of the name, subtitle and keywords; "imports Letterboxd exports" in the description is fine.
- [ ] Age rating questionnaire
- [ ] App Privacy label ("Data Not Collected" is likely accurate if the worker keeps no logs)
- [ ] Price (free) and availability
- [ ] Privacy policy and support URLs in the listing

### Legal

- [ ] Re-read TMDB's API terms before charging for anything; paid features need their commercial terms
- [ ] No Letterboxd logo or branding beyond plain-text mentions and links

## 6. Launch

- [ ] Short screen recordings of the reel glide, slot mode and Top 10 share for TikTok and Instagram Reels
- [ ] Posts in film communities (check each subreddit's self-promotion rules)
- [ ] Time the release near a big film or awards season
- [ ] Watch share taps and 7-day return before deciding on monetisation
