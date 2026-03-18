# Troubleshooting Log — Movie Ranker

> A record of real issues encountered during development and their solutions.
> Written for future React Native / Expo mobile projects.

---

## 1. iOS Bundling Failure: `Cannot resolve "react-dom/client"`

**Symptom**
```
Unable to resolve "react-dom/client" from
"node_modules/@expo/log-box/src/utils/renderInShadowRoot.ts"
```
iOS bundling fails entirely on first `expo start`.

**Root Cause**
`@expo/log-box` (v55) unconditionally imports `react-dom/client` at the top level, even when bundling for iOS. Metro's resolver fails if `react-dom` is not installed.

**Fix**
```bash
npm install react-dom@19.2.0 --legacy-peer-deps
```
Match the `react-dom` version to your `react` version.

**Key Lesson**
Even iOS-only Expo projects need `react-dom` installed when using Expo 55+. Add it to your project template.

---

## 2. Document Picker Opens and Instantly Closes, App Freezes

**Symptom**
Tapping "Import CSV" in a header menu modal causes the document picker to flash open then immediately close. The app becomes unresponsive to all touches.

**Root Cause**
iOS cannot present two modal view controllers simultaneously. The header menu modal (`animationType="fade"`) was still animating out when `DocumentPicker.getDocumentAsync()` tried to present its own modal on top.

**Fix**
Add a delay between closing the menu modal and opening the document picker:
```typescript
const handleMenuPress = (item: string) => {
  setVisible(false);
  setTimeout(() => {
    if (item === 'Import CSV') handleImportCsv();
    else if (item === 'Share Top 10') router.push('/share');
  }, 350); // wait for modal dismiss animation
};
```

**Key Lesson**
On iOS, always delay any secondary modal/navigation by at least 300–400ms after closing a first modal. This applies to any `Modal` + document picker / action sheet / navigation push combination.

---

## 3. CSV Import Succeeds But Shows "Imported 0 Movies"

**Symptom**
The document picker returns a file, but the import result shows 0 imported. No error is shown.

**Root Cause (a): MIME type filter hiding the file**
`type: 'text/csv'` in `getDocumentAsync` was filtering out the file on some iOS versions/configurations where the file's MIME type wasn't recognised as `text/csv`.

**Fix (a)**
Use `type: '*/*'` and accept any file, then validate the content after reading:
```typescript
const result = await DocumentPicker.getDocumentAsync({
  type: '*/*',
  copyToCacheDirectory: true,
});
```

**Root Cause (b): `crypto.getRandomValues()` not supported**
The `uuid` package calls `crypto.getRandomValues()` which does not exist in React Native's Hermes JS engine.

**Error**
```
[Error: crypto.getRandomValues() not supported.
See https://github.com/uuidjs/uuid#getrandomvalues-not-supported]
```

**Fix (b)**
Replace `uuid` with `expo-crypto`:
```bash
npm install expo-crypto --legacy-peer-deps
```
```typescript
// Before
import { v4 as uuidv4 } from 'uuid';
const id = uuidv4();

// After
import * as Crypto from 'expo-crypto';
const id = Crypto.randomUUID();
```

**Key Lesson**
Never use `uuid` directly in React Native/Expo. Always use `expo-crypto` or `react-native-get-random-values` + `uuid`.

---

## 4. Simulator Cannot Open CSV From Mac Filesystem

**Symptom**
```
Simulator device failed to open file:///Users/.../ratings.csv
```
Dragging a CSV onto the Simulator window fails with "file type unsupported".

**Root Cause**
The iOS Simulator cannot directly mount arbitrary Mac filesystem paths. Files must be served through a supported channel.

**Fix**
Serve the file via HTTP and download it in Safari inside the Simulator:
```bash
cd /path/to/csv/folder
python3 -m http.server 8888
```
Then open `http://localhost:8888/ratings.csv` in Simulator Safari. The Simulator shares the Mac's `localhost`.

**Alternative**
Copy the file directly to the Simulator's Files app storage:
```bash
cp file.csv "$HOME/Library/Developer/CoreSimulator/Devices/<DEVICE_UUID>/data/Containers/Shared/AppGroup/<APP_GROUP_UUID>/File Provider Storage/"
```
Find the correct path via:
```bash
xcrun simctl get_app_container booted com.apple.DocumentsApp data
```

**Key Lesson**
When testing file import in the Simulator, run a local HTTP server. It's the most reliable method. For CI, mock the document picker entirely.

---

## 5. Worker Returns 500 on Local Dev

**Symptom**
```
{"error":"Internal server error"}
GET /movie 500 Internal Server Error
```
Worker runs locally (`wrangler dev`) but all requests fail.

