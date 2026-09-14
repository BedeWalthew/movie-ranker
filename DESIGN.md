---
name: Movie Ranker
description: The Projection Booth. One reel, one lamp, one lit frame; everything else is emulsion black.
colors:
  emulsion-black: "#050505"
  spool-chrome: "#0F0F10"
  sprocket-punch: "#1C1C1E"
  strip-rail: "#0B0B0C"
  lamp-amber: "#C8801E"
  lamp-amber-pressed: "#A8680F"
  on-amber: "#0A0A0A"
  on-amber-muted: "#3A2308"
  xenon-white: "#F4E3B2"
  emulsion-text: "#EDE6D6"
  leader-grey: "#9A958A"
typography:
  display:
    fontFamily: "BigShouldersDisplay-Black"
    fontSize: "34pt"
    fontWeight: 900
    lineHeight: 1.06
    letterSpacing: "0.5pt"
    textTransform: "uppercase"
  numeral:
    fontFamily: "BigShouldersDisplay-Black"
    fontSize: "54pt"
    fontWeight: 900
    lineHeight: 1.05
    letterSpacing: "0"
  headline:
    fontFamily: "BigShouldersDisplay-Bold"
    fontSize: "22pt"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.4pt"
    textTransform: "uppercase"
  title:
    fontFamily: "BigShouldersDisplay-Bold"
    fontSize: "20pt"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "0.3pt"
    textTransform: "uppercase"
  button:
    fontFamily: "BigShouldersDisplay-Bold"
    fontSize: "17pt"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.6pt"
    textTransform: "uppercase"
  overline:
    fontFamily: "BigShouldersDisplay-Medium"
    fontSize: "15pt"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.8pt"
    textTransform: "uppercase"
  body:
    fontFamily: "System (SF Pro)"
    fontSize: "15pt"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  action:
    fontFamily: "System (SF Pro)"
    fontSize: "13pt"
    fontWeight: 600
    lineHeight: 1.4
    letterSpacing: "normal"
  caption:
    fontFamily: "System (SF Pro)"
    fontSize: "13pt"
    fontWeight: 400
    lineHeight: 1.38
    letterSpacing: "normal"
    fontVariation: "tabular-nums"
rounded:
  thumb: "2pt"
  frame: "4pt"
  pill: "999pt"
spacing:
  hair: "4pt"
  xs: "8pt"
  sm: "12pt"
  md: "16pt"
  rail: "18pt"
  lg: "24pt"
  xl: "28pt"
  gate: "44pt"
  xxl: "48pt"
components:
  button-primary:
    backgroundColor: "{colors.lamp-amber}"
    textColor: "{colors.on-amber}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 14pt"
    height: "36pt"
  button-primary-pressed:
    backgroundColor: "{colors.lamp-amber-pressed}"
    textColor: "{colors.on-amber}"
  button-primary-wide:
    backgroundColor: "{colors.lamp-amber}"
    textColor: "{colors.on-amber}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    height: "50pt"
  button-ghost:
    backgroundColor: "{colors.emulsion-black}"
    textColor: "{colors.lamp-amber}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 18pt"
    height: "44pt"
  lamp-bar:
    backgroundColor: "{colors.lamp-amber}"
    textColor: "{colors.on-amber}"
    typography: "{typography.title}"
    rounded: "0"
    padding: "8pt 16pt 8pt 12pt"
    height: "64pt"
  lamp-bar-pressed:
    backgroundColor: "{colors.lamp-amber-pressed}"
    textColor: "{colors.on-amber}"
  chip-filter:
    backgroundColor: "{colors.emulsion-black}"
    textColor: "{colors.lamp-amber}"
    typography: "{typography.overline}"
    rounded: "{rounded.pill}"
    padding: "0 12pt"
    height: "32pt"
  chip-filter-selected:
    backgroundColor: "{colors.lamp-amber}"
    textColor: "{colors.on-amber}"
  badge-unranked:
    backgroundColor: "{colors.emulsion-black}"
    textColor: "{colors.leader-grey}"
    typography: "{typography.button}"
    rounded: "{rounded.pill}"
    padding: "0 12pt"
    height: "36pt"
  frame-lit:
    backgroundColor: "{colors.spool-chrome}"
    rounded: "{rounded.frame}"
    width: "192pt"
    height: "288pt"
  frame-thumb:
    backgroundColor: "{colors.spool-chrome}"
    rounded: "{rounded.thumb}"
    width: "44pt"
    height: "66pt"
  row-unranked:
    backgroundColor: "{colors.emulsion-black}"
    textColor: "{colors.emulsion-text}"
    typography: "{typography.title}"
    padding: "10pt 16pt"
    height: "86pt"
  nav-tab-bar:
    backgroundColor: "{colors.emulsion-black}"
    textColor: "{colors.lamp-amber}"
  nav-large-title:
    backgroundColor: "{colors.emulsion-black}"
    textColor: "{colors.emulsion-text}"
    typography: "{typography.display}"
