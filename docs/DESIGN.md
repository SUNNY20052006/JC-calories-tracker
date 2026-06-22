# DESIGN.md — JC Food Tracker
### Master Design Specification v1.0

---

## 1. Executive Summary

### Redesign Vision

JC is a tool people open five times a day. It lives between meals, between thoughts, between workouts. The visual language must be fast to read, calm to look at, and invisible when the user is not actively using it. The redesign does not chase trend — it chases *clarity*.

The current app has a working dark foundation and a coherent color system for macros. The problems are systemic: eight border radius values, three identical grays, no spacing scale, components that were each designed in isolation, and a DailyProgress card that visually understates the most important information in the app.

The redesign direction is **Liquid Dark Glass** — a minimal, elevated dark-first interface that uses frosted glass surfaces precisely where they create depth and hierarchy, with atmospheric backlighting behind primary glass surfaces to create genuine spatial separation between layers. Inspired by Apple's Liquid Glass demonstrations, the surface logic of Apple's Human Interface Guidelines for visionOS, the restraint of Linear, and the typographic discipline of Craft.

### Key Design Goals

1. One glance at the Home screen should tell the user where they stand for the day
2. The food logging flow (type → analyze → save) should feel frictionless — under 3 taps
3. Every surface must serve a purpose; no decoration without function
4. The component set must be internally consistent — same radius, same spacing unit, same elevation logic everywhere
5. Glass is spatial, not decorative — used only on floating surfaces that sit above scrollable content, with atmospheric lighting underneath to reinforce the separation between planes

### Major Opportunities

- **DailyProgress** — the most important component in the app is visually weak; the ring values are small and the layout is fragmented
- **Entry cards** — macro values on log cards show no units, making numbers like "462" and "12" indistinguishable without context
- **Border radius anarchy** — 8 different values in the codebase; reducing to 3 immediately elevates perceived quality
- **Settings header duplication** — both the tab bar and the page show "Settings"; eliminating one reduces noise
- **Modal header inconsistency** — Log Food has only Cancel; Edit Entry has Cancel + Save; they must match
- **Tab bar** — currently a standard Material tab bar; should become a floating Liquid Glass island that lifts off the screen floor with atmospheric backlighting
- **Empty states** — pure gray text with no icon, no structure, no invitation to act

### Summary of Transformation

The app transforms from a functional but visually unpolished utility into a premium daily-use health tool that users are proud to open. The change is achieved through discipline and deliberate depth: fewer visual variables, deeper spacing, more decisive typography, a floating tab bar island that lifts off the screen, and glass surfaces with atmospheric backlighting that creates genuine three-dimensional separation between the background, content, and floating UI planes.

---

## 2. Current State Assessment

### Strengths

- **Macro color system is excellent.** Blue (calories), green (protein), cyan (carbs), orange (fat) — consistent, distinctive, accessible, used throughout the app. Keep exactly as-is.
- **Dark foundation is correct.** `#0C0C0E` is a near-true black that works well on OLED screens. No need to change the base background.
- **Swipe navigation feels native.** The RNGH Pan gesture implementation is clean after the recent fix.
- **Oil slider concept is unique.** No other calorie tracker has this. The label system (No oil → Very oily) is immediately understandable.
- **Food entry UX is good.** Single natural-language input, no dropdowns, no category pickers. This is the right approach.
- **Raw/cooked toggle is thoughtful.** Especially for Indian cuisine where this matters significantly.
- **BlurView on log cards creates real depth.** The frosted glass on the Entries screen log cards is one of the most successful visual moments in the app.

### Weaknesses

- **Eight border radius values** (8, 10, 12, 14, 16, 20, 24, 28) with no rationale. Each component looks designed in isolation.
- **Three near-identical grays** (`#98989D`, `#8E8E93`, `#636366`) used interchangeably. No semantic separation between "secondary text", "hint text", and "disabled text."
- **DailyProgress is weak.** The ring values (1202, 125, 103, 30) are the same size as the label below them. The current value should be the dominant element. The rings are also equal in visual weight — Calories should read as primary.
- **Entry card macro values have no units.** The numbers 462, 76, 8, 12 appear without kcal/g context. First-time users cannot interpret these.
- **"Settings" appears twice** — once in the tab bar, once as a 28px page title. This creates redundant hierarchy.
- **Modal headers are inconsistent.** Log Food shows `Cancel | Log Food`. Edit Entry shows `Cancel | Edit Entry | Save`. The three-part header should be the standard.
- **The "Analysis Result" heading** at 20px/700 over the macro edit inputs creates an awkward jump from functional (analyze button) to presentational (section title) to functional again (editable inputs).
- **FoodEntry uses a `require()` inside the component body** for TextInput — an anti-pattern that re-imports on every render.
- **Tab bar is flat** — no separation from the content below it. On scroll, content bleeds into the tab bar without any visual boundary.
- **FAB overlaps content** — the last log card is partially hidden behind the floating action button.
- **EmptyState is invisible** — centered gray text on black, no icon, no contrast hierarchy, no call to action that directs the user.
- **KeyboardAvoidingView `behavior="padding"`** with `keyboardVerticalOffset={0}` on both platforms does nothing useful on Android. Android should use `behavior="height"`.

### Opportunities

| Priority | Opportunity | Impact |
|----------|-------------|--------|
| 1 | Strengthen DailyProgress into the signature visual element | Very high |
| 2 | Unify border radius to 3 values | High |
| 3 | Floating Liquid Glass island tab bar | High |
| 4 | Add units to entry card macros | High |
| 5 | Motion continuity across analyze → save flow | High |
| 6 | Analysis Result promoted to glass surface with connected entrance | High |
| 7 | Standardize modal headers | Medium |
| 8 | Add icon to EmptyState | Medium |
| 9 | Remove duplicate "Settings" title | Medium |
| 10 | Consolidate gray palette to 2 semantic values | Medium |
| 11 | Consistent elevation system with atmospheric layers | Medium |

---

## 3. Design Philosophy

### Visual Goals

JC should feel like a **precision instrument** — not clinical, not cold, but purposeful. Every pixel should earn its place by either communicating data or creating the spatial structure that makes data readable. Decoration that does not serve information should be removed.

### Product Personality

If JC were a physical object, it would be a matte black Moleskine with colored ink for macros — understated, high-quality, used by someone who takes their health seriously but doesn't need to advertise it.

The app should feel:
- **Calm**: low visual noise, dark surfaces, no bright backgrounds
- **Confident**: bold typography for values, quiet typography for labels
- **Fast**: immediate visual hierarchy tells the user what matters before they read anything
- **Native**: uses platform idioms (glass, spring animation, system gesture patterns) that feel like they belong on the device

### Design Principles

1. **Data is the hero.** The macro numbers (1202 kcal, 125g protein) are more important than any heading. Typography should reflect this — values large, labels small.
2. **Glass serves hierarchy, not style.** A frosted glass surface means "this floats above the content." Use it only where that meaning is true: tab bar island, DailyProgress card, Analysis Result card, day picker header. Every glass surface has atmospheric backlighting beneath it that reinforces its elevation.
3. **Depth is earned.** Three visible planes — background, content, floating — must be perceptible at a glance. The background plane is pure dark. The content plane is raised dark surfaces. The floating plane is glass with atmospheric light.
4. **Motion is continuity, not decoration.** Elements do not appear and disappear — they transform between states. The Analyze button does not vanish and reappear; the Analysis Result card rises from the space below the button. The Save button does not reset; it crossfades to a confirmation state and fades back. Every action has a connected visual outcome. If an element can be seen to cause another, the transition should make that causality visible. See §11b for the full specification.
5. **One spacing unit.** All spacing is a multiple of 4px. This eliminates the arbitrary 6px, 10px, 14px gaps that exist in the current codebase.
6. **Three radius values.** Small (10px) for chips and inputs. Medium (16px) for cards. Large (24px) for buttons, the tab bar island, and modal top corners.
7. **The glow is subliminal.** Atmospheric backlighting behind glass surfaces should be noticed only when the user looks for it. If the glow is identifiable without looking, reduce its opacity by 50%. The light exists to make the darkness feel inhabited, not to decorate the interface.

### Why This Direction Fits JC

JC is opened multiple times daily by someone who already knows what they're doing. The interface should get out of the way. The calm, dark, glass-accented direction minimizes cognitive load between meals and maximizes the signal-to-noise ratio of the macro data.

---

## 4. Visual Identity

### Overall Visual Style

**Liquid Dark Glass.** A near-black base with three distinct visual planes: a dark background, dark-surface content cards, and floating glass elements that carry atmospheric backlighting beneath them. The glass is not decorative — it is a spatial statement. When the user sees a glass surface, they understand it occupies a higher plane than the content behind it. The atmospheric glow behind each glass surface reinforces this physically: light appears to emanate from beneath the glass, as if the surface is genuinely floating above a lit substrate.

### Surface Strategy

Five surface levels, each with a specific function and rendering treatment:

| Level | Name | Color / Treatment | Function |
|-------|------|-------------------|----------|
| −1 | Atmospheric | Radial gradient glow — not a rendered layer | Backlighting behind glass surfaces |
| 0 | Base | `#0C0C0E` | Screen background, modal content areas |
| 1 | Surface | `#1C1C1E` | Cards, inputs, log entries, settings rows |
| 2 | Elevated | `#2C2C2E` | Settings input fields, secondary inputs |
| 3 | Glass | `rgba(28,28,30,0.72)` + blur + top highlight | DailyProgress, Analysis Result, day picker, tab bar island |

Level −1 (Atmospheric) is not a rendered View at a specific position — it is a `View` with `position: 'absolute'`, large `borderRadius` to create an elliptical soft shape, a low-opacity macro colour as `backgroundColor`, and `zIndex` lower than the glass surface but higher than Base. It creates the illusion that the glass is lit from below.

### Layering Strategy

```
[Glass — Level 3]           DailyProgress, Analysis Result, Tab bar island, Day picker
        ↑ floats above
[Atmospheric — Level −1]    Soft colour glow beneath each glass surface
        ↑ illuminates
[Content — Level 1]         Cards, inputs, log entry rows
        ↑ sits above
[Base — Level 0]            Screen background
```

Reading the stack from bottom to top: the dark base is the void. Content cards float slightly above it via colour difference alone. Glass surfaces float higher still, their position reinforced by both blur and atmospheric colour between them and the content beneath.

### Depth Strategy

Depth is created through four mechanisms, in order of importance:

