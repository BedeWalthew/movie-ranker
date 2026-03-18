# ADR-0005: NativeWind for Styling

- **Status:** Accepted
- **Date:** 2025-01-01
- **Deciders:** Project lead

## Context and Problem Statement

We need a styling approach for a dark-themed iOS app. The app has a consistent color palette (dark backgrounds, teal accents) applied across all screens. We want a system that supports design tokens and avoids verbose `StyleSheet.create` blocks.

## Decision Drivers

- Consistent dark theme across all screens
- Design tokens (colors, spacing) defined in one place
- Developer experience — concise, readable style declarations
- Compatible with Expo managed workflow

## Considered Options

1. **NativeWind (Tailwind for RN)** — Utility classes compiled to native styles
2. **React Native StyleSheet** — Built-in `StyleSheet.create` API
3. **Styled Components** — CSS-in-JS for React Native
4. **Tamagui** — Universal UI kit with compiler optimizations

## Decision Outcome

**Chosen option: "NativeWind"**, because it provides Tailwind's utility-class model with a centralized theme config (`tailwind.config.js`). Custom colors are defined once and used everywhere via class names like `bg-surface` and `text-primary`.

### Consequences

- **Good:** Theme colors defined in `tailwind.config.js` — single source of truth for the dark palette.
- **Good:** Concise markup: `className="bg-surface p-4 rounded-lg"` instead of multi-line StyleSheet objects.
- **Good:** Familiar to developers who know Tailwind CSS.
- **Bad:** Requires `--legacy-peer-deps` during install due to peer dependency conflicts with testing libraries.
- **Bad:** Adds build complexity (Babel plugin, PostCSS).
- **Neutral:** NativeWind v4 is still maturing but actively maintained.

## Theme Configuration

```javascript
// tailwind.config.js
colors: {
  background:     '#0D0D0D',   // App background
  surface:        '#1A1A2E',   // Card/list backgrounds
  'surface-light': '#252540',  // Elevated surfaces
  primary:        '#00D4AA',   // Teal accent (buttons, active states)
  'text-primary': '#E8E8E8',   // Main text
  'text-secondary': '#9CA3AF', // Secondary/muted text
}
```

## Pros and Cons of the Options

### NativeWind

- ✅ Utility classes — fast to write, easy to scan
- ✅ Centralized theme config
- ✅ Growing community and Tailwind familiarity
- ❌ Peer dependency conflicts require `--legacy-peer-deps`
- ❌ Additional build tooling

### React Native StyleSheet

- ✅ Zero dependencies — built into RN
- ✅ No build plugins
- ❌ Verbose — each component needs a StyleSheet block
- ❌ No built-in theme system — constants must be manually imported
- ❌ Styles and markup separated

### Styled Components

- ✅ Co-located styles with components
- ✅ Theme provider for design tokens
- ❌ Runtime overhead
- ❌ Different mental model from Tailwind
- ❌ Bundle size impact

### Tamagui

- ✅ Compiler-optimized styles
- ✅ Built-in theme system and components
- ❌ Heavy — includes a full component library
- ❌ Steeper learning curve
- ❌ Overkill for a focused app like this

## Links

- [NativeWind documentation](https://www.nativewind.dev)
- [Tailwind config](../../tailwind.config.js)
- [Theme module](../../lib/theme.ts)