---

# Design System: Movie Ranker

## Overview

**Creative North Star: "The Projection Booth"**

Movie Ranker is a dark room with one lamp. Every list surface is a strip of film running between two perforated rails; one frame sits in the gate and is lit, and everything else falls back into emulsion black. Lamp amber is the single tint and it is spent only on the things that move the reel forward: the primary action, the active tab, the Rank buttons, the inline Re-rank link. Xenon warm white is rarer still, reserved for the lit frame's rim, the rank numeral, and the one heading that asks the question. The poster is the unit of identity; type supports it and stays out of its way.

The world is native iPhone underneath. Navigation is a system tab bar, per-tab native stacks with large titles, the integrated search button, and the system action sheet. Character lives in the deck, the type, and the motion: Big Shoulders Display in caps for anything that names a film or an action, SF for anything that explains, and a scroll-driven reel that dims, scales and tucks its neighbours while the frame in the gate lights up with a haptic tick. Density is low on the Ranked screen (one film at a time) and list-like on Unranked (one row per film with a pill button), and both share the same rails, the same caps, the same amber.

The build rejects the category default of a poster grid with rank badges and a search field on top. It also rejects cards, decorative gradients, and glass: surfaces are flat black; depth comes from a downward lamp shadow and from darkening overlays, never from tonal panels.

**Key Characteristics:**
- Emulsion black ground with sprocket rails on every list surface (18pt rails, 22pt hole pitch)
- One tint (lamp amber) for actions; xenon white for lit rims, numerals and the question heading
- Big Shoulders Display caps for titles and buttons; system SF for body, meta and inline actions
- Depth by overlay and one downward lamp shadow; no cards, no gradients, no glass
- Native iOS chrome (tabs, large titles, search, action sheets, SF Symbols) in the booth's colours
- Motion is scroll-driven and reduces to opacity only under Reduce Motion

## Colors

A near-black neutral family in three steps, one warm amber tint, and a xenon warm white that stands in for "lit".