1. **Blur** — glass surfaces have `backdropBlur` via BlurView. Blurred content behind glass reads as spatially behind it.
2. **Atmospheric glow** — a soft, large-radius coloured ellipse behind each glass surface creates the sense of a light source beneath the glass plane.
3. **Surface color** — `#1C1C1E` (content) vs `#0C0C0E` (base) creates a subtle luminosity step. `rgba(28,28,30,0.72)` (glass) appears slightly lighter due to blur collecting ambient atmospheric light.
4. **Top highlight border** — `rgba(255,255,255,0.14)` on the top edge of every glass surface simulates a specular reflection from an overhead light source, a hallmark of Apple's Liquid Glass language.

No drop shadows on non-glass surfaces. Drop shadows only on the FAB, using `#0A84FF` glow rather than black.

### Glass Strategy

Glass appears on exactly four elements:

1. **Tab bar island** — floats detached above the screen floor, with horizontal atmospheric glow beneath it
2. **DailyProgress card** — primary glass surface on Home; aurora-style multi-colour atmospheric glow beneath it
3. **Analysis Result card** — secondary glass surface on Home; blue atmospheric glow beneath it, appears after analysis
4. **Entries day picker** — floats above the log list; neutral atmospheric glow beneath it

Everything else is Surface (Level 1) or Base (Level 0). Log entry cards, FoodItemCards, settings rows, and modal content areas are **not** glass.

### Atmospheric Lighting Strategy

Each glass surface has a dedicated atmospheric layer positioned absolutely behind it. Implementation uses a `View` with:

```
position: 'absolute'
// Wider and taller than the glass surface above it
width: surfaceWidth + 60
height: surfaceHeight + 40
borderRadius: (surfaceHeight + 40) / 2   // fully elliptical
backgroundColor: atmosphericColour
opacity: 0.02 to 0.04
// Centred behind the glass surface
alignSelf: 'center'
```

**DailyProgress atmospheric layer** — four overlapping elliptical Views, one per macro colour, each at 2–2.5% opacity. The four ellipses are offset slightly (one per quadrant) to create a diffuse aurora effect. In practice the total perceived glow is a warm multicolour haze that bleeds the macro palette into the space behind the card. The effect should be subliminal — noticed only when the user looks for it, never demanding attention.

**Analysis Result atmospheric layer** — single elliptical View in `#0A84FF` at 5% opacity, slightly wider than the card. Fixed colour regardless of which macro dominates the result — simplicity and performance over dynamic reactivity.

**Tab bar island atmospheric layer** — elongated horizontal ellipse in `#0A84FF` at 4% opacity, positioned directly below the island. Width matches island width. Height approximately 24px. Creates the sense the island is lit from the screen surface below it.

**Day picker atmospheric layer** — `rgba(255,255,255,0.015)` neutral glow — no colour tint because the day picker has no dominant macro association.

### Emotional Feel

Opening JC should feel like looking at a premium instrument — coloured values glowing against deep dark, glass surfaces catching light from below, the tab bar island floating above the screen floor like something genuinely physical. The app is dark but not cold. The atmospheric light makes the darkness feel inhabited rather than empty.

---


## 5. Color System

### Background Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `bg-base` | `#0C0C0E` | All screen backgrounds, modal content areas |
| `bg-surface` | `#1C1C1E` | Cards, log entries, input backgrounds, modal headers |
| `bg-elevated` | `#2C2C2E` | Settings input fields, secondary inputs, chip backgrounds |
| `bg-glass` | `rgba(28,28,30,0.72)` | Tab bar, DailyProgress, day picker (always + blur) |

### Nutrition Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `macro-calories` | `#0A84FF` | Calories value, ring, chip, progress. Primary blue. |
| `macro-protein` | `#30D158` | Protein value, ring, chip, progress. Green. |
| `macro-carbs` | `#5AC8FA` | Carbs value, ring, chip, progress. Cyan. |
| `macro-fat` | `#FF9F0A` | Fat value, ring, chip, progress. Amber. |

These four colors are the visual identity of the app. They must never be used for anything other than their designated macro. `#0A84FF` should not be used for buttons, links, or interactive states — use `#0A84FF` only for calories.

> **Exception:** Primary action buttons use `#0A84FF` because the primary action in the app (Analyze) is directly about tracking. This is acceptable but should not be extended to destructive or neutral actions.

### Semantic Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `color-primary` | `#0A84FF` | Primary buttons (Analyze, Save), active states |
| `color-error` | `#FF453A` | Delete actions, error states, validation messages |
| `color-success` | `#30D158` | Save confirmations (reuse macro-protein — intentional, saves a color) |
| `color-border` | `rgba(84,84,88,0.65)` | Input outlines, card borders, dividers |
| `color-border-subtle` | `rgba(255,255,255,0.08)` | Card outer borders, glass edges |

### Text Colors

| Token | Hex | Usage |
|-------|-----|-------|
| `text-primary` | `#FFFFFF` | All primary content text, values, food names |
| `text-secondary` | `#98989D` | Labels below values, section headers, timestamps |
| `text-disabled` | `#636366` | Placeholder text, inactive tab labels, oil slider labels (non-active) |

**Rule:** Three text colors only. `#8E8E93` is retired and replaced with `#98989D` everywhere it appeared.

### Atmospheric Glow Colors

These colours are used exclusively for the atmospheric backlighting layers beneath glass surfaces. They are never used for text, borders, or interactive elements.

| Token | Value | Used behind |
|-------|-------|-------------|
| `glow-calories` | `rgba(10,132,255,0.025)` | Analysis Result card |
| `glow-protein` | `rgba(48,209,88,0.02)` | DailyProgress aurora (quadrant 2) |
| `glow-carbs` | `rgba(90,200,250,0.02)` | DailyProgress aurora (quadrant 3) |
| `glow-fat` | `rgba(255,159,10,0.02)` | DailyProgress aurora (quadrant 4) |
| `glow-primary` | `rgba(10,132,255,0.02)` | Tab bar island underlight |
| `glow-neutral` | `rgba(255,255,255,0.015)` | Day picker underlight |
| `glow-aurora-1` | `rgba(10,132,255,0.025)` | DailyProgress aurora (quadrant 1, calories) |

**Atmospheric opacity rules:**
- Maximum single-layer glow opacity: `0.04` — above this the glow risks becoming a perceptible colour wash rather than a subliminal light source. The test: if you can identify the colour of the glow without consciously looking for it, reduce opacity by 50%.
- Atmospheric layers are never visible on their own; they must always be behind a glass (BlurView) surface
- On Android, reduce all glow opacities by a further 30% if BlurView renders at full intensity — the blur already lifts the perceived brightness of anything behind it
- The glow should be the last thing a user notices, not the first



- Macro colors are semantic. Never use `#30D158` (protein-green) for a success state that is unrelated to protein.
- Background colors form a strict hierarchy. Never place `bg-base` on top of `bg-surface`.
- Buttons use `color-primary` for contained primary actions and `rgba(10,132,255,0.15)` fill with `#0A84FF` text/border for outlined secondary actions.
- Destructive actions (Delete) use `color-error` for text, never for button fill.

---

## 6. Liquid Glass System

### Where Glass Is Allowed

| Element | Justification |
|---------|---------------|
| Tab bar | Floats above all screen content; glass signals this spatial relationship |
| DailyProgress card | Anchored to the top of the home scroll; glass separates it from scrolling content |
| Entries day picker | Sticky header that floats above the scrolling log list |
| Modal header bars | Sit above the scrollable modal content |

### Where Glass Is Forbidden

| Element | Reason |
|---------|--------|
| Log entry cards | Content plane, not floating. Use `bg-surface`. |
| FoodItemCard | Inline content. Use `bg-surface`. |
| Settings rows | Grounded content rows. Use `bg-surface`. |
| Buttons | Interactive controls, not surfaces. No glass. |
| Input fields | Grounded content. Use `bg-elevated`. |
| Modal content areas | Below the modal header glass; use `bg-base`. |

### Core Glass Specification

Every glass surface in the app shares this foundation:

```
BlurView:
  tint: "dark"
  intensity: 28                              // never exceed 40 — milky above this
  backgroundColor: rgba(28,28,30,0.72)

Border (all sides):
  borderWidth: 1
  borderColor: rgba(255,255,255,0.08)

Top specular highlight (REQUIRED on all glass — this is the Liquid Glass signature):
  borderTopColor: rgba(255,255,255,0.16)     // slightly stronger than side borders
  borderTopWidth: 0.5

Bottom edge (glass only — subtle inner shadow):
  borderBottomColor: rgba(0,0,0,0.30)
  borderBottomWidth: 0.5

Corner treatment:
  overflow: "hidden"
  borderRadius: see per-element spec below
```

### Atmospheric Layer Specification

Every glass surface has a corresponding atmospheric layer. Implementation pattern:

```jsx
// Wrap the glass surface in a relative-positioned View
<View style={{ position: 'relative' }}>

  {/* Atmospheric layer: rendered BEFORE (behind) the BlurView */}
  <View
    style={{
      position: 'absolute',
      width: '120%',           // wider than the glass
      height: '140%',          // taller than the glass
      left: '-10%',            // centred horizontally
      top: '-20%',             // bleeds above the glass edge
      borderRadius: 9999,      // fully elliptical
      backgroundColor: atmosphericColor,
      opacity: atmosphericOpacity,  // 0.02–0.04 (subliminal — barely visible)
    }}
  />

  {/* The glass surface itself */}
  <BlurView tint="dark" intensity={28} style={glassStyle}>
    {children}
  </BlurView>

</View>
```

For the DailyProgress multi-colour aurora, render four atmospheric Views (one per macro colour) each offset slightly into their quadrant, all at 2–2.5% opacity. The combined effect of four overlapping ellipses at this level is still subliminal — a warmth behind the glass, not a visible tint.

### Per-Element Glass Rules

---

**DailyProgress** *(Primary glass surface)*
```
BlurView intensity: 28
borderRadius: 16 (radius-md)
borderWidth: 1, borderColor: rgba(255,255,255,0.08)
borderTopColor: rgba(255,255,255,0.16), borderTopWidth: 0.5
borderBottomColor: rgba(0,0,0,0.30), borderBottomWidth: 0.5
overflow: hidden
marginHorizontal: 16
marginTop: 8
padding: 20

Atmospheric — aurora (4 ellipses, one per macro):
  Ellipse 1 (calories/blue):  left: -10%, top: -30%,  width:80%, height:80%, rgba(10,132,255,0.025)
  Ellipse 2 (protein/green):  right:-10%, top: -20%,  width:70%, height:60%, rgba(48,209,88,0.02)
  Ellipse 3 (carbs/cyan):     left: -5%,  bottom:-20%,width:70%, height:60%, rgba(90,200,250,0.02)
  Ellipse 4 (fat/amber):      right:-5%,  bottom:-30%,width:60%, height:50%, rgba(255,159,10,0.02)
```

