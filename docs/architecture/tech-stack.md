# Tech Stack

> Every framework, library, and tool used in Movie Ranker, and why.

## Mobile App

| Technology | Version | Role |
| ---------- | ------- | ---- |
| [Expo](https://expo.dev) | ~55.0.7 | React Native framework and build toolchain |
| [React Native](https://reactnative.dev) | 0.83.2 | Native iOS rendering |
| [React](https://react.dev) | 19.2.0 | Component model and hooks |
| [expo-router](https://docs.expo.dev/router/introduction/) | ~55.0.6 | File-based navigation (Stack + Tabs) |
| [expo-sqlite](https://docs.expo.dev/versions/latest/sdk/sqlite/) | ~55.0.11 | Local SQLite database |
| [NativeWind](https://www.nativewind.dev) | ^4.2.3 | Tailwind CSS for React Native |
| [Tailwind CSS](https://tailwindcss.com) | ^3.3.2 | Utility-first styling (via NativeWind) |
| [TypeScript](https://www.typescriptlang.org) | ~5.9.2 | Static typing (strict mode) |
| [uuid](https://www.npmjs.com/package/uuid) | ^13.0.0 | UUID v4 generation for movie IDs |

### Native Capabilities

| Library | Version | Purpose |
| ------- | ------- | ------- |
| expo-document-picker | ~55.0.9 | File picker for CSV import |
| react-native-view-shot | ^4.0.3 | Screenshot capture for sharing |
| expo-sharing | ^55.0.12 | Native share dialog |
| @expo/vector-icons | ^15.1.1 | Ionicons for UI |
| react-native-gesture-handler | ~2.30.0 | Touch handling |
| react-native-safe-area-context | ~5.6.2 | Safe area insets |
| react-native-screens | ~4.23.0 | Native screen containers |

## Backend (Cloudflare Worker)

| Technology | Version | Role |
| ---------- | ------- | ---- |
| [Cloudflare Workers](https://workers.cloudflare.com) | — | Edge compute (TMDB API proxy) |
| [Wrangler](https://developers.cloudflare.com/workers/wrangler/) | ^4.0.0 | Worker CLI and local dev |
| TypeScript | ^5.7.0 | Type safety |

## Testing

| Tool | Version | Scope |
| ---- | ------- | ----- |
| [Jest](https://jestjs.io) | ^30.3.0 | App test runner |
| [React Native Testing Library](https://callstack.github.io/react-native-testing-library/) | ^13.3.3 | Component testing |
| [Vitest](https://vitest.dev) | ~2.1.0 | Worker test runner |
| ts-jest | ^29.4.6 | TypeScript transform for Jest |

## External APIs

| API | Usage |
| --- | ----- |
| [TMDB](https://developer.themoviedb.org/docs) | Movie search, poster images, director credits |

## Configuration

| File | Purpose |
| ---- | ------- |
| `app.json` | Expo manifest — dark theme, portrait, iOS only |
| `tsconfig.json` | Strict mode, `@/` path alias |
| `tailwind.config.js` | Custom dark color palette |
| `jest.config.js` | RN preset, transform ignore patterns |
| `babel.config.js` | `babel-preset-expo` |
| `worker/wrangler.toml` | Worker name, compatibility flags |

## Design Rationale

- **Expo over bare RN** — managed workflow, OTA updates, simpler build pipeline. See [ADR-0001](../decisions/0001-use-expo-with-file-based-routing.md).
- **SQLite over cloud DB** — local-first, offline capable, zero auth needed. See [ADR-0002](../decisions/0002-local-sqlite-for-persistence.md).
- **Worker over direct TMDB calls** — keeps API key server-side. See [ADR-0003](../decisions/0003-cloudflare-worker-tmdb-proxy.md).
- **NativeWind over StyleSheet** — consistent utility classes, dark theme tokens. See [ADR-0005](../decisions/0005-nativewind-for-styling.md).

## Related

- [Architecture Overview](overview.md)
- [Data Model](data-model.md)