### Primary
- **Lamp Amber** (`{colors.lamp-amber}`): the only tint. Primary actions (Rank pills, "Rank this film", the lamp bar), the active tab and its label, the navigation tint, header ellipsis, star glyphs, the inline Re-rank and Open on Letterboxd actions, activity spinners, and the filter chip stroke at 45% alpha.
- **Lamp Amber Pressed** (`{colors.lamp-amber-pressed}`): pressed fill of every amber-filled control; there is no other pressed treatment for filled amber.
- **On Amber** (`{colors.on-amber}`): text, glyphs and thumb border sitting on amber.
- **On Amber Muted** (`{colors.on-amber-muted}`): secondary text on amber (the lamp bar's film title, year and "N left" count).

### Secondary
- **Xenon White** (`{colors.xenon-white}`): the lamp's own colour. Lit rank numerals and their rings (ring at 55% alpha), the lit frame's 1pt rim (55% alpha), the share sheet's frame borders (35% alpha) and heading, the comparison heading "Which do you prefer?", and the full-strength 2pt rim that flashes on a picked frame.

### Neutral
- **Emulsion Black** (`{colors.emulsion-black}`): the ground for every screen, header, tab bar, darkening overlay and the countdown ring's fill.
- **Strip Rail** (`{colors.strip-rail}`): the sprocket rail fill, a hair lighter than the ground.
- **Spool Chrome** (`{colors.spool-chrome}`): poster placeholder fill, the search bar tint, the comparison close button's disc, image background while a poster loads.
- **Sprocket Punch** (`{colors.sprocket-punch}`): the sprocket holes, hairline separators, hairline placeholder and rail borders, the modal grabber, the tab bar border.
- **Emulsion Text** (`{colors.emulsion-text}`): all primary text on black: large titles, film titles, empty-state headings.
- **Leader Grey** (`{colors.leader-grey}`): secondary text (year, director, counts, hints, captions), inactive tab icons and labels, unlit numerals (ring at 35%), the unranked badge stroke (50%), the placeholder film glyph.

### Named Rules
**The One Lamp Rule.** Lamp amber is the only tint. If a new surface wants a second accent colour, it is wrong; use xenon white for "lit" and leader grey for "unlit" instead.

**The Lit Means White Rule.** Amber says "act", xenon white says "this is in the gate". Numerals, rims and the question heading are white; buttons and links are amber. Do not swap them.

**The Alpha Derivative Rule.** Rims, rings and strokes are alphas of xenon white, leader grey or lamp amber (0.55, 0.35, 0.5, 0.45), never new hexes. The build introduces no grey between sprocket punch and leader grey.

## Typography

**Display Font:** Big Shoulders Display (Black 900, Bold 700, Medium 500), self-hosted TTFs under `assets/fonts/` with the OFL beside them. No fallback face is registered; the root layout holds on the black splash until the fonts load.
**Body Font:** System (SF Pro on iOS), default weight, semibold (600) for inline actions.
**Label/Mono Font:** none. Numbers set `tabular-nums` in SF wherever a year or count appears.

**Character:** Tall condensed caps that read like a can label or leader countdown, against plain SF that stays out of the way. Big Shoulders is never used in sentence case; SF is never used in caps.

### Hierarchy
- **Display** (Black, 34pt, ~36pt line, 0.5pt tracking, caps): native large titles ("RANKED", "UNRANKED"), the comparison heading "WHICH DO YOU PREFER?" in xenon white. The detail screen's film title is the same voice one step up (36/37pt, 0.4pt tracking); the share image heading is 40/42pt with 1pt tracking. Inline collapsed titles use Bold 20pt.
- **Numeral** (Black, 54pt in the large ring, 30pt medium, 20pt small; line 1.05): rank numerals inside the countdown ring; three-digit numerals shrink to 0.8, four-digit to 0.68 of the size so they stay in the ring. Font scaling is disabled on numerals only.
- **Headline** (Bold, 22/23pt, 0.4pt tracking, caps): the lit frame's title on the reel; empty-state headings are 26pt with 0.5pt tracking.
- **Title** (Bold, 20/21pt, 0.3pt tracking, caps): film titles in unranked rows and comparison frames; the lamp bar's action line "RANK A RANDOM FILM" at 20/22pt with 0.6pt tracking.
- **Button** (Bold, 17pt, 0.6pt tracking, caps): Rank pills and the ghost pill; the wide primary button uses 20pt with 0.8pt tracking; the unranked badge 16pt with 0.6pt tracking; filter chips 15pt with 0.4pt tracking.
- **Overline** (Medium, 15pt, 0.8pt tracking, caps, leader grey): the count under the large title ("18 FILMS RANKED", "122 TO RANK"). It is a count, not a kicker; it carries data.
- **Body** (SF 400, 15/21pt, leader grey): empty-state copy and explanatory hints. Detail meta (year · director) is SF 16/22.
- **Action** (SF 600, 13pt amber; 15pt for "Open on Letterboxd"): inline text actions that sit next to meta ("Re-rank"), and titles on amber (13pt, on-amber-muted).
- **Caption** (SF 400, 13/18pt, tabular): years, "of about 9", hints under buttons, the modal's "Tap the film you liked more"; 12pt for "your Letterboxd rating"; 11pt for the "N left" count and share-image years.

### Named Rules
**The Caps Are Display Rule.** Anything in Big Shoulders is uppercase and names a film, a screen or an action. Explanations, years, directors and hints are SF in sentence case. A caps label with no Big Shoulders is wrong; a Big Shoulders line in sentence case is wrong.

**The Tabular Number Rule.** Every year, count and progress figure in SF sets `tabular-nums`, so lists and counters do not jitter.

## Layout

Portrait iPhone only; no tablet, landscape or size-class branches exist. Every list surface is a strip: 18pt sprocket rails pinned to both edges (`spacing.rail`), holes 8x6pt at a 22pt pitch, and content padded inside the rails by 16pt (`spacing.md`), giving a 34pt working margin from the screen edge. The rails are decorative and absolutely positioned; on the Ranked reel they are phased to the scroll so the holes advance with the strip.

The Ranked screen stacks: overline count (16pt horizontal, 8pt below), the full-width 64pt lamp bar with no radius, then the reel filling to the tab bar. The reel is a vertical snap carousel with a 236pt pitch (`Reel.PITCH`): a 192x288pt poster plus a 64pt caption band, so neighbours tuck 52pt under the lit frame. The gate is lifted 56pt above the visible centre so the next frame peeks below the caption; the floating tab bar (safe-area bottom + 50pt) is subtracted from the visible height. The lit frame's caption hangs off the poster: the 96pt numeral overlaps the bottom-left corner (caption offset -40pt up, -28pt left) and the title block sits 10pt right of it.

The Unranked screen is a plain list on the same strip: rows are 44x66pt thumb, 14pt gap, title block, then a Rank pill; 10pt vertical and 16pt horizontal padding; hairline separators inset to the text column (16 + 44 + 14 = 74pt). The comparison modal splits the strip into two frames of `(width - 36 - 16 - 12) / 2` with a 12pt gap; the detail screen's gate poster is `width - 36 - 48` wide at 2:3, with the label block padded 42pt (rail + 24) and 44pt (`spacing.gate`) below the poster.

Rhythm: 4 / 8 / 12 / 16 / 24 / 28 / 44 / 48. Vertical steps between blocks are 8 (meta under title is 4), 12 (empty-state gap), 14–16 (row gaps), 24–28 (between button and link), 44 (from gate to label), 48 (empty-state side padding, bottom scroll padding).

## Elevation & Depth

Hybrid, in a specific order: depth is conveyed first by darkening (a black overlay whose opacity rises with distance from the gate), then by scale and tuck, and only for the lit frame by one shadow cast downward as if from the lamp above. There is no tonal layering into lighter panels: surfaces do not lift by getting lighter. The only lighter fills are functional (poster placeholder, the modal close disc, the search field).

### Shadow Vocabulary
- **Lamp** (`0 12 24 rgba(0,0,0,0.6)`; `theme.shadow.lit`): under the lit frame on the reel and the detail gate poster only. It fades in with the lit state; unlit neighbours carry no shadow.
- **Row** (`0 4 8 rgba(0,0,0,0.5)`; `theme.shadow.row`): under a countdown numeral that overlaps a poster, so the ring reads as sitting on the frame.

### Named Rules
**The Dark Falls Back Rule.** Depth away from the gate is expressed by darkening, not by lightening. Neighbour opacity follows distance: 0 at the gate, 0.4 at half a frame, 0.7 at one frame, 0.86 at two.

**The Lamp Above Rule.** Shadows are always offset downward with a soft blur (blur ≥ 2x offset); there are no hard offset shadows and no shadows on rows, chips or buttons.

## Shapes

Film frame corners everywhere: posters, rims and overlays use a 4pt radius (`rounded.frame`); thumbs at 44x66 and 32x48 use 2–3pt so the corner reads at small size; sprocket holes 1.5pt. Interactive controls are pills (`rounded.pill`): Rank buttons, the wide primary button, the ghost action, filter chips, the unranked badge, the modal close disc (32pt circle). The lamp bar is the one square-cornered control: a full-width block with no radius, because it is part of the strip, not a button floating on it.

Rims are 1pt strokes at 55% xenon white on the lit frame; the comparison pick flash is 2pt at 100%. Non-interactive strokes are hairlines in sprocket punch (separators, rail edges, placeholder borders). Unlit rings and the unranked badge use 1pt strokes at 35–50% leader grey.

## Components

### Buttons
- **Shape:** pill (999pt), caps Big Shoulders Bold, no shadow, no border on filled variants.
- **Primary (Rank pill):** lamp amber fill, on-amber text, 17pt/0.6pt tracking, 36pt min height, 64pt min width, 14pt horizontal padding.
- **Primary wide ("Rank this film" / "Re-rank this film"):** same fill, 50pt min height, 20pt/0.8pt tracking, stretches to the label column; a 13pt SF hint sits 10pt beneath it.
- **Pressed:** fill drops to lamp amber pressed. No scale, no opacity change on filled buttons.
- **Ghost ("Open the unranked reel"):** 1pt lamp amber stroke on black, amber 17pt caps, 44pt min height, 18pt padding; pressed at 0.7 opacity.
- **Inline actions ("Re-rank", "Open on Letterboxd"):** SF semibold amber, 13pt beside meta or 15pt standalone, min 28–44pt hit height, pressed at 0.6 opacity; the link carries a 13pt `arrow.up.right` SF Symbol.

### Chips
- **Style:** pill, 32pt min height, 12pt padding, 1pt stroke of lamp amber at 45% on black, `star.fill` glyph 11pt and Big Shoulders Bold 15pt label ("3+"), both amber.
- **State:** selected fills amber with on-amber glyph and label; pressed at 0.7 opacity; tapping the selected chip clears it. Chips appear only while the system search is open, in a horizontal row with 16pt side padding and 8pt gap.

### Cards / Containers
There are no cards. The containers are frames and rows:
- **Frame (lit):** 192x288pt poster, 4pt radius, 1pt xenon rim at 55%, lamp shadow, spool chrome behind the image while it loads (180ms fade-in).
- **Frame (unlit):** same poster with a black overlay at 0.7–0.86 and no rim or shadow, scaled 0.8 (one away) or 0.7 (two away).
- **Poster placeholder:** spool chrome fill, hairline sprocket-punch border, a regular-weight `film` SF Symbol in leader grey sized at 28% of the width (min 20pt).
- **Row (unranked):** 44x66 thumb at 2pt radius, title 20pt caps, year and stars beneath, Rank pill trailing; hairline separator inset to the text column; row pressed at 0.6 opacity.

### Inputs / Fields
- **Search:** the native navigation-bar search (`integratedButton` placement), amber tint, emulsion text, spool chrome bar. No custom text fields exist.

### Navigation
- **Tab bar:** `NativeTabs`, emulsion black background, amber tint; SF Symbols `film.stack` / `film.stack.fill` and `tray` / `tray.fill`; inactive icons and labels in leader grey, selected in amber.
- **Stacks:** one native stack per tab with `headerLargeTitle`, the title uppercased, Big Shoulders Black 34pt large / Bold 20pt inline in emulsion text, no header shadow, amber tint for the back chevron and buttons. The header carries the search button and an amber `ellipsis.circle` (22pt) on the right.
- **Header menu:** `ActionSheetIOS` in dark style with amber tint; Import CSV, Share Top 10, Reset Movies (destructive). Confirmations are system `Alert`s.
- **Modals:** comparison and share are sheet presentations with no header; the comparison draws its own 36x5pt grabber in sprocket punch and a 32pt spool-chrome close disc with a 16pt `xmark` in leader grey.
- **Detail:** transparent header, minimal back button in amber, no title.

### Icons
SF Symbols only, via `expo-symbols`, semibold by default (regular for the placeholder film glyph). Sizes used: 11 (stars in rows), 13 (link arrow), 16 (close), 22 (shuffle, ellipsis).

### The Reel (signature)
A vertical `FlatList` snapping at a 236pt pitch with `decelerationRate="fast"` and interval momentum disabled, data tripled so ranks wrap silently (#1 follows the last; the list re-centres in the middle copy when a scroll settles in an outer one; wrapping requires at least 2 films). All frame styling is a function of `d`, the distance from the gate in frames, interpolated from the scroll offset on the UI thread:
- scale: 1 / 0.8 / 0.7 at d = 0 / 1 / 2 (clamped)
- tuck (translateY): +56 / +34 / 0 / -10 / -20 at d = -2 / -1 / 0 / 1 / 2, so neighbours slide under the lit frame
- dark overlay opacity: 0 / 0.4 / 0.7 / 0.86 at d = 0 / 0.5 / 1 / 2
- rim and lamp shadow: 1 → 0 over d = 0 → 0.5; caption: 1 → 0 over d = 0 → 0.6
- stacking: the lit cell has the highest z-index, dropping 10 per frame of distance
A `selectionAsync` haptic fires each time a new frame reaches the gate (not on first layout). The caption is a large countdown numeral overlapping the poster's bottom-left, with the film title (22pt caps), year and Re-rank beside it. The reel remembers the last focused rank between visits.

### Sprocket Rail (signature)
An 18pt absolutely positioned rail on each edge, strip-rail fill, hairline sprocket-punch inner border, holes 8x6pt with 1.5pt radius at 22pt pitch. Given a scroll value it translates by `-(scrollY mod 22)` so the perforations move with the film. Present on Ranked, Unranked, comparison, detail and the share image; the share image draws its holes statically.

### Countdown Numeral (signature)
A rank set like an Academy leader: Big Shoulders Black numeral centred in a 1pt hairline ring on a black fill with four register ticks (top, bottom, left, right). Sizes: sm 36pt ring / 20pt numeral / 4pt ticks (comparison progress, comparison rank badge, share image); md 56 / 30 / 6 (defined, not used on any shipped surface); lg 96 / 54 / 9 (the reel caption, the detail gate, the empty gate). Lit: xenon white ink, ring at 55%; unlit: leader grey ink, ring at 35%. Long numerals shrink to stay inside the ring.

### Lamp Bar (signature)
The one amber block on the Ranked screen: full width, 64pt min height, square corners, 8pt vertical and 12/16pt horizontal padding. Left, a 32x48 poster thumb in a 1pt on-amber border; then "RANK A RANDOM FILM" (Bold 20pt caps) over the film's title and year in SF 13 semibold on-amber-muted; right, the "N left" count (SF 11 semibold, tabular) above a 22pt `shuffle` glyph. Pressed fill drops to lamp amber pressed. It is a Pressable, not a card.

### Comparison Frame
Two posters at `(width - 64) / 2`, 2:3, in one gate with a 12pt gap, both resting fully lit (no overlay). Tapping one lights a 2pt xenon rim over 180ms `Easing.out(Easing.exp)` while the other dims under a 0.6 black overlay on the same curve, a Light impact haptic fires, and the flow advances after 180ms; a Success notification haptic fires when the film lands. Pressed scale 0.98. A ranked comparison film carries a small countdown numeral 8pt from its top-right corner.

### Motion grammar
- The reel is scroll-driven: there are no fixed durations; state follows the finger, then the snap settles it. Values interpolate linearly and clamp.
- Discrete transitions use 180ms: the comparison lit/dim flash (`Easing.out(Easing.exp)`), poster image fade-in.
- Pressed feedback: fill change on amber-filled controls; opacity 0.5–0.7 on text and ghost controls; scale 0.98 on comparison frames only.
- Haptics: `selection` per frame in the gate, `impact.light` per pick, `notification.success` on placement.
- Reduce Motion: the reel sets scale to 1 and tuck to 0 and keeps the opacity crossfade (dark overlay, rim, caption); the comparison flash is unchanged.

## Do's and Don'ts

### Do:
- **Do** put sprocket rails (18pt, 22pt hole pitch) on every list or gate surface, and pad content 16pt inside them.
- **Do** spend lamp amber only on actions and the active tab; use xenon white for lit rims, numerals and the question heading.
- **Do** set every film title, screen title and button label in Big Shoulders Display caps, and every explanation, year and hint in system SF.
- **Do** express "not in the gate" with a black overlay (0.7 one frame away, 0.86 two) and no rim or shadow; express "in the gate" with a 1pt xenon rim at 55% and the lamp shadow (`0 12 24 @ 0.6`).
- **Do** use native chrome: `NativeTabs`, native stack large titles, the integrated search button, `ActionSheetIOS`, `Alert`, and SF Symbols via `expo-symbols`.
- **Do** keep 4pt frame corners on posters and pills on controls; use 2pt on thumbs under 50pt wide.
- **Do** fire a selection haptic when a frame reaches the gate and a light impact on a pick; keep discrete transitions at 180ms exponential ease-out.
- **Do** honour Reduce Motion by dropping scale and tuck and keeping opacity crossfades.
- **Do** set `tabular-nums` on years, counts and progress.
- **Do** render a missing poster as a spool-chrome frame with a regular-weight `film` glyph, never an initial letter or a blank.

### Don't:
- **Don't** introduce a second accent, a lighter panel colour, or a grey between sprocket punch and leader grey; alphas of the existing colours are the only derivatives.
- **Don't** add cards, decorative gradients, glass or blur; depth is overlay plus one downward lamp shadow.
- **Don't** put shadows on rows, chips or buttons, or use a hard offset shadow anywhere.
- **Don't** set Big Shoulders in sentence case, or SF in caps.
- **Don't** add rank badges to posters outside the countdown ring, or a poster grid with a search field on top of it (the share image is the one grid, and it is an export).
- **Don't** build a custom search bar, custom tab bar or custom action sheet; the system ones wear the booth's colours.
- **Don't** type or drag ranks; the only rank control is a comparison.
- **Don't** invent a light appearance, an iPad layout or a landscape layout: none is designed (see below).

### Not yet designed
- **Light appearance:** the app is dark only (`userInterfaceStyle` dark on sheets, light status bar). No light palette exists.
- **iPad and landscape:** portrait iPhone only; widths are derived from the window at runtime but no tablet composition exists.
- **Large Dynamic Type:** the countdown numeral disables font scaling; all other text scales with the system default, and the reel's fixed 236pt pitch and 64pt caption band have not been checked at accessibility sizes.
- **Poster dominant colour:** the lit frame is lit by overlay and rim, not by its own palette; extraction is unresolved.
