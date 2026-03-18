# ADR-0001: Use Expo with File-Based Routing

- **Status:** Accepted
- **Date:** 2025-01-01
- **Deciders:** Project lead

## Context and Problem Statement

We need a React Native framework for an iOS movie-ranking app. The app has tab navigation, modal screens, and a dynamic detail route. We want fast iteration, minimal native configuration, and a clear routing model.

## Decision Drivers

- Rapid prototyping with minimal native setup
- File-based routing for predictable navigation structure
- Strong ecosystem for managed builds and OTA updates
- iOS-only target simplifies requirements

## Considered Options

1. **Expo (managed) with expo-router** — file-based routing, managed workflow
2. **Bare React Native with React Navigation** — manual linking, full native control
3. **Expo with React Navigation** — Expo managed but manual route config

## Decision Outcome

**Chosen option: "Expo with expo-router"**, because it provides file-based routing that mirrors our screen structure, eliminates native linking boilerplate, and keeps the managed workflow for simpler builds.

### Consequences

- **Good:** Routes match the file system — `app/(tabs)/index.tsx` is the ranked tab, `app/movie/[id].tsx` is the detail screen. No separate route config file.
- **Good:** Managed Expo workflow means `expo start` and press `i` — no Xcode project management.
- **Good:** EAS Build available when we need production builds.
- **Bad:** Less control over native modules than bare RN. If we need a custom native module, we'd need to eject or use a config plugin.
- **Neutral:** expo-router is relatively new but actively maintained and widely adopted.

## Pros and Cons of the Options

### Expo with expo-router

- ✅ File-based routing matches our navigation tree exactly
- ✅ Managed workflow eliminates iOS project config
- ✅ Built-in support for tabs, stacks, modals via folder conventions
- ❌ Less flexibility for custom native code

### Bare React Native with React Navigation

- ✅ Full control over native code and linking
- ✅ Mature, battle-tested navigation library
- ❌ Requires manual Xcode project management
- ❌ Route configuration is separate from file structure
- ❌ More boilerplate for navigation setup

### Expo with React Navigation

- ✅ Managed Expo benefits
- ✅ Familiar React Navigation API
- ❌ Route config separate from files — easier to get out of sync
- ❌ More setup code than expo-router

## Links

- [expo-router documentation](https://docs.expo.dev/router/introduction/)
- [Architecture Overview](../architecture/overview.md)
