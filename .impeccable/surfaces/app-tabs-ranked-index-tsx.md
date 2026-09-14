---
version: 1
slug: "app-tabs-ranked-index-tsx"
primary_target: "app/(tabs)/(ranked)/index.tsx"
related_targets: ["app/(tabs)/(unranked)/unranked.tsx","app/comparison.tsx","app/movie/[id].tsx","app/(tabs)/_layout.tsx","lib/components/Reel.tsx"]
---

# Ranked screen (app/(tabs)/index.tsx) and the app shell

Scope: whole-app redesign on iOS, dark only. Visitor mode: Operate. Audience: Letterboxd users ranking their own watched list on a phone in short evening sessions. Task: browse the ranked list, start ranking a random unranked film, open a film. Content: real posters from TMDB (may be missing), title, year, director, Letterboxd stars, rank. Constraints: expo-router tabs, expo-sqlite data, Jest suite relies on screen testIDs; portrait iPhone only.

Chosen direction: The Projection Booth (Impeccable's pick, seed 13cad7c6). Memorable moment: the ranked list is one film strip running through a projector gate; the frame in the gate is the only lit thing on screen.

## Direction contract

THESIS: The ranked list is a single reel threaded through a projector gate. One frame is in the gate, lit by the lamp; everything else is dark emulsion. It refuses the category default of a poster grid with rank badges and a search field on top.

OWN-WORLD: Emulsion black ground (#050505). A vertical strip with sprocket-hole rails at both edges, punched rectangles at fixed pitch that run the full height of every list surface. Lamp amber (#C8801E) is the single tint: primary actions, active tab, the rank numeral. Xenon warm white (#F4E3B2) only as the lit frame's rim and lit text. Spool grey (#3A3A3A) for unlit chrome and dividers. Rank numerals set as leader countdown numerals: Big Shoulders Display heavy, inside a hairline circle with a sweep tick. Titles in Big Shoulders Display caps; body and labels in SF. Shadows carry an offset and blur, cast downward from the lamp. No cards, no gradients-as-decoration, no glass.

STORY: You open the app and your #1 is lit in the gate. You scrub the reel; each frame ticks into the gate with a haptic, the previous one falls back into the dark. The amber bar at the top offers one random unranked film; you tap it, answer a few "which do you prefer" picks between two frames, and return to see the new frame lit at its earned rank.

FIRST VIEWPORT: iPhone 17 Pro 402x874. Under the safe area: "RANKED" in Big Shoulders caps, 34pt, with the count "128 films" in SF caption beside it. Below, pinned full-width: the lamp bar, 56pt tall amber block, left a 32x48 poster thumb of the random pick, "RANK A RANDOM FILM" in caps and the film's title underneath in SF 13, right a shuffle glyph; this is the primary action. Under it the reel fills to the tab bar: sprocket rails 18pt wide down both edges; the lit frame centered, poster 236x354 (2:3) at full brightness with a 1pt warm rim and a 0 12 32 shadow; the countdown numeral of its rank overlapping the poster's bottom-left corner at 72pt inside a 96pt hairline circle; title in caps and year set right of the numeral. Frames above and below peek at 0.82 scale, 40% opacity, stacked one level under the lit frame. Tab bar: system, amber tint, two tabs Ranked and Unranked.

FORM: The Projection Booth, position 1 of 7 on the ordered grounded list, presented as IMPECCABLE'S PICK against assigned candidate 4 (The Collection Shelf); seed key 13cad7c6. Signature interaction: the reel scrub, a vertical snap-to-frame carousel that wraps so #1 follows the last, with the lit state crossfading in on the frame that reaches the gate and a light haptic tick per frame. Motion grammar: exponential ease-out, 260ms, scale and opacity only for neighbours, brightness via overlay for the lit frame; Reduce Motion drops the scale change and keeps the crossfade.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Cross-surface reach

- Unranked tab: the reel bin. Rows on the same sprocket-railed strip: poster thumb 44x66, title in caps, year and stars, an amber RANK button. Search and star filter live in a system search field in the navigation bar, not a custom bar.
- Comparison modal: two frames side by side in one gate; "Which do you prefer?" in caps, progress as "3 of ~9" in the countdown circle style; tapping a frame lights it for 180ms then advances.
- Detail: the poster in the gate at full width, the countdown numeral of its rank, then a can-label block: title, year, director, stars, Letterboxd link; a RE-RANK amber button.
- Header menu: Import CSV, Share Top 10, Reset Movies as a system action sheet from an ellipsis in the navigation bar.

## Unresolved

- Poster dominant colour is not extracted; the lit frame is lit by overlay, not by its own palette.