---

**Analysis Result card** *(Secondary glass surface — promoted from Surface)*
```
BlurView intensity: 24          // slightly less than DailyProgress — secondary status
borderRadius: 16 (radius-md)
borderWidth: 1, borderColor: rgba(255,255,255,0.08)
borderTopColor: rgba(255,255,255,0.14), borderTopWidth: 0.5
borderBottomColor: rgba(0,0,0,0.25), borderBottomWidth: 0.5
overflow: hidden
marginHorizontal: 16
marginTop: 16
padding: 16

Atmospheric — single blue ellipse:
  Position: centred behind card, 20% wider, 30% taller
  backgroundColor: rgba(10,132,255,0.025)
  borderRadius: 9999
```

The Analysis Result transitions from invisible to visible with:
```
opacity: 0 → 1 over 220ms, Easing.out(Easing.cubic)
```
This is the most important animation in the analysis flow — the glass surface materialises as if condensing out of the dark.

---

**Tab Bar Island** *(Floating glass island — detached from screen edges)*
```
BlurView intensity: 36          // stronger — sits over the most varied content
borderRadius: 24 (radius-lg)    // pill shape
borderWidth: 1, borderColor: rgba(255,255,255,0.10)
borderTopColor: rgba(255,255,255,0.20), borderTopWidth: 0.5
borderBottomColor: rgba(0,0,0,0.40), borderBottomWidth: 0.5
overflow: hidden

Dimensions:
  width: screenWidth - 48       // 24px margin on each side
  height: 64px (content) + bottomInset
  position: absolute
  bottom: 16 + bottomInset      // lifted off the screen floor
  alignSelf: center
  left: 24
  right: 24

Atmospheric — horizontal glow beneath island:
  position: absolute
  bottom: 8 + bottomInset       // slightly below the island
  left: 40, right: 40           // narrower than island
  height: 20
  borderRadius: 9999
  backgroundColor: rgba(10,132,255,0.02)

FAB bottom: 16 + 64 + bottomInset + 16  // sits above island
```

The island floats. It does not touch the left or right screen edges. It does not touch the bottom of the screen (on phones with a home indicator, it sits above the indicator area with a 16px gap).

---

**Day Picker (Entries)**
```
BlurView intensity: 28
borderRadius: 0               // full-width strip, no rounded corners
borderBottomWidth: 1
borderBottomColor: rgba(255,255,255,0.08)
paddingVertical: 10
paddingHorizontal: 16

Atmospheric — full-width neutral haze:
  position: absolute
  width: '100%', height: '200%'
  top: '-50%'
  backgroundColor: rgba(255,255,255,0.015)
  (no borderRadius — full width)
```

---

**Modal headers**
```
BlurView intensity: 28
borderRadius: 0               // top of modal — no bottom radius
borderBottomWidth: 1
borderBottomColor: rgba(255,255,255,0.08)
borderTopColor: rgba(255,255,255,0.14), borderTopWidth: 0.5
paddingHorizontal: 16
paddingTop: Platform.OS === 'ios' ? safeAreaInsets.top + 8 : 16
paddingBottom: 12

No atmospheric layer — modal headers have content (screen background) above them,
not below them, so atmospheric backlighting has no meaningful target.
```

### Good and Bad Glass Usage

**Good:** `BlurView intensity={28}` on DailyProgress with four atmospheric ellipses — the aurora behind the card creates genuine spatial depth without adding visual noise to the data inside the card.

**Good:** Tab bar island with `intensity={36}` lifted 16px above the screen bottom — the island appears to physically hover, reinforced by the horizontal atmospheric glow beneath it.

**Bad:** `BlurView intensity={40}` on every log entry card in a scroll list — seven simultaneous BlurViews causes measurable jank on mid-range Android. Fix: replace with `View backgroundColor="#1C1C1E"`. Log cards are content, not floating surfaces.

**Bad:** Atmospheric layers with `opacity > 0.04` on any single ellipse — at this level the glow becomes identifiable without looking for it, which means it has crossed from subliminal depth cue to visible decoration. If in doubt, halve it.

**Bad:** Atmospheric layers without a glass (BlurView) surface above them — the atmospheric glow is meaningless without the glass surface it is lighting from below.

---



## 7. Typography System

JC uses the system font stack (San Francisco on iOS, Roboto on Android). No custom typeface is needed — the system font is already optimized for legibility at small sizes on these displays.

### Type Scale

| Role | Size | Weight | Line Height | Color | Usage |
|------|------|--------|-------------|-------|-------|
| `display` | 34px | 800 | 40px | `text-primary` | Not currently used — reserved for onboarding hero number |
| `title-large` | 22px | 700 | 28px | `text-primary` | "Today" in DailyProgress |
| `title` | 20px | 700 | 26px | `text-primary` | Screen section headers ("Analysis Result", "Food Items") |
| `heading` | 17px | 600 | 22px | `text-primary` | Modal titles, card titles |
| `body` | 15px | 400 | 20px | `text-primary` | Food description text, settings labels, input labels |
| `body-emphasis` | 15px | 600 | 20px | `text-primary` | Input labels, oil slider label, button text |
| `caption` | 13px | 500 | 18px | `text-secondary` | Timestamps, section labels (uppercase), log card meta |
| `caption-small` | 11px | 600 | 14px | `text-secondary` | Tab bar labels, oil slider tick labels, nutrient chip labels |
| `ring-value` | 18px | 700 | 22px | macro color | Current value inside/below a progress ring |
| `ring-label` | 11px | 500 | 14px | `text-secondary` | Label below ring ("Calories", "Protein") |
| `macro-large` | 24px | 700 | 28px | macro color | Large macro display in modal analysis result |

### Typography Rules

1. **Values are always larger than their labels.** A calorie count (18px/700) must be visually dominant over the word "Calories" (11px/500).
2. **Section headers (DAILY NUTRITION TARGETS) use uppercase + letter-spacing: 0.5.** This pattern is used only for section grouping labels, never for content.
3. **Button text is always 15px/600.** Not 16px. Consistency across all buttons.
4. **Macro chip values are 14px/700.** Labels inside chips are 11px/600 at 80% opacity.
5. **Modal titles are 17px/600.** Not 20px — modals are contextual overlays, not primary screens.

---

## 8. Spacing System

All spacing is based on a **4px base unit**. Every margin, padding, and gap in the app is a multiple of 4.

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Micro spacing — label-to-value gaps, icon margins |
| `space-2` | 8px | Chip padding (vertical), gap between chips, inner row gaps |
| `space-3` | 12px | Card inner padding (compact), input bottom margin |
| `space-4` | 16px | Standard horizontal screen padding, modal header padding |
| `space-5` | 20px | Card inner padding (standard), section spacing |
| `space-6` | 24px | Between major sections on a screen |
| `space-8` | 32px | Bottom scroll padding, between DailyProgress and food entry |
| `space-12` | 48px | Modal bottom padding |
| `space-16` | 64px | Empty state vertical padding |
| `space-24` | 96px | Bottom content padding to clear FAB + tab bar |

### Spacing Rules

- Horizontal screen padding is always `space-4` (16px) on both sides
- Gap between cards in a list is `space-2` (8px)
- Gap between macro chips in a row is `space-2` (8px)
- Gap between primary and secondary button in a row is `space-3` (12px)
- Section label (`DAILY NUTRITION TARGETS`) has `marginBottom: space-2` (8px) above its card

---

## 9. Border Radius System

**Exactly three values.**

| Token | Value | Usage |
|-------|-------|-------|
| `radius-sm` | 10px | Chips, tags, input outlines, meal chips, raw/cooked toggle, nutrient chips |
| `radius-md` | 16px | Cards (log cards, DailyProgress, FoodItemCard, AnalysisResultCard, settings card), modal containers |
| `radius-lg` | 24px | Buttons (all — Analyze, Save, Save Settings), FAB, modal bottom-sheet grab handle area |

### Radius Rules

- All `TextInput` outlines use `radius-sm` (10px)
- All floating cards use `radius-md` (16px)
- All interactive action elements (buttons, FAB) use `radius-lg` (24px)
- Day pills use `radius-sm` (10px) — currently 20px, which makes them look like lozenges rather than chips
- The `theme.roundness: 14` in PaperProvider is updated to `16` to align with `radius-md`

### What Gets Removed

- 8px (chip radius in FoodItemCard → becomes 10px)
- 12px (input outlines in most inputs → becomes 10px)  
- 14px (theme roundness, log card → becomes 16px)
- 20px (day pills → becomes 10px)
- 28px (FAB → becomes 24px)

---

## 10. Elevation System

Five elevation levels, defined by visual treatment. The addition of Level −1 (Atmospheric) is the key change from the original spec — it is the layer that makes glass surfaces read as physically elevated rather than just visually distinct.