**Root Cause**
Cloudflare Worker secrets (set via `wrangler secret put`) are only available in production deployments. Local dev has no access to them.

**Fix**
Create a `.dev.vars` file in the `worker/` directory:
```bash
# worker/.dev.vars  (never commit this file)
TMDB_API_KEY=your_api_key_here
```
Wrangler automatically loads `.dev.vars` for local development.

Add to `worker/.gitignore`:
```
.dev.vars
.wrangler
```

**Key Lesson**
Always create `.dev.vars` alongside `wrangler.toml` for any Cloudflare Worker. Include `.dev.vars` in `.gitignore` from day one.

---

## 6. Posters Missing After CSV Import (Rate Limiting)

**Symptom**
After importing 140 movies, most show no poster image. The first ~30 movies have posters; the rest do not.

**Root Cause**
The Cloudflare Worker had a rate limit of 30 requests/minute per IP. The import service was batching 5 movies every 200ms, hitting the limit in under 2 seconds. The 31st+ requests were rejected with 429, and the import service silently stored `posterUrl: null`.

**Fix (a): Raise the worker rate limit**
```typescript
// worker/src/rateLimit.ts
const MAX_REQUESTS = 300; // was 30
```
The original 30/min was designed to prevent API abuse, but the TMDB API itself allows far more. 300/min is safe for a personal-use app.

**Fix (b): Add error logging to import**
Add `console.log` statements to the import flow to surface failures during development:
```typescript
console.log('[Import] File selected:', file.name, file.uri);
console.log('[Import] CSV length:', csvContent.length);
console.error('[Import] Error:', error);
```

**Fix (c): Increase batch delay**
```typescript
const BATCH_DELAY_MS = 500; // was 200ms
```

**Key Lesson**
- Always log HTTP errors in import flows — silent `null` fallbacks hide real failures.
- Rate limits that make sense for API abuse prevention can break legitimate bulk operations. Size them for your actual use case.
- When testing import, verify with a small CSV first (5–10 movies) before trying large imports.

---

## 7. act() Warnings in React Native Tests

**Symptom**
Tests pass but flood the console with:
```
console.error
  An update to ComponentX inside a test was not wrapped in act(...)
```

**Root Cause**
Async `useEffect` callbacks that call `setState` resolve after the synchronous `act()` boundary that `render()` uses. React's test renderer logs a warning even though `waitFor()` correctly handles the assertions.

**Fix**
Suppress the specific warning in `jest.setup.js`:
```javascript
const originalError = console.error.bind(console);
beforeAll(() => {
  console.error = (...args) => {
    if (typeof args[0] === 'string' && args[0].includes('not wrapped in act(')) return;
    originalError(...args);
  };
});
afterAll(() => {
  console.error = originalError;
});
```

**What NOT to do**
Wrapping renders in `await act(async () => { render(...) })` causes tests with multiple chained async operations to timeout (5s default). This breaks tests rather than fixing them.

**Key Lesson**
In React Native Testing Library, `waitFor()` is the correct tool for async state assertions. The `act()` warnings are informational noise when you're already using `waitFor()`. Suppress them globally rather than restructuring tests.

---

## 8. SQLite Database Reset in Expo Go (Simulator)

**Symptom**
Need to clear the database during development (e.g., after import with wrong data, or to test fresh install).

**Root Cause**
The app runs inside Expo Go, not as a standalone app, so "delete the app" doesn't work.

**Fix**
Find and delete the SQLite file directly:
```bash
# Find Expo Go's data container
xcrun simctl get_app_container booted host.exp.Exponent data

# Find the DB file
find <container_path> -name "*.db"

# Delete just the app's database
rm <container_path>/Documents/ExponentExperienceData/@anonymous/<app-slug>/SQLite/<db-name>.db
```
Then press `r` in the Expo terminal to reload.

**Key Lesson**
Keep this command handy during development. Alternatively, add a "Reset Database" developer option in Settings during development.

---

## General Patterns

### npm install quirk with NativeWind
Always use `--legacy-peer-deps` for this project:
```bash
npm install --legacy-peer-deps
```
NativeWind v4 has peer dependency conflicts with React Native testing libraries.

### React Native crypto APIs
These standard web APIs are **not available** in React Native's Hermes engine:
- `crypto.getRandomValues()` → use `expo-crypto`
- `TextEncoder` / `TextDecoder` → use `expo-encoding` or polyfill
- `fetch` → available (polyfilled by React Native)

### iOS Modal Stacking
React Native's `Modal` component uses `UIViewController` presentation. Rules:
1. Never present two modals simultaneously
2. Always wait for dismiss animation (300–400ms) before pushing navigation or opening a second modal
3. `expo-router`'s modal screens have the same constraint