| Level | Name | Treatment | Elements |
|-------|------|-----------|----------|
| −1 | Atmospheric | `position: absolute` elliptical View, low-opacity macro colour, `zIndex: -1` relative to glass | Behind every glass surface |
| 0 | Base | No visual treatment, `bg-base` background | Screen backgrounds, modal content areas |
| 1 | Raised | `bg-surface` (#1C1C1E), `borderColor: rgba(255,255,255,0.08)` | Cards, log entries, FoodItemCard, settings card |
| 2 | Floating | Glass blur + `rgba(28,28,30,0.72)` + top highlight + bottom shadow edge | DailyProgress, Analysis Result, day picker, modal headers |
| 3 | Island | Glass blur + `rgba(28,28,30,0.72)` + top highlight + bottom shadow edge + detached from screen edges | Tab bar island |
| 4 | Overlay | Full-screen modal with `bg-base` content area | Modals (Log Food, Edit Entry) |

### Elevation Rules

- Every Level 2 or Level 3 element **must** have a corresponding Level −1 atmospheric layer. A glass surface without its atmospheric layer is incomplete.
- Level −1 atmospheric layers are absolutely positioned siblings of their glass surface, rendered before it in JSX so they appear behind it in z-order.
- Never stack two Raised (Level 1) surfaces inside each other without a Base gap.
- Floating (Level 2) and Island (Level 3) elements always have `overflow: 'hidden'` for blur clipping.
- FAB is the only element with a drop shadow: `shadowColor: '#0A84FF', elevation: 8` — it must appear to physically float above Level 3.
- The tab bar island (Level 3) sits above everything including the FAB atmospheric layer, but below the FAB itself.

### Depth Perception Rules

The three-plane depth model (base → content → glass) must be perceptible within 300ms of opening any screen:
- Base (`#0C0C0E`) is the darkest plane — never place any element on it without a Level 1 or higher surface beneath it
- Content (Level 1) reads as slightly lifted purely through colour contrast with Base
- Glass (Level 2/3) reads as highest through blur, top highlight, and atmospheric lighting beneath it



## 11. Motion System

### Spring Behavior (RNGH + Reanimated)

For any element that moves in response to user interaction:

```
Spring config (default):
  damping: 18
  stiffness: 200
  mass: 0.8
```

This produces a snappy, slightly springy response that feels native without being bouncy.

### Progress Ring Animation

```
Type: Animated.timing
Duration: 500ms (reduced from 600ms — feels faster)
Easing: Easing.out(Easing.cubic)
Property: strokeDashoffset
```

The ring animates every time the daily total updates (after save). This is the most visible animation in the app and should feel satisfying — a visual reward for logging food.

### Page Transitions

Expo Router Stack transitions remain at default. Do not add custom page transitions — the system slide-in animation is correct and expected by users.

Tab swipe (SwipeableTabScreen) has no animated transition currently — the router.push is instant. This is acceptable for MVP. If a crossfade is added later, it should be 200ms with `Easing.inOut(Easing.ease)`.

### Button Press

Primary buttons: scale to 0.97 on press, return on release.
```
Transform: scale(0.97)
Duration: 80ms press, 120ms release
```

This is achieved with `Pressable` + `Animated.spring` or RNGH `Gesture.Tap()`. Current RNP Button does not support this — noted as a medium-effort improvement.

### Opacity Transitions

Loading states: fade between `opacity: 0` and `opacity: 1` over 150ms.
Analysis result appearing: fade in over 200ms (not instant). Currently the result card appears without animation.

### What Not to Animate

- Settings form fields (no animation on focus)
- Day pill selection (instant color change — the tap feedback is sufficient)
- Log card list (no stagger animation — adds latency to the perceived data load)
- Modal dismiss (system animation is correct; do not intercept)

---

## 11b. Motion Continuity Principles

Motion continuity is the principle that UI elements do not appear and disappear — they **transform** between states. The user's eye tracks a single object through its lifecycle. When the Analyze button triggers an analysis, the result should feel like it emerged *from* the button, not like a separate thing that arrived from nowhere.

This is the most important motion principle in JC because the core interaction — type → analyze → review → save — is a linear state machine. Each transition is an opportunity to reinforce the causal relationship between the action and its outcome.

### The Core Interaction Chain

```
User taps Analyze
      │
      ▼ Button compresses (scale 0.97) and holds loading state
      │
      ▼ Spinner appears inside button — button does not resize
      │
      ▼ Result ready: button returns to rest scale
      │
      ▼ Analysis card rises into view from below the button area
        (translateY: +16px → 0, opacity: 0 → 1, 220ms)
        The card appears to emerge from the space the button occupies
      │
      ▼ User reviews, optionally edits macros inline
      │
      ▼ User taps Save Entry
        Button compresses → brief spinner → transitions to confirmation state
      │
      ▼ Save button label morphs: "Save Entry" → "✓ Saved"
        (opacity crossfade 150ms — not a slide or pop)
        Button background transitions: #0A84FF → rgba(48,209,88,0.20)
        Border appears: 1.5px #30D158
        This is the same button, transformed — not a new element
      │
      ▼ After 1200ms: button resets to default state (opacity fade)
      │
      ▼ Progress rings animate to new totals
        Each ring animates independently with a 60ms stagger
        (Calories first, then Protein, Carbs, Fat)
        The stagger makes the update feel considered, not mechanical
```

### Continuity Rules

**1. Origin continuity** — When a new element appears, it should emerge from the element that caused it.
- The Analysis Result card rises from below the button row, not from the top of the screen or from nowhere.
- Modal sheets rise from the FAB or the tapped entry card — the `animationType="slide"` bottom sheet origin already follows this rule.
- The tab bar island entrance (app launch) rises from below the screen floor — the same direction as the tapped tab.

**2. State continuity** — Elements that change state should transform, not replace.
- The Save button does not disappear and reappear. It crossfades its label and transitions its colour in place.
- The Analyze button does not swap for a spinner component. The spinner appears inside the existing button.
- The DailyProgress rings do not reset to zero and re-animate on every focus. They animate from their previous value to their new value.

**3. Completion continuity** — The end of one action should visually connect to the beginning of the next available action.
- After Save: the button confirmation state (`✓ Saved`, green tint) fades, the form resets, and the DailyProgress rings animate. The sequence of these three events communicates: *the save happened, and it counted.*
- After Analyze: the Analysis Result card rising into place is the visual completion of the Analyze tap. The user should not have to search for the result — the motion brings it to their attention.

**4. Ring continuity** — The DailyProgress rings are the persistent visual record of the day. Every save should animate them visibly.
```
Ring animation on save:
  Each ring: animates from current strokeDashoffset to new strokeDashoffset
  Duration: 500ms per ring
  Stagger: 60ms between Calories → Protein → Carbs → Fat
  Easing: Easing.out(Easing.cubic)
  The ring that changed the most moves the most visibly — proportional motion
```

**5. Absence of jarring cuts** — No element should snap from one state to another with no transition. The minimum transition for any state change is a 120ms opacity fade. Instant state changes (no animation at all) are only permitted for:
- Error states that require immediate user attention
- Validation failures (the field border turns red — this should be instant to feel like a direct response)

### Connected Motion Timing Table

| Transition | Duration | Easing | Type |
|-----------|----------|--------|------|
| Analyze button press (compress) | 80ms | linear | scale 1.0 → 0.97 |
| Analyze button release | 120ms | spring (damping 18) | scale 0.97 → 1.0 |
| Analysis Result card appear | 220ms | Easing.out(cubic) | opacity 0→1 + translateY 16→0 |
| Save button: label morph | 150ms | Easing.inOut(ease) | opacity crossfade |
| Save button: colour transition | 300ms | Easing.out(cubic) | backgroundColor + borderColor |
| Save button: reset to default | 200ms | Easing.inOut(ease) | opacity fade, 1200ms after confirm |
| Ring update (per ring) | 500ms | Easing.out(cubic) | strokeDashoffset |
| Ring stagger (between rings) | 60ms | — | delay offset |
| Tab icon press (compress) | 0ms | — | scale 1.0 → 0.92 (immediate) |
| Tab icon release | 180ms | spring (damping 20, stiff 300) | scale 0.92 → 1.06 → 1.0 |
| Island entrance (app launch) | 400ms | Easing.out(back(1.2)) | translateY 40→0 + opacity 0→1 |
| Island entrance delay | 200ms | — | after content loads |
| Modal appear (system) | system default | — | do not intercept |

### What Continuity Is Not

Continuity is not complexity. The transitions above are all simple — opacity, scale, translateY, colour. No physics simulations, no path animations, no particle effects. The goal is that the user never consciously thinks about the animation. They just feel that the interface responds to them.

If a motion transition becomes noticeable *as a transition* — if the user thinks "oh that's a nice animation" — it is probably 50–100ms too long or has too much travel distance. Shorten it.

### Anti-Patterns to Avoid

- **Slide-in from off-screen** for content that appears inline (Analysis Result should rise from the button area, not slide in from the right)
- **Staggered list animations** on the food item cards inside Analysis Result — the cards appear simultaneously with the glass panel, not one by one
- **Bounce overshoot on content** — spring overshoot only on the tab bar island entrance (UI furniture) and icon press (physical feedback). Content transitions use cubic easing, not springs.
- **Looping animations** — nothing loops except the ActivityIndicator spinner. Looping draws attention indefinitely and creates visual noise in a tool used multiple times daily.

---

## 12. Component Standards


### Buttons

**Primary (Contained)**
```
backgroundColor: #0A84FF
textColor: #FFFFFF
fontSize: 15px / weight: 600
paddingVertical: 6 (via contentStyle)
borderRadius: 24 (radius-lg)
height: ~48px (via paddingVertical + lineHeight)
disabled: opacity 0.4, not grayed out
loading: ActivityIndicator replaces text, button stays full width
```

**Secondary (Outlined)**
```
backgroundColor: rgba(10,132,255,0.08)
borderColor: #0A84FF
borderWidth: 1.5
textColor: #0A84FF
fontSize: 15px / weight: 600
borderRadius: 24 (radius-lg)
Same height as primary
```

**Destructive (Text)**
```
backgroundColor: transparent
textColor: #FF453A
fontSize: 15px / weight: 600
No border
paddingVertical: 16 (large touch target)
Use RNP Button mode="text" textColor="#FF453A"
Do NOT use TouchableOpacity with plain Text — replace in entries.tsx
```

**Rule:** Never use three button types on the same screen simultaneously. Home has primary + secondary. Modal has primary only (contained). Delete is always text-only.

### Inputs

```
mode: "outlined"
backgroundColor: #1C1C1E
borderRadius: 10 (radius-sm, via outlineStyle)
borderColor: rgba(84,84,88,0.65)
activeBorderColor: #0A84FF
fontSize: 15px
textColor: #FFFFFF
placeholderTextColor: #636366
paddingLeft: 12
height: standard (single-line), auto (multiline)
```

Settings inputs are special — narrower (90px wide) with `textAlign: 'right'` and `backgroundColor: #2C2C2E`.

### Cards

```
backgroundColor: #1C1C1E
borderRadius: 16 (radius-md)
borderWidth: 1
borderColor: rgba(255,255,255,0.08)
padding: 16 (space-4)
overflow: hidden
elevation: 0 (no shadow)
```

### Progress Rings

See Section 13 for full DailyProgress specification.

```
Ring:
  radius: 30 (increased from 26 — more visual weight)
  strokeWidth: 5
  background stroke: color + '20' (8% opacity)
  progress stroke: color (full)
  strokeLinecap: round
  rotation: -90° (start at top)

Value text:
  fontSize: 18px / weight: 700
  color: macro color
  position: absolute, centered below ring (NOT overlaid)

Label text:
  fontSize: 11px / weight: 500
  color: #98989D
  marginTop: 4
```

### Chips (Macro Display)

Used in FoodItemCard and log entry cards.

```
backgroundColor: color + '15' (8% opacity)
borderRadius: 10 (radius-sm)
paddingHorizontal: 10
paddingVertical: 5
flexDirection: row
gap: 3
value: 14px / 700 / macro color
label: 11px / 600 / macro color + opacity 0.8
```

### Meal Chips (Breakfast, Lunch, etc.)

```
inactive:
  backgroundColor: #1C1C1E
  borderWidth: 1
  borderColor: rgba(84,84,88,0.65)
  textColor: #98989D
  borderRadius: 10 (radius-sm — changed from 16)

active:
  backgroundColor: #0A84FF15
  borderColor: #0A84FF
  textColor: #0A84FF
  fontWeight: 600
```

### OilSlider

No structural changes. Typography fixes only:
- Header label: `body-emphasis` (15px/600)
- Value display: 15px/700 in `#0A84FF`
- Tick labels: `caption-small` (11px/500), inactive `#636366`, active `#0A84FF`/600

### Modals

All modals use the three-part header pattern:

```
Header (glass, intensity=28):
  paddingHorizontal: 16
  paddingTop: Platform.OS === 'ios' ? safeAreaInsets.top + 8 : 16
  paddingBottom: 12
  flexDirection: row
  justifyContent: space-between
  [Cancel text]  [Title 17px/600]  [Action text or empty View]

Content (bg-base):
  padding: 16
  paddingBottom: 48
```

Log Food modal header: `Cancel` (left) | `Log Food` (center) | empty `<View style={{width: 60}} />` (right, for centering)
Edit Entry modal header: `Cancel` (left) | `Edit Entry` (center) | `Save` (right, `#0A84FF`)

### FAB

```
backgroundColor: #0A84FF
borderRadius: 24 (radius-lg — changed from 28)
size: 56px × 56px
icon: "plus" (Ionicons)
position: absolute, right: 16, bottom: 16 + tabBarHeight
shadow:
  shadowColor: #0A84FF
  shadowOffset: {width: 0, height: 4}
  shadowOpacity: 0.35
  shadowRadius: 12
  elevation: 8
```

The FAB bottom position must account for the tab bar height so the last log card is not hidden. Add `bottom: 16 + tabBarHeight` where `tabBarHeight` is sourced from `useSafeAreaInsets().bottom + 64` (Android) or `88` (iOS).

### Settings Rows

```
flexDirection: row
justifyContent: space-between
alignItems: center
paddingHorizontal: 16 (space-4)
paddingVertical: 14 (space-3 + 2)
backgroundColor: transparent (inside card)
```

Dividers between rows: `height: 1`, `backgroundColor: rgba(84,84,88,0.65)`, `marginLeft: 16` (inset — intentional iOS Settings pattern).

### Entry Cards (Log Cards)

```
backgroundColor: #1C1C1E
borderRadius: 16 (radius-md — changed from 14)
borderWidth: 1
borderColor: rgba(255,255,255,0.08)
padding: 14
marginBottom: 8
```

See Section 17 for full entry card specification.

---

## 13. Daily Progress Redesign

### Why This Is the Signature Element

The DailyProgress card is opened every time the app is launched. It answers the user's first question: *"Where am I today?"* It is the only animated element on the home screen and the only element that uses color for all four macro dimensions simultaneously. If this component is weak, the entire app feels weak.

The redesign makes the values **larger and more dominant**, the rings **slightly bigger**, and introduces a **remaining budget** sub-label so users don't have to mentally subtract.

### Layout Strategy

Current layout: "Today" title, then four equal rings side by side.

Redesigned layout: "Today" title with today's date (secondary), then four rings where the Calories ring carries slightly more visual weight via a larger radius. Below each ring: current value (large, colored), label (small, gray), and remaining budget (tiny, gray).

### Visual Hierarchy

1. **Current value** (18px/700, macro color) — dominant
2. **Ring progress** (colored arc) — immediate context
3. **Label** (11px/500, gray) — identification
4. **Remaining** (11px/400, gray) — useful detail, not primary

### Ring Strategy

```
Calories ring: radius 32, strokeWidth 5 (slightly larger — primary macro)
Protein ring:  radius 28, strokeWidth 4
Carbs ring:    radius 28, strokeWidth 4
Fat ring:      radius 28, strokeWidth 4
```

The size difference is subtle — not a size hierarchy, more a visual weight that makes Calories read as the primary value.

### Glass Treatment

DailyProgress is the **primary glass surface** in the app. It must be implemented with the full glass specification including atmospheric aurora.

```
Outer wrapper (relative position, for atmospheric layer):
  marginHorizontal: 16
  marginTop: 8

Atmospheric aurora (4 absolutely-positioned ellipses inside wrapper):
  All: position: 'absolute', borderRadius: 9999, pointerEvents: 'none'
  Ellipse 1 — calories/blue:
    width: '80%', height: 80, top: -20, left: '-5%'
    backgroundColor: rgba(10,132,255,0.025)
  Ellipse 2 — protein/green:
    width: '65%', height: 60, top: -10, right: '-5%'
    backgroundColor: rgba(48,209,88,0.02)
  Ellipse 3 — carbs/cyan:
    width: '60%', height: 55, bottom: -15, left: '-5%'
    backgroundColor: rgba(90,200,250,0.02)
  Ellipse 4 — fat/amber:
    width: '50%', height: 50, bottom: -20, right: 0
    backgroundColor: rgba(255,159,10,0.02)

BlurView (above atmospheric layer):
  tint: "dark"
  intensity: 28
  backgroundColor: rgba(28,28,30,0.72)
  borderRadius: 16
  borderWidth: 1
  borderColor: rgba(255,255,255,0.08)
  borderTopColor: rgba(255,255,255,0.16)  ← specular highlight
  borderTopWidth: 0.5
  borderBottomColor: rgba(0,0,0,0.30)     ← bottom shadow edge
  borderBottomWidth: 0.5
  overflow: hidden
  padding: 20
```

### Interaction Behavior

- Rings animate on mount and on any value change (after save)
- The animation plays from the previous value to the new value (not always from 0)
- Tapping the card does nothing — it is display-only
- When a macro hits 100% of target, the ring completes and the color brightens slightly (alpha 100% → no alpha on color, which is already the case since the track is `color+'20'` and the fill is `color`)
- When a macro exceeds 100%, the ring stays full and the value text gains a subtle warning tint: `color` is unchanged but a small "!" indicator appears next to the value

### ASCII Wireframe

```
         ·  ·  ·  ·  ·  · [atmospheric aurora bleeds above card]
    ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·  ·
  ·                                                   ·   ← glow ellipses (opacity 2–2.5%, subliminal)
┌─────────────────────────────────────────────────────┐  ← glass: blur + top highlight
│  [specular top edge: rgba(255,255,255,0.16)]        │
│  Today                         Mon, 16 Jun          │  ← 22px/700 + 13px/500 gray
│                                                     │
│  ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐            │
│  │  ◯   │  │  ◯   │  │  ◯   │  │  ◯   │            │  ← SVG rings (cal ring larger)
│  │ 1202 │  │  125 │  │  103 │  │   30 │            │  ← 18px/700, macro colors
│  │ Cal  │  │  Pro │  │  Crb │  │  Fat │            │  ← 11px/500, #98989D
│  │ 798↓ │  │  25↓ │  │ 147↓ │  │  35↓ │            │  ← 11px/400, #636366 "left"
│  └──────┘  └──────┘  └──────┘  └──────┘            │
│  [bottom shadow edge: rgba(0,0,0,0.30)]             │
└─────────────────────────────────────────────────────┘
  ·  ·  ·  ·  [aurora bleeds below card edge too]
```



## 14. Home Screen Redesign

### Information Hierarchy (top to bottom)

1. DailyProgress (glass card) — most important, anchored at top
2. FoodEntry input — the primary action
3. OilSlider — modifier for the action
4. Action buttons (Analyze / Save Entry) — triggers
5. Analysis result — output (appears after Analyze)
6. Empty state — appears only when no result

### Layout Hierarchy

```
SwipeableTabScreen
  KeyboardAvoidingView (behavior="height" on Android, "padding" on iOS)
    ScrollView
      DailyProgress (marginTop: 8, marginHorizontal: 16)
      [space-6: 24px]
      FoodEntry (paddingHorizontal: 16)
      OilSlider (paddingHorizontal: 16, paddingTop: 16)
      Button row (paddingHorizontal: 16, paddingTop: 20, gap: 12)
      [analyzing state]
      [analysis result]
      [empty state]
      [space-24: 96px bottom padding — clears tab bar]
```

### Component Placement

- DailyProgress: full width minus 32px (16px on each side), glass card
- FoodEntry: full width content, label above input
- OilSlider: full width, label + value on same row
- Buttons: 50/50 row, Analyze (contained) left, Save Entry (outlined) right
- AnalysisResultCard: full width, appears below buttons after analysis, no header animation

### Scroll Behavior

- `keyboardShouldPersistTaps="handled"` — correct, keep
- `keyboardDismissMode="interactive"` — correct on iOS. On Android this does not work; supplement with a `Pressable` overlay that dismisses keyboard when tapping non-input areas
- ScrollView scrolls to end after analysis result appears (existing `handleFocusInput` behavior — keep)

### Visual Emphasis

The Analyze button is the visual anchor below the fold. It is full-width when alone, 50% when paired with Save Entry. The contained blue fill draws the eye naturally.

### ASCII Wireframe

```
┌───────────────────────────────────┐
│ [Home tab header — glass, blur]   │
├───────────────────────────────────┤
│                                   │
│  ┌─────────────────────────────┐  │
│  │ Today          Mon, 16 Jun  │  │  ← glass card
│  │  ◯    ◯    ◯    ◯           │  │
│  │ 1202  125  103   30         │  │
│  │ Cal   Pro  Crb  Fat         │  │
│  │ 798   25   147   35 left    │  │
│  └─────────────────────────────┘  │
│                                   │
│  What did you eat?                │  ← 15px/600
│  ┌─────────────────────────────┐  │
│  │ 2 eggs and toast...         │  │  ← multiline input
│  │                             │  │
│  │                             │  │
│  └─────────────────────────────┘  │
│  Describe what you ate...         │  ← 12px hint
│                                   │
│  Oil Level              100%      │  ← slider
│  ━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━  │
│  No oil Light Normal Oily V.oily  │
│                                   │
│  ┌──────────────┐ ┌─────────────┐ │
│  │   Analyze    │ │  Save Entry │ │  ← 50/50 row
│  └──────────────┘ └─────────────┘ │
│                                   │
│  [Analysis result card here]      │
│  [Food item cards here]           │
│                                   │
└───────────────────────────────────┘
│  [Tab bar — glass, floating]      │
```

---

## 15. Analysis Result Redesign

### Structure

The Analysis Result is inline content in the scroll view — not a modal. It appears immediately below the action buttons after tapping Analyze. It is the **secondary glass surface** on the Home screen, materialising into view with an opacity transition.

### Layout

```
[outer wrapper: relative position, holds atmospheric layer + BlurView]
  [atmospheric layer: rgba(10,132,255,0.025) ellipse behind card]
  [BlurView glass card]
    [Section label: "Analysis Result" — 20px/700]
    [Macro row — 4 editable fields]
    [Divider: rgba(255,255,255,0.08)]
    [Section label: "Food Items" — 16px/600]
    [FoodItemCard list — Surface (Level 1), NOT glass]
```

### Visual Grouping

The entire Analysis Result section — both the macro row and the food item list — is wrapped in a single glass (BlurView) card. The macro edit row and the food item cards both sit inside the same glass surface, unified into one floating panel.

```
Glass card spec (per §6 — secondary glass surface):
  BlurView intensity: 24
  borderRadius: 16 (radius-md)
  borderWidth: 1, borderColor: rgba(255,255,255,0.08)
  borderTopColor: rgba(255,255,255,0.14), borderTopWidth: 0.5
  borderBottomColor: rgba(0,0,0,0.25), borderBottomWidth: 0.5
  overflow: hidden
  marginHorizontal: 16
  marginTop: 16
  padding: 16

Atmospheric layer behind card:
  position: absolute, width: '120%', height: '130%'
  left: '-10%', top: '-15%'
  borderRadius: 9999
  backgroundColor: rgba(10,132,255,0.025)

FoodItemCards inside the glass panel:
  backgroundColor: rgba(255,255,255,0.05)  ← translucent, not opaque
  borderRadius: 12
  borderWidth: 1, borderColor: rgba(255,255,255,0.06)
  (slightly lighter than glass surface — creates internal depth)
```

The FoodItemCards inside the glass panel use a translucent background rather than the opaque `#1C1C1E` — this preserves the glass visual language within the card and avoids the jarring opaque-on-glass break.

### Appearance Transition

```
Animated.timing:
  opacity: 0 → 1
  translateY: 12 → 0   ← rises into place from slightly below
  duration: 220ms
  easing: Easing.out(Easing.cubic)
  delay: 0ms (starts immediately after Gemini/local result is ready)
```

The card materialises — it does not snap into existence. The translateY of 12px is subtle; it prevents the card from appearing to drop from above while still giving motion a direction.

### Editing Interactions

- Tapping a macro value field focuses it and brings up numeric keyboard
- The `onFocusInput` callback scrolls the view to reveal the keyboard — keep this behavior
- After editing, the value updates live (existing `handleEditTotal` behavior — keep)
- No save button within the result card — Save Entry button is always visible above

### ASCII Wireframe

```
     ·   ·   ·  [rgba(10,132,255,0.025) atmospheric glow above card]
  ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·   ·
┌──────────────────────────────────────────────────────────┐  ← glass: intensity 24
│  [specular top edge: rgba(255,255,255,0.14)]             │
│  Analysis Result                          ← 20px/700     │
│                                                          │
│   Calories   Protein    Carbs    Fat      ← colored 12px │
│   ┌──────┐  ┌──────┐  ┌──────┐  ┌────┐                  │
│   │  88  │  │ 17.1 │  │  0   │  │ 1.7│  ← editable     │
│   └──────┘  └──────┘  └──────┘  └────┘                  │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─  ← divider      │
│  Food Items                               ← 16px/600     │
│  ┌────────────────────────────────────┐                  │
│  │ Chicken breast           [Cooked]  │  ← translucent   │
│  │ 1 piece · grilled · 55g           │    item card      │
│  │ [88 Cal] [17P] [0C] [2F]          │                  │
│  └────────────────────────────────────┘                  │
│  [bottom shadow edge: rgba(0,0,0,0.25)]                  │
└──────────────────────────────────────────────────────────┘
  ·   ·   ·  [glow bleeds below card edge]
```

---


## 16. Entries Screen Redesign

### Layout Strategy

```
SwipeableTabScreen
  View (flex: 1)
    [Day picker — glass, sticky-style at top]
    [Vertical scroll list — log cards]
    [FAB — positioned above tab bar]
    [Log Food Modal]
    [Edit Entry Modal]
```

### Date Navigation Treatment

The day picker currently shows Mon–Sun for the current week with no ability to navigate to previous weeks. The visual treatment is correct (pill chips) but the radius and inactive state need updating.

```
Day pill (inactive):
  backgroundColor: rgba(255,255,255,0.08)
  borderRadius: 10 (radius-sm)
  paddingHorizontal: 20
  paddingVertical: 8
  textColor: #98989D / 14px / 600

Day pill (active):
  backgroundColor: #0A84FF
  textColor: #FFFFFF

Day pill (today, inactive):
  backgroundColor: rgba(255,255,255,0.08)
  border: 1px #0A84FF (subtle indicator that this is today)
  textColor: #98989D

Container:
  BlurView intensity=28, tint="dark"
  paddingVertical: 10
  borderBottomWidth: 1, borderBottomColor: rgba(255,255,255,0.08)
```

### Entry Grouping

No grouping headers needed (no meal type DB column yet). Entries sorted DESC by createdAt. A date sub-header showing the selected date in `DD MMMM YYYY` format appears above the list when the selected date is not today.

### Visual Hierarchy

1. Day picker (glass, floating feel)
2. Log cards (surface level)
3. FAB (floating, shadow)

The macro values on log cards must include units: `462 kcal` not `462`. Protein/carbs/fat: `76g P` not `76`.

### ASCII Wireframe

```
┌───────────────────────────────────┐
│ [Entries header — glass]          │
├─────────────────────────────────  ┤
│ ┌─────────────────────────────┐   │  ← glass day picker
│ │ Mon  Tue  Wed  Thu  [Fri]   │   │
│ └─────────────────────────────┘   │
│                                   │
│  ┌───────────────────────────┐    │
│  │ 8:19 pm  462kcal 76gP 8gC│    │  ← log card
│  │ 1 eggs, 4 piece boiled... │    │
│  └───────────────────────────┘    │
│                                   │
│  ┌───────────────────────────┐    │
│  │ 3:43 pm  619kcal 43gP 81g│    │
│  │ 1.5 cups rice, 0.5 daal.. │    │
│  └───────────────────────────┘    │
│                                   │
│                        [  +  ]    │  ← FAB, above tab bar
└───────────────────────────────────┘
│  [Tab bar — glass]                │
```

---

## 17. Entry Card Redesign

### Current Problem (visible in screenshots)

Log card shows: `462  76  8  12` — four colored numbers with no unit labels. A new user cannot tell if 462 is calories or if it's something else.

### Layout

```
┌──────────────────────────────────────────────┐
│ 8:19 pm                    462kcal 76g 8g 12g│  ← row 1
│                                              │
│ 1 eggs, 4 piece boiled chicken, 0.25 ricecake│  ← row 2
└──────────────────────────────────────────────┘
```

Row 1: timestamp (left, 13px/500, `#98989D`) | macro summary (right, colored numbers with unit suffixes)
Row 2: food text (15px/400, `#FFFFFF`)

### Macro Presentation

```
Calories: fontSize: 13, fontWeight: 700, color: #0A84FF, value + "kcal"
Protein:  fontSize: 13, fontWeight: 600, color: #30D158, value + "g"
Carbs:    fontSize: 13, fontWeight: 600, color: #5AC8FA, value + "g"
Fat:      fontSize: 13, fontWeight: 600, color: #FF9F0A, value + "g"

Row gap: 8px (space-2)
```

Format: `462kcal` `76g` `8g` `12g` — value directly concatenated with unit, no space, matching iOS Health display convention.

### Typography

```
Time: 13px / 500 / #98989D
Macro values: 13px / 700 (calories) or 600 (others) / macro colors
Food text: 15px / 400 / #FFFFFF (max 2 lines, ellipsis if longer)
```

### Density Strategy

Keep current density — 14px padding, 8px gap between cards. This shows 3–5 entries visible at once, which is the right amount for the day view.

### ASCII Wireframe

```
┌──────────────────────────────────────────────┐
│ 8:19 pm             462kcal  76g  8g  12g    │
│                                              │
│ 1 eggs, 4 piece boiled chicken, 0.25 ricecake│
└──────────────────────────────────────────────┘
```

---

## 18. Settings Screen Redesign

### Section Structure

Two sections, unchanged in content:
1. Daily Nutrition Targets
2. About

### Page Title

Remove the `<Text style={styles.pageTitle}>Settings</Text>` at 28px. The tab bar already says "Settings." The section title `DAILY NUTRITION TARGETS` at 13px uppercase takes over as the first text element on the page. This gains ~48px of vertical space.

### Row Structure

```
[Section label: "DAILY NUTRITION TARGETS"]
[Hint text: "Changes take effect immediately."]
┌────────────────────────────────────┐
│ Calories              [2400] kcal  │
├────────────────────────────────────┤
│ Protein               [150]  g     │
├────────────────────────────────────┤
│ Carbs                 [330]  g     │
├────────────────────────────────────┤
│ Fat                   [70]   g     │
└────────────────────────────────────┘
[Save Settings button]
```

Input field width: `minWidth: 90` — currently clips on small screens. Change to `minWidth: 80, maxWidth: 110` to allow wrapping.

### ASCII Wireframe

```
┌───────────────────────────────────┐
│ (no page title — tab says it)     │
│                                   │
│  DAILY NUTRITION TARGETS          │  ← 13px, uppercase, #98989D
│  Changes take effect immediately. │  ← 13px, #98989D
│                                   │
│  ┌─────────────────────────────┐  │
│  │ Calories       [2400]  kcal │  │
│  ├─────────────────────────────┤  │
│  │ Protein         [150]  g    │  │
│  ├─────────────────────────────┤  │
│  │ Carbs           [330]  g    │  │
│  ├─────────────────────────────┤  │
│  │ Fat              [70]  g    │  │
│  └─────────────────────────────┘  │
│                                   │
│  ┌──────────────────────────────┐ │
│  │       Save Settings          │ │  ← contained button
│  └──────────────────────────────┘ │
│                                   │
│  ABOUT                            │
│  ┌─────────────────────────────┐  │
│  │ App                     JC  │  │
│  ├─────────────────────────────┤  │
│  │ Data   Stored on this device│  │
│  ├─────────────────────────────┤  │
│  │ Analysis    AI + Local data │  │
│  └─────────────────────────────┘  │
└───────────────────────────────────┘
│  [Tab bar — glass]                │
```

---

## 19. Tab Bar Redesign

### Design — Floating Liquid Glass Island

The tab bar is redesigned as a **floating island** that lifts off the screen floor. It does not touch the left or right screen edges. It does not extend to the bottom of the screen. It sits above all content, above the safe area, hovering.

This is the Level 3 (Island) elevation element — the highest floating surface in the app, with the strongest blur intensity and the strongest atmospheric glow beneath it.

```
Container (absolutely positioned, not a standard tabBar):
  position: absolute
  bottom: 16 + insets.bottom    ← lifted above screen floor
  left: 24                      ← 24px from each edge
  right: 24
  height: 64

BlurView:
  tint: "dark"
  intensity: 36                 ← stronger than card glass — sits over varied content
  backgroundColor: rgba(28,28,30,0.80)
  borderRadius: 24 (radius-lg)  ← pill shape, not a rectangle
  borderWidth: 1
  borderColor: rgba(255,255,255,0.10)
  borderTopColor: rgba(255,255,255,0.22)  ← strong specular highlight
  borderTopWidth: 0.5
  borderBottomColor: rgba(0,0,0,0.50)     ← deep bottom shadow edge
  borderBottomWidth: 0.5
  overflow: hidden

Atmospheric layer (beneath island):
  position: absolute
  bottom: 8 + insets.bottom     ← 8px below island bottom
  left: 40, right: 40           ← narrower than island (centred falloff)
  height: 24
  borderRadius: 9999
  backgroundColor: rgba(10,132,255,0.02)
  (this appears as a faint glow the island casts onto the screen below it)
```

### Touch Target Compensation

The island is narrower than a full-width tab bar — 24px margins on each side. Touch targets must still be comfortable. Each of the three tab items occupies `(screenWidth - 48) / 3` px of width, with a minimum of 76px. On a standard 390px-wide device this gives ~114px per tab — well above the 44px iOS minimum.

The visible pill width (`screenWidth - 48`) is wide enough that thumb reach from either bottom corner comfortably hits the nearest tab item.

### Active State Behavior

```
Active tab item:
  icon: Ionicons filled variant
    Home:     "home"
    Entries:  "list-sharp"
    Settings: "settings"
  iconColor: #0A84FF
  labelColor: #0A84FF
  fontWeight: 600

  Background pill behind active icon:
    backgroundColor: rgba(10,132,255,0.15)
    borderRadius: 12
    paddingHorizontal: 16
    paddingVertical: 4
    (a soft blue capsule that sits behind the active icon + label)

Inactive tab item:
  icon: Ionicons outline variant
    Home:     "home-outline"
    Entries:  "list-outline"
    Settings: "settings-outline"
  iconColor: #636366
  labelColor: #636366
  fontWeight: 500
```

The active background pill is the key detail — it is the Liquid Glass active indicator. A soft blue capsule inside the glass island signals position without needing a dot or underline.

### Navigation Integration

Because Expo Router's `<Tabs>` renders the tab bar natively, the floating island requires one of two approaches:

**Approach A (recommended):** Set `tabBarStyle: { display: 'none' }` on all tab screens and render a custom tab bar component as a child of each `SwipeableTabScreen`. The custom component reads the current route and handles navigation via `router.push()`.

**Approach B:** Use `tabBarBackground` prop with a BlurView and position the tab bar with custom `tabBarStyle` negative margins and padding to simulate the floating look — more fragile on Android.

Approach A is preferred. The custom tab bar component receives the current pathname from `usePathname()` and renders the three tab items with the active/inactive states above.

### FAB Relationship

The FAB on the Entries screen sits above the island:
```
FAB position:
  bottom: 16 + 64 + 16 + insets.bottom
         ↑       ↑    ↑
       gap   island  gap-above-island
  right: 24 (aligned with island right edge)
```

The FAB's `#0A84FF` shadow blends with the island's atmospheric glow when the FAB is near the island — this is intentional, not a collision.

### Motion Behavior

**Tab switch — active indicator transition:**
```
The background pill (active indicator capsule) does NOT slide between tabs.
It fades: outgoing tab fades opacity 1→0 over 120ms, incoming fades 0→1 over 120ms.
Cross-fade total: 240ms.
Sliding pills require tracking absolute positions and are brittle across
different screen widths and island sizes.
```

**Icon scale on tap:**
```
Tap target pressed: scale 1.0 → 0.92 (immediate, 0ms)
Released: scale 0.92 → 1.06 → 1.0 (spring, damping: 20, stiffness: 300)
Total duration: ~180ms
```

This gives the island a physical, pressable quality — the icon compresses on press and springs back.

**Island entrance (app launch):**
```
translateY: 40 → 0
opacity: 0 → 1
duration: 400ms
easing: Easing.out(Easing.back(1.2))  ← slight overshoot for premium feel
delay: 200ms (after content has loaded)
```

The island slides up from below the screen and settles into place with a slight overshoot. This happens once per app launch, not on every tab switch.

### ASCII Wireframe

```
                                              ← screen content scrolls here
                                              ← content does NOT go edge-to-edge
                                                 below the island
   ·    ·    ·    ·    ·    ·    ·    ·      ← atmospheric glow (rgba(10,132,255,0.02))
   ·                                   ·        beneath island
  ╭─────────────────────────────────────╮   ← borderRadius: 24, glass island
  │  [specular top: rgba(255,255,255,0.22)]  │
  │                                     │
  │   ╭──────────╮                      │   ← active indicator capsule (blue, 15% opacity)
  │   │  ■ Home  │    ≡ Entries  ⚙ Set │   ← filled icon (active) | outline icons
  │   │  Home    │    Entries  Settings │   ← 11px/600
  │   ╰──────────╯                      │
  │  [bottom shadow: rgba(0,0,0,0.50)]  │
  ╰─────────────────────────────────────╯
  [24px]                           [24px]   ← island does not touch screen edges
            [16px + insets.bottom]          ← gap between island and screen floor
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━    ← physical screen edge
```

---



## 20. Screen-by-Screen Design Specification

### Home Screen

**Purpose:** Log food and review daily progress.

**Primary user goal:** Type what I ate → tap Analyze → see calories and macros → tap Save.

**Visual hierarchy:**
1. DailyProgress (glass card) — immediate status
2. FoodEntry (input) — primary action entry point
3. OilSlider — modifier
4. Analyze + Save buttons — triggers
5. Analysis result — outcome

**Key components:** DailyProgress, FoodEntry, OilSlider, AnalysisResultCard, FoodItemCard, EmptyState

**Interaction priorities:**
1. FoodEntry must be immediately tappable — no scrolling required to reach it
2. After Analyze, the view scrolls to show the result
3. After Save, a snackbar appears ("Entry saved") and the form resets

---

### Entries Screen

**Purpose:** Browse, edit, and delete food logs by day.

**Primary user goal:** Select a day → review what I logged → optionally edit or delete.

**Visual hierarchy:**
1. Day picker (glass, top) — temporal navigation
2. Log cards (list) — content
3. FAB (floating) — entry point for new logs

**Key components:** Day picker pills, log entry cards, FAB, Log Food Modal, Edit Entry Modal

**Interaction priorities:**
1. Tapping a log card opens the Edit modal
2. Long-pressing a log card shows delete confirmation
3. FAB opens Log Food modal
4. Day pill selection loads logs for that day instantly

---

### Settings Screen

**Purpose:** Edit daily nutrition targets.

**Primary user goal:** Change a target value → tap Save.

**Visual hierarchy:**
1. Section label ("DAILY NUTRITION TARGETS") — context
2. Input card — editable targets
3. Save button — action
4. About card — static info

**Key components:** InputRow, Save button, About rows

**Interaction priorities:**
1. Fields should pre-populate with current values on mount (existing behavior — keep)
2. Save confirmation should use RNP Snackbar instead of Alert.alert

---

### Log Food Modal

**Purpose:** Log a new food entry from the Entries tab.

**Primary user goal:** Describe food → pick meal type → set time → analyze → save.

**Visual hierarchy:**
1. Modal header (glass) — Cancel + title
2. Food text input — primary input
3. Meal chips — optional context
4. Time input — optional context
5. OilSlider — modifier
6. Analyze button — trigger
7. Analysis result box — output
8. Save Entry button — save trigger

**Interaction priorities:**
1. FoodEntry text input should be auto-focused when modal opens
2. Analyze button enabled only when food text is non-empty
3. Analysis result appears within the modal scroll area (existing behavior — keep)
4. Save dismisses modal and refreshes the entries list

---

### Edit Entry Modal

**Purpose:** Edit or delete a saved food log.

**Primary user goal:** Correct a food description or macro values, or delete the entry.

**Visual hierarchy:**
1. Modal header (glass) — Cancel + title + Save
2. Food text input + Re-analyze button
3. Date input + Time input
4. Divider
5. OilSlider
6. Macro grid (4 inputs)
7. Delete Entry (destructive, bottom)

**Interaction priorities:**
1. Macro inputs should show current values on open (existing behavior — keep)
2. Oil slider change auto-recalculates macros (existing behavior — keep)
3. Delete Entry button: replace TouchableOpacity + plain Text with RNP Button mode="text" textColor="#FF453A"
4. Save in header and Save button in form should have identical behavior

---

### Analysis Flow

The analysis flow spans two elements: the Analyze button → AnalysisResultCard.

**States:**
1. **Empty:** EmptyState component with icon + message
2. **Loading:** ActivityIndicator centered below buttons, "Analyzing..." text
3. **Result:** AnalysisResultCard slides in with 200ms fade

**Error state:** If Gemini fails and local fallback is used, show a small banner above the result: "Estimated locally · AI unavailable" in `#98989D` at 12px. This is currently silent.

---

## 21. Consistency Audit

### Colors — What to Standardize

| Issue | Current | Fix |
|-------|---------|-----|
| Three near-identical grays | `#98989D`, `#8E8E93`, `#636366` | Keep all three but assign semantic roles: `#98989D` = secondary text/labels, `#8E8E93` → retire, replace all uses with `#98989D`, `#636366` = placeholder/inactive only |
| `#F2F2F7` in MacroPill (unused) | Light color in dark theme | Remove — MacroPill is dead code |
| Button colors inconsistent | Some use `color-primary`, some use `textColor="#0A84FF"` prop | Standardize: outlined buttons always set `borderColor: '#0A84FF'` and use `textColor="#0A84FF"` prop |

### Typography — What to Standardize

| Issue | Current | Fix |
|-------|---------|-----|
| Page title on Settings (28px) | Duplicates tab bar | Remove |
| Modal title inconsistency | Log Food: `fontSize: 17`, Edit Entry: same — OK | Keep 17px for all modals |
| Analysis Result title | `fontSize: 20` | Keep — it's a section title, 20px/700 is correct |
| Body text 15px vs 16px | Mixed usage | Standardize to 15px for all body |

### Spacing — What to Standardize

| Issue | Current | Fix |
|-------|---------|-----|
| `gap: 10` between chips | Not on 4px grid | Change to `gap: 8` (space-2) |
| Modal padding inconsistency | `paddingTop: Platform.OS === 'ios' ? 16 : 16` | Remove the platform check — both are 16, this is dead code |
| FAB bottom position | `bottom: 16` always | `bottom: 16 + tabBarContentHeight` |

### Radius — What to Remove

Remove: 8px, 12px, 14px, 20px, 28px
Keep: 10px (radius-sm), 16px (radius-md), 24px (radius-lg)

| Element | Current | Fix |
|---------|---------|-----|
| `theme.roundness` | 14 | 16 |
| Log card `borderRadius` | 14 | 16 |
| Button `borderRadius` | 24 | 24 (already correct) |
| Day pill `borderRadius` | 20 | 10 |
| FAB `borderRadius` | 28 | 24 |
| Input `outlineStyle.borderRadius` | 12 | 10 |
| FoodItemCard chip | 8 | 10 |
| Meal chip | 16 | 10 |
| Raw/cooked toggle | 10 | 10 (already correct) |

### Elevation — What to Consolidate

| Issue | Current | Fix |
|-------|---------|-----|
| Log cards use BlurView | `BlurView intensity={40}` on each card | Replace with `View backgroundColor="#1C1C1E"` — cards are not floating |
| AnalysisResultCard has no surface | Floats on `bg-base` | Wrap macro edit row in `bg-surface` card |
| Modal content area varies | Some use `backgroundColor: '#0C0C0E'`, some `'#1C1C1E'` | All modal content areas: `bg-base` (`#0C0C0E`) |

### Motion — What to Add

| Addition | Where | Behavior |
|----------|-------|----------|
| Analysis result fade-in | AnalysisResultCard | `opacity: 0 → 1` over 200ms |
| Tab icon scale | Tab bar active state | `scale: 1.0 → 1.1 → 1.0` spring |

### Component Behavior — What to Fix

| Issue | Location | Fix |
|-------|----------|-----|
| `require()` inside FoodEntry | `FoodEntry.tsx` line 9 | Move to top-level import |
| `KeyboardAvoidingView behavior="padding"` on Android | `home/(tabs)/index.tsx` | Use `Platform.OS === 'android' ? 'height' : 'padding'` |
| `MacroPill` dead code | `DailyProgress.tsx` | Remove component and its styles |
| `IconButton` unused import | `entries.tsx` | Remove |
| Delete Entry as plain TouchableOpacity | `entries.tsx` line 387 | Use RNP Button |
| Save on Settings uses Alert | `settings.tsx` | Replace with RNP Snackbar |
| Log card BlurView on every card | `entries.tsx` | Replace with View |

---

## 22. Implementation Priorities

### Priority 1 — Maximum visual impact, low risk

These changes require no architecture changes and can be shipped as a single focused PR:

1. **Unify border radius** — 3 values only (10/16/24). Change in StyleSheet across all files. ~30 min.
2. **Add units to log card macros** — `462kcal`, `76g`. Single string format change in `entries.tsx`. ~10 min.
3. **Remove duplicate Settings page title** — Delete one `<Text>` element. ~5 min.
4. **Remove dead code** — MacroPill, IconButton import, getConfidenceLabel utility. ~10 min.
5. **Consolidate gray values** — Replace `#8E8E93` with `#98989D` everywhere. ~10 min.

Expected impact: App immediately looks more consistent and intentional.

### Priority 2 — High impact, moderate effort

These require component-level changes:

1. **DailyProgress redesign** — Larger ring values, remaining budget sub-label, stronger Calories ring, full glass treatment with four atmospheric aurora ellipses (all at ≤0.025 opacity). ~3 hours.
2. **Floating island tab bar** — Custom tab bar component (Approach A), active indicator capsule, atmospheric glow beneath, icon filled/outline variants, icon press spring animation, entrance animation. ~4 hours.
3. **Analysis Result promoted to glass** — Wrap in BlurView with intensity=24, atmospheric blue ellipse (0.025 opacity), translucent FoodItemCards inside, opacity+translateY entrance animation connected to button area. ~2 hours.
4. **Motion continuity — analyze → save flow** — Analyze button press/loading state continuity; Analysis Result card connected entrance (rises from button area); Save button confirmation morph (`✓ Saved`, green tint crossfade); ring stagger animation on save. Implement per the timing table in §11b. ~3 hours.
5. **Replace log card BlurView with View** — Performance fix. ~20 min.
6. **EmptyState with icon** — Add Ionicons icon above text. ~20 min.
7. **Modal header standardization** — Three-part header on both modals. ~30 min.
8. **Replace Delete Entry** — RNP Button mode="text" textColor="#FF453A". ~15 min.
9. **Fix KeyboardAvoidingView** — Platform-specific behavior. ~10 min.
10. **FoodEntry require() fix** — Top-level import. ~5 min.

Expected impact: The app feels like a premium product with physical presence. The three glass surfaces (DailyProgress, Analysis Result, Tab bar island) create a genuine depth hierarchy. The motion continuity across the analyze → save flow makes the app feel like a tool that responds to the user, not a form they fill in. The island tab bar is the most visually memorable change; motion continuity is the most experientially memorable.

### Priority 3 — Polish, deferred to next cycle

1. Settings save → Snackbar (replace Alert)
2. Local fallback banner in Analysis flow ("Estimated locally · AI unavailable")
3. Today date shown in DailyProgress header
4. Atmospheric layer opacity tuning per device (Android brightness compensation — reduce all glows by 30% on Android if blur renders at full intensity)
5. Island entrance animation refinement (test overshoot spring feel on physical devices — may need damping adjustment)
6. Ring animation from previous value (currently rings animate from 0 on every mount — upgrade to animate from previous stored value)


---

## 23. Success Criteria

A successful redesign is measurable against these criteria:

**Visual Consistency**
- [ ] Border radius values: exactly 3 (10, 16, 24)
- [ ] Gray text values: exactly 2 (`#98989D` for secondary, `#636366` for placeholder)
- [ ] No dead code components in production bundle

**Readability**
- [ ] Every macro value on every log card has a unit suffix (kcal or g)
- [ ] DailyProgress current values are the dominant typographic element (largest text in the card)
- [ ] "Settings" text appears exactly once on the Settings screen

**Visual Depth (new)**
- [ ] Three visual planes are perceptible within 300ms of opening any screen
- [ ] Every glass surface (DailyProgress, Analysis Result, Tab bar island, Day picker) has a corresponding atmospheric layer
- [ ] No atmospheric layer has opacity > 0.04 on any single ellipse (test: glow should not be identifiable without looking for it)
- [ ] Tab bar island does not touch left or right screen edges (24px margin each side)
- [ ] Tab bar island sits at least 16px above the screen floor (above safe area insets)
- [ ] DailyProgress has four aurora ellipses, one per macro colour
- [ ] Analysis Result card uses BlurView (intensity 24), not a plain Surface View
- [ ] Active tab indicator is a soft blue capsule inside the island, not a dot or underline

**Visual Quality**
- [ ] Log entry cards use `bg-surface` (not BlurView) — verified no jank on mid-range Android
- [ ] All glass surfaces have `borderTopColor: rgba(255,255,255,0.14+)` specular highlight
- [ ] All glass surfaces have `borderBottomColor: rgba(0,0,0,0.25+)` bottom shadow edge
- [ ] Analysis Result materialises with opacity+translateY transition (not instant)

**Motion Continuity (new)**
- [ ] Analyze button holds loading state (spinner inside button, button does not resize or disappear)
- [ ] Analysis Result card rises from below the button row, not from top of screen or snap-in
- [ ] Save button morphs to `✓ Saved` confirmation state in place (crossfade, not replacement)
- [ ] Save button returns to default state via opacity fade after 1200ms
- [ ] DailyProgress rings animate from previous value to new value after save (not from zero)
- [ ] Ring animation staggers: Calories → Protein → Carbs → Fat with 60ms between each
- [ ] No element snaps between states without at minimum a 120ms opacity transition
- [ ] Island entrance animation runs once on app launch (translateY + spring overshoot)


- [ ] Delete action uses a distinct visual treatment (red, text-mode button)
- [ ] Both modals use the same three-part header layout
- [ ] Primary and secondary buttons are visually distinct (contained vs outlined)
- [ ] Tab icon springs on press (scale compress + overshoot)

**Performance**
- [ ] Maximum 3 BlurView components visible simultaneously (DailyProgress + Analysis Result + Day picker OR island)
- [ ] No BlurView on log entry cards
- [ ] Atmospheric layers use `pointerEvents: 'none'` — they must not intercept touches

---

## 24. Final Vision

### What the Finished Product Feels Like

JC at its best is an app that has weight. Not heaviness — weight in the physical sense: the tab bar island sits at the bottom of the screen like something that was placed there, with its own shadow beneath it and its specular edge catching the light. The DailyProgress card floats above the scroll with a corona of coloured light bleeding out from each macro ring — subtle, barely there, but unmistakably present. When you log a meal and the Analysis Result card materialises from the dark with a 220ms rise, it feels like something computed, crystallised, and surfaced just for you.

The interaction takes 15 seconds. The spatial language communicates in half a second.

### First-Time User Emotional Experience

A first-time user opens JC. The island slides up from below the screen — a glass pill with a soft blue glow beneath it, hovering above the safe area. The DailyProgress card sits above the scroll with a faint aurora behind it, the four macro colours bleeding into the dark like light under ice. Before they read a word, they understand: there are things floating here, and things grounded, and the things that float are the things that matter.

They tap the food input. It focuses. They type what they ate for breakfast. The Analyze button — wide, blue, confident — sits below the oil slider waiting. They tap it. For two seconds, a spinner. Then the Analysis Result card rises into place from slightly below, a glass panel with a blue atmospheric glow behind it. Their meal, decomposed: 154 kcal, 14g protein, chicken breast, 55g, grilled. They tap Save. The DailyProgress rings animate — the blue calories ring fills a little more, the green protein ring ticks forward. The aurora shifts imperceptibly brighter.

This is what progress looks like. Not a notification. Not a badge. Just light, moving.

### How JC Differentiates from Generic Calorie Trackers

Most calorie trackers look like either a fitness magazine (aggressive reds, performance-first) or a diet app (greens, soft pastels, motivational copy). JC looks like neither.

The Liquid Dark Glass direction says: this interface was made for someone who cares about quality. The floating island tab bar, the atmospheric aurora on the progress card, the glass Analysis Result that materialises rather than snapping into existence — none of this is decoration. Every glass surface earns its blur by carrying content that actually floats. Every atmospheric layer earns its glow by reinforcing the depth of the surface above it.

The oil slider remains the single most distinctive feature of JC. No design decision in this revision diminishes it. The specificity of the app — the acknowledgment that mustard oil matters, that cooking method matters, that Indian food deserves its own estimation logic — is what makes JC a tool built for real users, not a template skinned for a nutrition market.

The redesign preserves all of this and adds one more layer: depth. The app now has three dimensions. You can feel it.

