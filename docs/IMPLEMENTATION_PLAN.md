# IMPLEMENTATION_PLAN.md — JC Food Tracker
### Redesign Implementation Specification v1.0

> Based on: DESIGN.md v1.0, WIREFRAMES.md v1.0
> Target: React Native / Expo SDK 51, Fastify backend, Supabase auth, Zustand state
> Device target: iOS 16+, Android API 29+
> This document contains no implementation code. It specifies what to change, where, why, and in what order.

---

## HOW TO USE THIS DOCUMENT

Each phase is **independently deployable**. Phases are ordered so that earlier phases never create visual regressions in later ones. Every change entry specifies:

- **Files to modify** — exact filenames relative to project root
- **Components affected** — named React Native components and their props/styles
- **Complexity** — S (< 30 min), M (30–90 min), L (1.5–3 hrs), XL (3+ hrs)
- **Dependencies** — other changes that must land first
- **Risks** — known failure modes and what to watch for

Never begin a phase until the previous phase passes its testing requirements. Each phase has a rollback strategy using Git.

---

## ASSUMPTIONS ABOUT PROJECT STRUCTURE

Based on the Expo Router architecture described in DESIGN.md, the assumed file tree is:

```
app/
  home/
    (tabs)/
      index.tsx          ← Home screen
      entries.tsx        ← Entries screen
      settings.tsx       ← Settings screen
  _layout.tsx            ← Root layout / tab navigator

components/
  DailyProgress.tsx      ← Progress rings card
  FoodEntry.tsx          ← Text input for food description
  OilSlider.tsx          ← Oil level slider
  AnalysisResultCard.tsx ← Post-analysis glass card
  FoodItemCard.tsx       ← Individual food item inside result
  EmptyState.tsx         ← Empty state component
  TabBar.tsx             ← (to be created in Phase 4)

constants/
  colors.ts              ← (to be created in Phase 1)
  spacing.ts             ← (to be created in Phase 1)
  radius.ts              ← (to be created in Phase 1)
  typography.ts          ← (to be created in Phase 1)

store/
  (Zustand stores)
```

If the actual project structure differs, map these paths accordingly before implementation begins. The component and constant names in this document are canonical — create them where they do not exist.

---

## MASTER CHANGE REGISTER

All changes across all phases listed for pre-flight review:

| ID | Change | Phase | Complexity | Risk |
|----|--------|-------|------------|------|
| T-01 | Create `constants/colors.ts` | 1 | S | Low |
| T-02 | Create `constants/spacing.ts` | 1 | S | Low |
| T-03 | Create `constants/radius.ts` | 1 | S | Low |
| T-04 | Create `constants/typography.ts` | 1 | S | Low |
| T-05 | Retire `#8E8E93` → replace with `#98989D` | 1 | S | Low |
| T-06 | Unify border radius to 10/16/24 everywhere | 1 | M | Medium |
| T-07 | Remove dead code: MacroPill, IconButton, getConfidenceLabel | 1 | S | Low |
| T-08 | Fix `require()` inside FoodEntry component body | 1 | S | Low |
| T-09 | Fix KeyboardAvoidingView platform behavior | 1 | S | Low |
| D-01 | DailyProgress: larger ring values (18px/700) | 2 | S | Low |
| D-02 | DailyProgress: remaining budget sub-label | 2 | S | Low |
| D-03 | DailyProgress: Calories ring larger (r=32 vs r=28) | 2 | S | Low |
| D-04 | DailyProgress: header row ("Today" + date) | 2 | S | Low |
| D-05 | DailyProgress: full glass treatment (BlurView) | 2 | M | Medium |
| D-06 | DailyProgress: four aurora atmospheric ellipses | 2 | M | Low |
| D-07 | DailyProgress: ring animates from previous value | 2 | M | Medium |
| A-01 | AnalysisResultCard: wrap in BlurView (secondary glass) | 3 | M | Medium |
| A-02 | AnalysisResultCard: blue atmospheric ellipse | 3 | S | Low |
| A-03 | AnalysisResultCard: FoodItemCards → translucent bg | 3 | S | Low |
| A-04 | AnalysisResultCard: opacity+translateY entrance | 3 | M | Low |
| A-05 | AnalysisResultCard: error banner for local fallback | 3 | S | Low |
| B-01 | Create custom TabBarIsland component | 4 | XL | High |
| B-02 | Hide native tab bar on all screens | 4 | S | Medium |
| B-03 | Tab bar: active indicator capsule | 4 | M | Low |
| B-04 | Tab bar: atmospheric glow beneath island | 4 | S | Low |
| B-05 | Tab bar: icon spring press animation | 4 | M | Low |
| B-06 | Tab bar: island entrance animation (app launch) | 4 | M | Medium |
| B-07 | Update content paddingBottom to 96px across all screens | 4 | S | Medium |
| E-01 | Entries: replace BlurView on log cards with View | 5 | S | Low |
| E-02 | Entries: add units to log card macro values | 5 | S | Low |
| E-03 | Entries: day picker glass treatment | 5 | M | Low |
| E-04 | Entries: day picker pill radius 20→10 | 5 | S | Low |
| E-05 | Entries: FAB bottom position formula | 5 | S | Medium |
| E-06 | Entries: paddingBottom = 160px (resolves WIREFRAMES C1) | 5 | S | Low |
| E-07 | Entries: EmptyState with Ionicons icon | 5 | S | Low |
| E-08 | Entries: LogFood modal header standardisation | 5 | M | Low |
| E-09 | Entries: EditEntry modal header standardisation | 5 | M | Low |
| E-10 | Entries: Delete Entry → RNP Button mode="text" | 5 | S | Low |
| E-11 | Entries: EditEntry Cancel confirmation dialog | 5 | M | Low |
| S-01 | Settings: remove duplicate page title (28px Text) | 6 | S | Low |
| S-02 | Settings: section label as first text element | 6 | S | Low |
| S-03 | Settings: input minWidth 80, maxWidth 110 | 6 | S | Low |
| S-04 | Settings: Save → RNP Snackbar (replace Alert) | 6 | S | Low |
| M-01 | Motion: Analyze button compress + spinner in-place | 7 | M | Low |
| M-02 | Motion: Save button label morph → "✓ Saved" | 7 | M | Low |
| M-03 | Motion: Save button colour transition (green tint) | 7 | S | Low |
| M-04 | Motion: Save button auto-reset after 1200ms | 7 | S | Low |
| M-05 | Motion: ring stagger animation on save (60ms) | 7 | M | Medium |
| M-06 | Motion: Save Entry → progressive disclosure (D3 fix) | 7 | M | Low |

---

---

# PHASE 1 — DESIGN TOKENS AND FOUNDATIONS

**Goal:** Establish a single source of truth for all visual constants. No visual change is visible to users after this phase — it is internal scaffolding only. Every subsequent phase imports from these constants; no hardcoded hex values or spacing numbers should exist after Phase 1 merges.

**Branch name convention:** `redesign/phase-1-tokens`

---

## T-01 — Create `constants/colors.ts`

**Files to modify:**
- `constants/colors.ts` — CREATE (does not exist)

**Components affected:**
- None directly (no imports yet — added in subsequent phases)

**Complexity:** S

**Dependencies:** None

**What to define:**

Create and export the following named constants. These are the only color values permitted in the codebase after Phase 1. Any color found in a component's StyleSheet that is not in this file is a violation.

```
Background colors:
  BG_BASE       = '#0C0C0E'
  BG_SURFACE    = '#1C1C1E'
  BG_ELEVATED   = '#2C2C2E'
  BG_GLASS      = 'rgba(28,28,30,0.72)'

Macro colors:
  MACRO_CALORIES = '#0A84FF'
  MACRO_PROTEIN  = '#30D158'
  MACRO_CARBS    = '#5AC8FA'
  MACRO_FAT      = '#FF9F0A'

Semantic colors:
  COLOR_PRIMARY  = '#0A84FF'
  COLOR_ERROR    = '#FF453A'
  COLOR_SUCCESS  = '#30D158'    ← same as MACRO_PROTEIN — intentional
  COLOR_BORDER   = 'rgba(84,84,88,0.65)'
  COLOR_BORDER_SUBTLE = 'rgba(255,255,255,0.08)'

Text colors:
  TEXT_PRIMARY   = '#FFFFFF'
  TEXT_SECONDARY = '#98989D'
  TEXT_DISABLED  = '#636366'

Glass border colors:
  GLASS_TOP_HIGHLIGHT        = 'rgba(255,255,255,0.16)'
  GLASS_TOP_HIGHLIGHT_STRONG = 'rgba(255,255,255,0.22)'   ← island only
  GLASS_TOP_HIGHLIGHT_SOFT   = 'rgba(255,255,255,0.14)'   ← Analysis Result
  GLASS_BOTTOM_SHADOW        = 'rgba(0,0,0,0.30)'
  GLASS_BOTTOM_SHADOW_STRONG = 'rgba(0,0,0,0.50)'         ← island only
  GLASS_BOTTOM_SHADOW_SOFT   = 'rgba(0,0,0,0.25)'         ← Analysis Result
  GLASS_BORDER               = 'rgba(255,255,255,0.08)'
  GLASS_BORDER_ISLAND        = 'rgba(255,255,255,0.10)'

Atmospheric glow colors:
  GLOW_CALORIES   = 'rgba(10,132,255,0.025)'
  GLOW_PROTEIN    = 'rgba(48,209,88,0.02)'
  GLOW_CARBS      = 'rgba(90,200,250,0.02)'
  GLOW_FAT        = 'rgba(255,159,10,0.02)'
  GLOW_PRIMARY    = 'rgba(10,132,255,0.02)'    ← island underlight
  GLOW_NEUTRAL    = 'rgba(255,255,255,0.015)'  ← day picker
  GLOW_BLUE_CARD  = 'rgba(10,132,255,0.025)'   ← Analysis Result

Active state colors:
  ACTIVE_PILL_BG  = 'rgba(10,132,255,0.15)'    ← island active indicator
  OUTLINED_BTN_BG = 'rgba(10,132,255,0.08)'    ← outlined button fill
```

**Risks:** None. Constants file has no side effects.

---

## T-02 — Create `constants/spacing.ts`

**Files to modify:**
- `constants/spacing.ts` — CREATE

**Components affected:** None directly

**Complexity:** S

**Dependencies:** None

**What to define:**

```
SPACE_1  = 4     ← micro: label-to-value gaps, icon margins
SPACE_2  = 8     ← chip padding, gap between chips, inner row gaps
SPACE_3  = 12    ← card inner padding (compact), input bottom margin
SPACE_4  = 16    ← standard horizontal screen padding, modal header padding
SPACE_5  = 20    ← card inner padding (standard), section spacing
SPACE_6  = 24    ← between major sections on a screen
SPACE_8  = 32    ← between DailyProgress and food entry
SPACE_12 = 48    ← modal bottom padding
SPACE_16 = 64    ← empty state vertical padding
SPACE_24 = 96    ← bottom scroll padding (Home/Settings — clears island)
SPACE_ENTRIES_BOTTOM = 160  ← bottom scroll padding for Entries screen
                             ← (96 base + 64 FAB clearance — see WIREFRAMES C1)

SCREEN_PADDING_H = 16       ← horizontal screen padding, both sides
CARD_GAP         = 8        ← gap between cards in a list
CHIP_GAP         = 8        ← gap between macro chips in a row
BUTTON_GAP       = 12       ← gap between primary and secondary button
```

**Risks:** None.

---

## T-03 — Create `constants/radius.ts`

**Files to modify:**
- `constants/radius.ts` — CREATE

**Components affected:** None directly

**Complexity:** S

**Dependencies:** None

**What to define:**

```
RADIUS_SM = 10   ← chips, tags, input outlines, meal chips, raw/cooked toggle,
                    nutrient chips, FoodItemCard inner chips, day pills
RADIUS_MD = 16   ← cards (log cards, DailyProgress, FoodItemCard, AnalysisResultCard,
                    settings card), modal containers
RADIUS_LG = 24   ← buttons (all), FAB, tab bar island, modal bottom grab area
```

These three constants replace every unique borderRadius value in the codebase. The following values are REMOVED:
- 8px → replaced by RADIUS_SM (10)
- 12px → replaced by RADIUS_SM (10)
- 14px → replaced by RADIUS_MD (16)
- 20px → replaced by RADIUS_SM (10)
- 28px → replaced by RADIUS_LG (24)

Also update `theme.roundness` in PaperProvider from 14 to 16 (RADIUS_MD).

**Risks:** Borderline visual change — element corners will shift. Most changes are 1–4px. No functional impact.

---

## T-04 — Create `constants/typography.ts`

**Files to modify:**
- `constants/typography.ts` — CREATE

**Components affected:** None directly

**Complexity:** S

**Dependencies:** T-01

**What to define:**

Each entry is an object `{ fontSize, fontWeight, lineHeight, color? }`. Components import and spread these into their Text styles.

```
DISPLAY        = { fontSize: 34, fontWeight: '800', lineHeight: 40 }
TITLE_LARGE    = { fontSize: 22, fontWeight: '700', lineHeight: 28 }
TITLE          = { fontSize: 20, fontWeight: '700', lineHeight: 26 }
HEADING        = { fontSize: 17, fontWeight: '600', lineHeight: 22 }
BODY           = { fontSize: 15, fontWeight: '400', lineHeight: 20 }
BODY_EMPHASIS  = { fontSize: 15, fontWeight: '600', lineHeight: 20 }
CAPTION        = { fontSize: 13, fontWeight: '500', lineHeight: 18 }
CAPTION_SMALL  = { fontSize: 11, fontWeight: '600', lineHeight: 14 }
RING_VALUE     = { fontSize: 18, fontWeight: '700', lineHeight: 22 }
RING_LABEL     = { fontSize: 11, fontWeight: '500', lineHeight: 14 }
MACRO_LARGE    = { fontSize: 24, fontWeight: '700', lineHeight: 28 }
MACRO_CHIP_VAL = { fontSize: 14, fontWeight: '700' }
MACRO_CHIP_LBL = { fontSize: 11, fontWeight: '600' }
```

**Rule to enforce:** Button text is always BODY_EMPHASIS (15px/600). Modal titles are always HEADING (17px/600). Values are always larger than their labels.

**Risks:** None.

---

## T-05 — Retire `#8E8E93` everywhere

**Files to modify:**
- All `.tsx` / `.ts` files containing the hex string `#8E8E93`
- Run a project-wide text search: `grep -r "8E8E93" --include="*.tsx" --include="*.ts" .`

**Components affected:** Any component currently using `#8E8E93`

**Complexity:** S

**Dependencies:** T-01

**What to do:**

Replace every occurrence of `'#8E8E93'` (or `"#8E8E93"`) with the import `TEXT_SECONDARY` from `constants/colors.ts` (`#98989D`).

Do not replace with a hardcoded string — import the constant. This is the only change in this task.

**Risks:** Imperceptible visual shift (3-digit hex difference). No functional risk.

---

## T-06 — Unify border radius to 10/16/24

**Files to modify:**
- All `.tsx` / `.ts` files containing hardcoded borderRadius values other than 10, 16, or 24
- Run: `grep -rn "borderRadius" --include="*.tsx" --include="*.ts" .`
- Also update `theme.roundness` in the root `_layout.tsx` or wherever PaperProvider is initialised

**Components affected:**
- Every component with a StyleSheet containing borderRadius
- Specifically: log entry cards (14→16), day pills (20→10), FAB (28→24), input outlines (12→10), FoodItemCard chips (8→10), meal chips (16→10)

**Complexity:** M

**Dependencies:** T-03

**Substitution table:**

| Current value | Replace with | Constant | Element |
|---------------|--------------|----------|---------|
| 8 | 10 | RADIUS_SM | FoodItemCard inner chips |
| 12 | 10 | RADIUS_SM | TextInput outlines, most inputs |
| 14 | 16 | RADIUS_MD | Log entry cards, theme.roundness |
| 20 | 10 | RADIUS_SM | Day picker pills |
| 28 | 24 | RADIUS_LG | FAB |

All remaining 10, 16, 24 values stay. Do not change values that are already correct.

**Risks:** Medium. Visual change on every card and input. Test each screen after this change to confirm no element looks distorted. Day pills changing from 20→10 will look noticeably squarer — this is expected per DESIGN.md §9. (WIREFRAMES.md D6 challenges this decision but DESIGN.md is authoritative unless overridden.)

---

## T-07 — Remove dead code

**Files to modify:**
- `components/DailyProgress.tsx` — remove `MacroPill` component and all its styles
- `app/home/(tabs)/entries.tsx` — remove unused `IconButton` import
- Any utility file containing `getConfidenceLabel` — remove function and any callers

**Components affected:**
- `DailyProgress` — MacroPill removal
- `entries.tsx` — import cleanup

**Complexity:** S

**Dependencies:** None

**What to do:**

1. Search for `MacroPill` across the project. Remove the component definition, its StyleSheet, and every JSX usage. Confirm no other file imports it.
2. Search for `IconButton` in `entries.tsx`. Remove the import line if the component is not used in that file.
3. Search for `getConfidenceLabel`. Remove the function definition and any call sites.

**Risks:** Low. Removing unused code has no visual impact. Verify the build succeeds after removal.

---

## T-08 — Fix `require()` inside FoodEntry component body

**Files to modify:**
- `components/FoodEntry.tsx` (or wherever the food text input component lives)

**Components affected:** `FoodEntry`

**Complexity:** S

**Dependencies:** None

**What to do:**

Move any `require()` call (typically for a TextInput or image import) from inside the component function body to the top of the file as a module-level import. This prevents re-importing on every render.

Pattern:
```
BEFORE: inside component function:  const X = require('...')
AFTER:  top of file:                import X from '...'
        OR:                         const X = require('...')  ← at module scope, not in fn
```

**Risks:** None. Pure anti-pattern fix with no visual or functional change.

---

## T-09 — Fix KeyboardAvoidingView platform behavior

**Files to modify:**
- `app/home/(tabs)/index.tsx` — Home screen
- `app/home/(tabs)/entries.tsx` — if it contains a KeyboardAvoidingView
- Any modal component using KeyboardAvoidingView

**Components affected:** `KeyboardAvoidingView` wrappers

**Complexity:** S

**Dependencies:** None

**What to do:**

For every `KeyboardAvoidingView` in the project, set its `behavior` prop as follows:
```
behavior={Platform.OS === 'android' ? 'height' : 'padding'}
```

Remove any `keyboardVerticalOffset={0}` props — they are no-ops at 0.

**Risks:** Low. Android keyboard behavior will change — test on a physical Android device with a soft keyboard to confirm the layout adjusts correctly and inputs remain visible when the keyboard opens.

---

## Phase 1 — Expected Visual Outcome

After Phase 1, the app should look **nearly identical** to before. The only visible changes are:

- Some element corners are very slightly different (radius unification, ≤4px shift)
- `#8E8E93` text replaced with `#98989D` (imperceptible)
- Dead code removed (nothing visual)

No new components, no new glass surfaces, no motion changes.

---

## Phase 1 — Testing Requirements

1. **Build succeeds** with no TypeScript errors after all constants files are created and imports updated
2. **No hardcoded hex values** remain in component files — run `grep -r "#[0-9A-Fa-f]\{6\}" --include="*.tsx" .` and verify all hits are either in `constants/` files or are intentionally not tokenized (e.g., third-party library overrides)
3. **No hardcoded borderRadius values** outside of `10`, `16`, `24` remain in component files
4. **Home screen** renders correctly on iOS simulator
5. **Entries screen** renders correctly on iOS simulator
6. **Settings screen** renders correctly on iOS simulator
7. **Android build** succeeds and keyboard behavior is correct on physical device
8. **No MacroPill references** appear anywhere in the codebase (search confirms)

---

## Phase 1 — Rollback Strategy

```
git checkout redesign/phase-1-tokens  ← working branch
git revert HEAD~N                     ← or cherry-pick revert per commit

Per-task rollback:
  T-01 to T-04: Delete constants files. No other files changed yet.
  T-05 to T-07: git diff shows only string replacements — easily reverted.
  T-08 to T-09: Single-file changes — revert individual files.
```

Because Phase 1 makes no visual changes, rollback is low-stakes.

---

---

# PHASE 2 — DAILY PROGRESS REDESIGN

**Goal:** Transform DailyProgress from the weakest element into the signature visual element of the app. After this phase, opening the app on the Home screen communicates macro status at a glance through the dominant ring values and the glass surface with aurora lighting.

**Branch name convention:** `redesign/phase-2-daily-progress`

**Prerequisite:** Phase 1 merged and green.

---

## D-01 — DailyProgress: larger ring values (18px/700)

**Files to modify:**
- `components/DailyProgress.tsx`

**Components affected:** `DailyProgress`, specifically the value Text element below each ring

**Complexity:** S

**Dependencies:** T-04 (typography constants)

**What to do:**

Locate the Text element that renders the current macro value (e.g., `1202`, `125`) below or inside each ring. Update its style to:
```
fontSize: 18      ← from current (likely 14–16px)
fontWeight: '700'
color: [macro color for this ring]
```

Import `RING_VALUE` from `constants/typography.ts` and apply it. The color is per-macro: MACRO_CALORIES, MACRO_PROTEIN, MACRO_CARBS, MACRO_FAT from `constants/colors.ts`.

The label below the value ("Cal", "Pro", "Crb", "Fat") stays at 11px/500 `TEXT_SECONDARY`.

**Unit suffix:** Per WIREFRAMES.md challenge D1, add a unit suffix to each ring value. The unit should be rendered as a nested `<Text>` inside the value `<Text>` at 11px/600 in the same macro color:
- Calories: append `kcal`
- Protein, Carbs, Fat: append `g`

**Risks:** Low. Pure text style change. Verify the ring columns do not overflow horizontally on small screens (SE, 375px wide) with the larger text.

---

## D-02 — DailyProgress: remaining budget sub-label

**Files to modify:**
- `components/DailyProgress.tsx`

**Components affected:** `DailyProgress`, each ring column

**Complexity:** S

**Dependencies:** T-01, T-04, D-01

**What to do:**

Below the existing label ("Cal", "Pro", etc.), add a third text line showing remaining budget:
```
{ 798↓ }   ← computed as (target − current), clamped at 0
```

Format: `${Math.max(0, target - current)}↓`

If current exceeds target (overbudget), show `0↓` — no negative numbers, no warning state yet (warning "!" indicator is a Phase 7 polish item).

Style: `RING_LABEL` typography (11px/500), color `TEXT_DISABLED` (#636366).

Source of `target`: pulled from user's nutrition targets in the Zustand store or Supabase settings. If no target is set, do not render this line (hide conditionally).

**Risks:** Low. Additive text element. Verify column heights remain uniform when one macro has "0↓" vs a three-digit "798↓" — use `minHeight` on the sub-label to prevent layout jitter.

---

## D-03 — DailyProgress: Calories ring larger

**Files to modify:**
- `components/DailyProgress.tsx` — SVG ring rendering logic

**Components affected:** The SVG `<Circle>` or equivalent for the Calories ring

**Complexity:** S

**Dependencies:** D-01

**What to do:**

Update the ring dimension constants within DailyProgress:
```
Calories ring: radius = 32, strokeWidth = 5
Protein ring:  radius = 28, strokeWidth = 4
Carbs ring:    radius = 28, strokeWidth = 4
Fat ring:      radius = 28, strokeWidth = 4
```

The SVG viewBox for the Calories ring column must be large enough to accommodate radius=32. The other three use radius=28.

Ring track color: `macro color + '20'` (8% alpha suffix appended to the 6-character hex). E.g., Calories track: `#0A84FF20`.

Ring fill: full macro color, `strokeLinecap: 'round'`, rotation starting at −90° (top of circle).

**Risks:** Low. Slightly larger Calories column — verify the four ring columns still fit side-by-side on a 358px card (390px − 32px margin) without overflow. Each column is approximately 358/4 = 89px wide. A radius=32 ring is 64px diameter — fits within 89px.

---

## D-04 — DailyProgress: header row ("Today" + date)

**Files to modify:**
- `components/DailyProgress.tsx`

**Components affected:** The title area at the top of DailyProgress

**Complexity:** S

**Dependencies:** T-01, T-04

**What to do:**

The header row is a `flexDirection: 'row'`, `justifyContent: 'space-between'` View containing:

Left: `{ Today }` — TITLE_LARGE (22px/700), TEXT_PRIMARY color

Right: `{ Mon, 16 Jun }` — CAPTION (13px/500), TEXT_SECONDARY color
- Use `new Date().toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })` or equivalent to format the current date
- This renders the date dynamically — no hardcoded string

**Risks:** Low. Verify date formatting on Android (locale handling can differ from iOS).

---

## D-05 — DailyProgress: full glass treatment (BlurView)

**Files to modify:**
- `components/DailyProgress.tsx`

**Components affected:** The outermost container of DailyProgress

**Complexity:** M

**Dependencies:** T-01, T-03, Phase 1 complete

**What to do:**

Replace the current opaque card container with a BlurView. The component must be restructured as follows:

**Outer wrapper** (relative-positioned View — needed for atmospheric layers in D-06):
```
position: 'relative'
marginHorizontal: SCREEN_PADDING_H    ← 16
marginTop: SPACE_2                    ← 8
```

**BlurView** (the glass surface itself):
```
tint: 'dark'
intensity: 28
backgroundColor: BG_GLASS             ← rgba(28,28,30,0.72)
borderRadius: RADIUS_MD               ← 16
borderWidth: 1
borderColor: GLASS_BORDER             ← rgba(255,255,255,0.08)
borderTopColor: GLASS_TOP_HIGHLIGHT   ← rgba(255,255,255,0.16)
borderTopWidth: 0.5
borderBottomColor: GLASS_BOTTOM_SHADOW ← rgba(0,0,0,0.30)
borderBottomWidth: 0.5
overflow: 'hidden'
padding: SPACE_5                      ← 20
```

Note: `overflow: 'hidden'` is required on BlurView for the border radius to clip correctly and for the blur to be contained within the card bounds.

`expo-blur` `BlurView` component is used. Confirm it is installed: `expo-blur` should already be a dependency given the current use on log cards. If not: `npx expo install expo-blur`.

**Risks:** Medium. BlurView rendering differs between iOS and Android. On Android, BlurView may render as a semi-transparent overlay without true blur — this is acceptable per DESIGN.md (the glass treatment degrades gracefully). Test on both platforms. If Android blur is absent, the `backgroundColor: BG_GLASS` fallback provides sufficient visual separation.

---

## D-06 — DailyProgress: four aurora atmospheric ellipses

**Files to modify:**
- `components/DailyProgress.tsx`

**Components affected:** The outer wrapper View of DailyProgress (from D-05)

**Complexity:** M

**Dependencies:** D-05, T-01

**What to do:**

Inside the outer relative-positioned wrapper, before the BlurView, render four `View` elements absolutely positioned. These are the aurora atmospheric layers. They must be JSX siblings of the BlurView, rendered before it (so they appear behind it in z-order):

```
Ellipse 1 — calories/blue:
  position: 'absolute'
  width: '80%', height: 80
  top: -20, left: '-5%'
  backgroundColor: GLOW_CALORIES    ← rgba(10,132,255,0.025)
  borderRadius: 9999
  pointerEvents: 'none'

Ellipse 2 — protein/green:
  position: 'absolute'
  width: '65%', height: 60
  top: -10, right: '-5%'
  backgroundColor: GLOW_PROTEIN     ← rgba(48,209,88,0.02)
  borderRadius: 9999
  pointerEvents: 'none'

Ellipse 3 — carbs/cyan:
  position: 'absolute'
  width: '60%', height: 55
  bottom: -15, left: '-5%'
  backgroundColor: GLOW_CARBS       ← rgba(90,200,250,0.02)
  borderRadius: 9999
  pointerEvents: 'none'

Ellipse 4 — fat/amber:
  position: 'absolute'
  width: '50%', height: 50
  bottom: -20, right: 0
  backgroundColor: GLOW_FAT         ← rgba(255,159,10,0.02)
  borderRadius: 9999
  pointerEvents: 'none'
```

`pointerEvents: 'none'` is required — atmospheric layers must never intercept touch events.

**Critical opacity rule:** If any glow is visible when not consciously looking for it on a physical device, reduce its opacity by 50%. The glow values above are at their maximum permitted levels. On Android, additionally multiply all opacities by 0.70 (30% reduction).

**Risks:** Low. Pure visual addition. The opacity values are so low that even if the implementation is slightly off, the effect is either imperceptible or subtly visible — neither is a regression.

---

## D-07 — DailyProgress: ring animates from previous value

**Files to modify:**
- `components/DailyProgress.tsx`
- The Zustand store or context that holds daily macro totals (wherever ring progress values are computed and passed to DailyProgress)

**Components affected:** `DailyProgress`, the ring animation logic

**Complexity:** M

**Dependencies:** D-03, T-04

**What to do:**

Currently the rings animate from 0 to the current value on every mount. This must change to animate from the **previous** value to the new value.

Strategy:
1. Use a `useRef` to store the previous macro totals: `prevTotals = useRef({ calories: 0, protein: 0, carbs: 0, fat: 0 })`
2. When the macro totals prop/state changes, the animation's `from` value is `prevTotals.current[macro]`
3. After the animation completes, update `prevTotals.current` to the new values
4. On first mount (all zeros initially), animate from 0 — this is correct

Animation spec:
```
Type: Animated.timing
Duration: 500ms
Easing: Easing.out(Easing.cubic)
Property: the strokeDashoffset value that controls ring fill percentage
```

The stagger (Calories → Protein → Carbs → Fat, 60ms between each) is implemented in Phase 7 (M-05) as part of the post-save motion continuity sequence. In this phase, implement the single-ring animation from previous value only (no stagger yet — all four rings animate simultaneously for now).

**Risks:** Medium. Requires understanding of how the ring's `strokeDashoffset` is currently computed and animated. If the ring uses a library (e.g., `react-native-svg`) rather than SVG directly, the animation target property may differ. Identify the exact animated property before implementation.

---

## Phase 2 — Expected Visual Outcome

After Phase 2:
- The DailyProgress card appears frosted-glass with a subtle specular highlight on its top edge
- Four macro ring values are now 18px/700 in their macro colors — visually dominant
- The Calories ring is visibly slightly larger than the other three
- A "Today / Mon, 16 Jun" header row is present at the top of the card
- A remaining budget sub-label appears below each ring label ("798↓")
- A faint multicolour aurora bleeds around the card (barely perceptible at first glance)
- The ring fills animate from their current value when the component updates (not from 0)

---

## Phase 2 — Testing Requirements

1. **All four rings render** with correct macro colors and `strokeLinecap: 'round'`
2. **Calories ring** is visibly larger than Protein/Carbs/Fat rings
3. **Ring values** are the dominant text element — larger than labels and sub-labels
4. **Unit suffixes** appear on all ring values (kcal, g)
5. **Remaining budget** updates correctly when targets are changed in Settings
6. **Remaining budget** shows `0↓` when current exceeds target (not negative)
7. **Aurora ellipses** are not visible unless the user consciously looks for them. Test on both OLED (iPhone 14 Pro) and LCD (mid-range Android) if available
8. **BlurView glass** renders on iOS with visible blur. On Android, confirm the fallback `BG_GLASS` backgroundColor provides sufficient contrast
9. **Ring animation** fires correctly after a Save action — animates from previous value, not from 0
10. **No layout overflow** on iPhone SE (375px wide) — verify with simulator
11. **`overflow: 'hidden'`** on BlurView correctly clips the glass border radius

---

## Phase 2 — Rollback Strategy

```
git revert redesign/phase-2-daily-progress

DailyProgress.tsx is a self-contained component. Rolling back this file
restores the previous card without affecting any other screen.

If only the glass treatment (D-05) causes issues on Android:
  Conditionally apply BlurView on iOS only:
    Platform.OS === 'ios' ? <BlurView ...> : <View bg={BG_GLASS} ...>
  This is a known safe fallback per DESIGN.md §6.
```

---

---

# PHASE 3 — ANALYSIS RESULT REDESIGN

**Goal:** Elevate the Analysis Result from an opaque surface card to the secondary glass surface on Home screen. The result should materialise from the dark after analysis completes, carrying its own blue atmospheric glow.

**Branch name convention:** `redesign/phase-3-analysis-result`

**Prerequisite:** Phase 2 merged and green.

---

## A-01 — AnalysisResultCard: wrap in BlurView (secondary glass)

**Files to modify:**
- `components/AnalysisResultCard.tsx` (or wherever the analysis result is rendered — may be inline in `index.tsx`)

**Components affected:** `AnalysisResultCard`

**Complexity:** M

**Dependencies:** T-01, T-03, Phase 1 complete

**What to do:**

Replace the current opaque card container with the secondary glass specification:

**Outer wrapper** (relative-positioned, for atmospheric layer in A-02):
```
position: 'relative'
marginHorizontal: SCREEN_PADDING_H   ← 16
marginTop: SPACE_4                   ← 16
```

**BlurView**:
```
tint: 'dark'
intensity: 24                        ← less than DailyProgress (28) — secondary status
backgroundColor: BG_GLASS            ← rgba(28,28,30,0.72)
borderRadius: RADIUS_MD              ← 16
borderWidth: 1
borderColor: GLASS_BORDER            ← rgba(255,255,255,0.08)
borderTopColor: GLASS_TOP_HIGHLIGHT_SOFT  ← rgba(255,255,255,0.14)
borderTopWidth: 0.5
borderBottomColor: GLASS_BOTTOM_SHADOW_SOFT ← rgba(0,0,0,0.25)
borderBottomWidth: 0.5
overflow: 'hidden'
padding: SPACE_4                     ← 16
```

**Internal layout** (top to bottom within the BlurView):
1. Section title "Analysis Result" — TITLE (20px/700), TEXT_PRIMARY
2. Spacer 16px
3. Macro edit row (4 columns) — see below
4. Divider — `height: 1, backgroundColor: rgba(255,255,255,0.08), marginVertical: 12`
5. Section title "Food Items" — HEADING (16px/600), TEXT_PRIMARY, marginBottom: 8
6. FoodItemCard list (gap: 8 between cards)

**Macro edit row:** 4 columns (Calories, Protein, Carbs, Fat). Each column contains:
- Label: macro name, 12px, macro color (e.g., #0A84FF for Calories)
- TextInput: numeric keypad, `backgroundColor: BG_ELEVATED` (#2C2C2E), `borderRadius: RADIUS_SM` (10), `textAlign: 'center'`, pre-populated with AI result value

**Risks:** Medium. BlurView count on Home screen after this change: DailyProgress (1) + AnalysisResultCard (2) + TabBarIsland (3, added in Phase 4) = exactly 3, within the §23 budget. Verify this count before shipping Phase 4.

---

## A-02 — AnalysisResultCard: blue atmospheric ellipse

**Files to modify:**
- `components/AnalysisResultCard.tsx`

**Components affected:** The outer wrapper of AnalysisResultCard

**Complexity:** S

**Dependencies:** A-01, T-01

**What to do:**

Inside the outer relative-positioned wrapper, before the BlurView, add a single atmospheric View:

```
position: 'absolute'
width: '120%', height: '130%'
left: '-10%', top: '-15%'
borderRadius: 9999
backgroundColor: GLOW_BLUE_CARD    ← rgba(10,132,255,0.025)
pointerEvents: 'none'
```

This is a single blue ellipse — fixed colour regardless of which macro dominates the result. Simpler and more performant than a dynamic colour based on AI output.

**Risks:** Low.

---

## A-03 — AnalysisResultCard: FoodItemCards → translucent background

**Files to modify:**
- `components/FoodItemCard.tsx`

**Components affected:** `FoodItemCard`

**Complexity:** S

**Dependencies:** T-01, T-03, A-01

**What to do:**

When FoodItemCard renders inside the AnalysisResultCard glass panel, its background must be translucent rather than the standard opaque `BG_SURFACE`. This preserves the glass visual language inside the card.

Two approaches:

**Approach A (prop-based — recommended):** Add an optional `translucent?: boolean` prop to FoodItemCard. When `true`, apply:
```
backgroundColor: 'rgba(255,255,255,0.05)'
borderRadius: RADIUS_SM              ← 10 (NOTE: DESIGN.md says 12 — WIREFRAMES.md D2
                                       challenges this. Use 10 per the three-radius rule)
borderWidth: 1
borderColor: 'rgba(255,255,255,0.06)'
```
When `false` or absent, apply the standard `BG_SURFACE` background with `RADIUS_MD: 16`.

**Approach B (context-based):** Use a React context that AnalysisResultCard sets to `'glass'`, and FoodItemCard reads it. More complex — only use if FoodItemCard is deeply nested and prop drilling is impractical.

Use Approach A unless the component tree makes it impractical.

Pass `translucent={true}` from AnalysisResultCard to each FoodItemCard it renders.

The Raw/Cooked toggle chip inside FoodItemCard: keep `RADIUS_SM: 10` unchanged. The chip background uses `BG_ELEVATED` (#2C2C2E) — this is fine inside the translucent card.

**Risks:** Low. Additive prop, no breaking change to FoodItemCard's default behavior.

---

## A-04 — AnalysisResultCard: opacity+translateY entrance animation

**Files to modify:**
- `components/AnalysisResultCard.tsx`
- `app/home/(tabs)/index.tsx` — where the card is conditionally rendered

**Components affected:** `AnalysisResultCard`, the Home screen's analysis state logic

**Complexity:** M

**Dependencies:** A-01, T-01

**What to do:**

Wrap the AnalysisResultCard in an `Animated.View` with two animated values:
- `opacity`: 0 → 1
- `transform: [{ translateY }]`: 12 → 0

Both animated values share a single `Animated.timing` call:
```
Duration: 220ms
Easing: Easing.out(Easing.cubic)
Delay: 0ms (starts immediately when result is ready)
```

**Trigger:** The animation starts when the analysis result data becomes available (i.e., when the AI response is received and state is set). The Animated.Value instances should be initialised to their start values (`opacity: 0`, `translateY: 12`) and the animation fires in a `useEffect` that depends on the result data.

**Important — origin direction:** The card must appear to rise from below the button row, not drop from above. `translateY` starts at `+12` (below) and animates to `0`. A negative start value would create a drop-in effect (wrong).

**Important — no state flash:** Initialise `opacity` to `0` immediately when the component is created (before the animation fires). If opacity starts at `1` and the animation fires a frame late, the card will flash visible briefly. Use `useRef` for the Animated.Values so they are not re-created on re-render.

**Risks:** Low. Isolated animation. If `Easing.out(Easing.cubic)` is not available, use `Easing.out(Easing.quad)` as a fallback — visually nearly identical.

---

## A-05 — AnalysisResultCard: local fallback error banner

**Files to modify:**
- `components/AnalysisResultCard.tsx`

**Components affected:** `AnalysisResultCard`

**Complexity:** S

**Dependencies:** A-01

**What to do:**

Add an optional `usedLocalFallback?: boolean` prop to AnalysisResultCard. When `true`, render a small banner between the section title and the macro edit row:

```
{ ⚠ Estimated locally · AI unavailable }
```

Style: 12px/400, TEXT_SECONDARY (#98989D), no background, no border. The warning icon (`⚠`) can use Ionicons `warning-outline` at 12px or be a Unicode character inline. Do not style this as an error — it is low-urgency informational text.

Pass this prop from the Home screen's analysis state (the boolean should be set by the Gemini API call handler when it falls back to local estimation).

**Risks:** Low. Additive conditional render.

---

## Phase 3 — Expected Visual Outcome

After Phase 3:
- After tapping Analyze and receiving a result, a frosted-glass card materialises from slightly below the button row with a 220ms rise
- The card has a faint blue atmospheric glow behind it
- Inside the card: "Analysis Result" in 20px/700, macro edit inputs with macro-colored labels, a divider, "Food Items" in 16px/600, then translucent FoodItemCards
- If AI was unavailable, a discreet "Estimated locally" banner appears
- The visual depth hierarchy on Home screen is now: Background → FoodEntry/OilSlider → Analysis Result (glass) → DailyProgress (glass, stronger) → Island (Phase 4)

---

## Phase 3 — Testing Requirements

1. **Analysis Result card** appears with visible blur on iOS (degraded but visible on Android)
2. **Entrance animation** — card rises from below, not from top or edge. Confirm `translateY` direction
3. **Opacity** starts at 0 — no flash before animation
4. **FoodItemCard** backgrounds are translucent (rgba) inside the glass panel — not opaque `#1C1C1E`
5. **FoodItemCard borderRadius** is 10 (RADIUS_SM), not 12
6. **Blue atmospheric glow** behind the card — barely perceptible, not a visible blue wash
7. **Macro inputs** are editable — tapping opens numeric keyboard, value updates live
8. **BlurView count** on Home screen with Analysis Result visible: exactly 3 (DailyProgress + AnalysisResult + Island when Phase 4 lands). Verify no fourth BlurView is rendered
9. **Local fallback banner** renders when `usedLocalFallback={true}` — does not render otherwise
10. **"Analysis Result" heading** is 20px/700 — verify against typography constants

---

## Phase 3 — Rollback Strategy

```
git revert redesign/phase-3-analysis-result

AnalysisResultCard.tsx and FoodItemCard.tsx are self-contained.
Rolling back restores the opaque card without affecting Home screen layout.

If BlurView causes Android performance issues specifically on this card:
  Apply the same Platform.OS conditional as DailyProgress:
    iOS: BlurView, Android: View with BG_GLASS background
  This does not affect the atmospheric layer or entrance animation.
```

---

---

# PHASE 4 — FLOATING TAB BAR

**Goal:** Replace the native Material tab bar with a custom floating Liquid Glass island that lifts off the screen floor. This is the single most visually impactful change in the redesign — the island is the first thing a first-time user notices.

**Branch name convention:** `redesign/phase-4-tab-bar`

**Prerequisite:** Phase 3 merged and green.

---

## B-01 — Create custom TabBarIsland component

**Files to modify:**
- `components/TabBarIsland.tsx` — CREATE
- `app/_layout.tsx` — mount the island
- Each tab screen file — see B-02

**Components affected:** New component, plus the root layout

**Complexity:** XL

**Dependencies:** T-01, T-02, T-03, T-04, Phase 1 complete

**What to do:**

Create `components/TabBarIsland.tsx`. This component is absolutely positioned and rendered inside each `SwipeableTabScreen` (or in the root layout above the tab navigator, depending on architecture). See navigation integration note below.

**Component props:**
```
activeTab: 'home' | 'entries' | 'settings'
onTabPress: (tab: 'home' | 'entries' | 'settings') => void
```

**Layout:** See WIREFRAMES.md §1 for the full annotated layout diagram.

**Positioning:**
```
position: 'absolute'
bottom: 16 + insets.bottom          ← useSafeAreaInsets().bottom, min 0
left: 24
right: 24
height: 64
zIndex: 100                         ← above all content, below modals
```

**BlurView (the island itself):**
```
tint: 'dark'
intensity: 36
backgroundColor: rgba(28,28,30,0.80)   ← slightly more opaque than cards
borderRadius: RADIUS_LG               ← 24 (pill shape)
borderWidth: 1
borderColor: GLASS_BORDER_ISLAND      ← rgba(255,255,255,0.10)
borderTopColor: GLASS_TOP_HIGHLIGHT_STRONG ← rgba(255,255,255,0.22)
borderTopWidth: 0.5
borderBottomColor: GLASS_BOTTOM_SHADOW_STRONG ← rgba(0,0,0,0.50)
borderBottomWidth: 0.5
overflow: 'hidden'
flexDirection: 'row'
alignItems: 'center'
```

**Atmospheric layer beneath island:**
```
position: 'absolute'
bottom: -8                          ← 8px below island bottom
left: 16, right: 16                 ← narrower than island (centred falloff)
height: 20
borderRadius: 9999
backgroundColor: GLOW_PRIMARY       ← rgba(10,132,255,0.02)
pointerEvents: 'none'
zIndex: 99                          ← below island (zIndex 100)
```

**Each tab item** (three items, `flex: 1` each, `alignItems: 'center'`):
```
Pressable (flex: 1, alignItems: 'center', justifyContent: 'center')
  ↳ Active indicator pill (conditional — only on active tab):
      backgroundColor: ACTIVE_PILL_BG   ← rgba(10,132,255,0.15)
      borderRadius: 12                  ← NOT in the 3-radius system — see note below
      paddingHorizontal: 16
      paddingVertical: 4
      alignItems: 'center'
  ↳ Icon (Ionicons):
      Active: filled variant, color MACRO_CALORIES (#0A84FF), size 22
      Inactive: outline variant, color TEXT_DISABLED (#636366), size 22
  ↳ Label (Text):
      Active:   CAPTION_SMALL (11px/600), color MACRO_CALORIES (#0A84FF)
      Inactive: CAPTION_SMALL (11px/500), color TEXT_DISABLED (#636366)
```

**NOTE on the active pill borderRadius: 12:** This value does not appear in the three-radius system (10/16/24). It is used only for the active indicator capsule inside the island — a UI-internal element not exposed as a card or button. Use 12 here specifically; do not add it to the radius constants.

**Icon names (Ionicons):**
```
Home:     active="home"          inactive="home-outline"
Entries:  active="list-sharp"    inactive="list-outline"
Settings: active="settings"      inactive="settings-outline"
```

**Navigation integration — Approach A (recommended):**
In each tab screen's `_layout.tsx` or the `SwipeableTabScreen` wrapper:
1. Set `tabBarStyle: { display: 'none' }` on all tab screens to hide the native tab bar
2. Render `<TabBarIsland>` as a sibling of the screen content (not a child of ScrollView)
3. `TabBarIsland` reads current route with `usePathname()` from Expo Router
4. `onTabPress` calls `router.push('/')`, `router.push('/entries')`, or `router.push('/settings')`

Exact integration point depends on how `SwipeableTabScreen` is currently structured. The island must be:
- Outside the ScrollView (so it does not scroll)
- Inside a View with `flex: 1` so it has a positioned parent
- Rendered on all three tab screens (not just one)

**Risks:** High. This is the most complex single change. Navigation integration with Expo Router's `<Tabs>` while hiding the native bar requires careful testing. The island's `position: 'absolute'` must not cause layout issues on Android where safe area insets behave differently. Test on physical devices — simulators may not accurately represent bottom inset behaviour.

---

## B-02 — Hide native tab bar on all screens

**Files to modify:**
- `app/_layout.tsx` or the file where `<Tabs>` is configured

**Components affected:** The Expo Router `<Tabs>` component

**Complexity:** S

**Dependencies:** B-01

**What to do:**

On each `<Tabs.Screen>` inside the `<Tabs>` navigator, add:
```
options={{ tabBarStyle: { display: 'none' } }}
```

Or, if supported by the Expo Router version, set a `tabBarStyle={{ display: 'none' }}` at the `<Tabs>` level to hide the native bar globally.

Do not remove `<Tabs>` — it is still needed for routing. Only the visual tab bar should be hidden.

**Risks:** Medium. Hiding the native bar without the custom island live creates a broken navigation state. B-01 and B-02 must be deployed together in the same commit/PR.

---

## B-03 — Tab bar: active indicator capsule

**Files to modify:**
- `components/TabBarIsland.tsx`

**Components affected:** `TabBarIsland`, the active tab item rendering

**Complexity:** M

**Dependencies:** B-01

**What to do:**

This is specified as part of B-01 (the active indicator pill is integral to the island component). Calling it out separately to clarify the transition behaviour:

**Active indicator transition — cross-fade, NOT slide:**
When the active tab changes, the outgoing tab's indicator pill fades `opacity: 1 → 0` over 120ms simultaneously with the incoming tab's pill fading `opacity: 0 → 1` over 120ms. Total perceived transition: 120ms (they overlap, not sequential).

Do NOT implement a sliding pill animation — this requires measuring absolute positions across tab items and is brittle across screen widths.

Implementation: each tab item maintains its own `Animated.Value` for `opacity` of its indicator pill. When `activeTab` prop changes, fire the outgoing tab's fade-out and incoming tab's fade-in simultaneously.

**Risks:** Low. Contained to the island component.

---

## B-04 — Tab bar: atmospheric glow beneath island

**Files to modify:**
- `components/TabBarIsland.tsx`

**Components affected:** `TabBarIsland` wrapper

**Complexity:** S

**Dependencies:** B-01

**What to do:**

This is specified as part of B-01. Calling out separately for verification:

The atmospheric layer is a sibling View rendered before the BlurView (behind it in z-order) with `position: 'absolute'`:
```
bottom: -8      ← relative to the island's positioned container
left: 16
right: 16
height: 20
borderRadius: 9999
backgroundColor: GLOW_PRIMARY    ← rgba(10,132,255,0.02)
pointerEvents: 'none'
```

Verify on device that this glow is only visible when actively looking for it. If visible without looking, reduce opacity to `0.012`.

**Risks:** Low.

---

## B-05 — Tab bar: icon spring press animation

**Files to modify:**
- `components/TabBarIsland.tsx`

**Components affected:** Each `Pressable` tab item in `TabBarIsland`

**Complexity:** M

**Dependencies:** B-01

**What to do:**

Each tab icon has a scale animation on press:
```
Press:   scale: 1.0 → 0.92 (immediate, 0ms)
Release: scale: 0.92 → 1.06 → 1.0 (spring: damping 20, stiffness 300)
Total release duration: ~180ms
```

Use `Animated.spring` on a `scaleValue` Animated.Value. Apply to the `transform` style of the icon (and its label, so both scale together).

Each tab item manages its own `Animated.Value` for scale. Press gesture:
- `onPressIn`: `Animated.timing(scaleValue, { toValue: 0.92, duration: 0, useNativeDriver: true })`
- `onPressOut`: `Animated.spring(scaleValue, { toValue: 1.0, damping: 20, stiffness: 300, useNativeDriver: true })`

`useNativeDriver: true` is required for performance — scale transforms are supported on the native driver on both platforms.

**Risks:** Low. Contained animation. `useNativeDriver: true` must be set — forgetting it causes a warning and degrades performance.

---

## B-06 — Tab bar: island entrance animation (app launch)

**Files to modify:**
- `components/TabBarIsland.tsx`

**Components affected:** `TabBarIsland` outer animated wrapper

**Complexity:** M

**Dependencies:** B-01, B-05

**What to do:**

On the island's first mount (app launch only), play a slide-up entrance animation:

```
translateY: 40 → 0
opacity: 0 → 1
Duration: 400ms
Easing: Easing.out(Easing.back(1.2))   ← slight overshoot gives premium feel
Delay: 200ms after mount (waits for content to load)
```

Wrap the island's BlurView (and its atmospheric sibling) in an `Animated.View` with the animated `translateY` and `opacity`.

**"App launch only"** implementation:
- Use a module-level boolean `let hasAnimated = false` in the TabBarIsland file
- On mount, if `!hasAnimated`, fire the animation and set `hasAnimated = true`
- On subsequent mounts (tab switches), skip the animation
- This boolean resets when the app process restarts — correct behavior

If the island is unmounted on modal open (see WIREFRAMES C2 risk), the `hasAnimated` flag prevents re-animation when the modal closes. This is correct — the entrance only plays once per process lifecycle.

**Risks:** Medium. `Easing.back(1.2)` produces an overshoot (the island goes slightly past its final position then settles back). On Android, spring physics rendering may not perfectly match iOS. Test the overshoot feel on a physical Android device — if the overshoot looks janky rather than premium, reduce `back` factor to `1.05` or switch to `Easing.out(Easing.cubic)`.

---

## B-07 — Update content paddingBottom across all screens

**Files to modify:**
- `app/home/(tabs)/index.tsx` — Home screen ScrollView
- `app/home/(tabs)/settings.tsx` — Settings screen ScrollView
- `app/home/(tabs)/entries.tsx` — Entries screen ScrollView

**Components affected:** ScrollView `contentContainerStyle` on each tab screen

**Complexity:** S

**Dependencies:** B-01 (need island height to calculate)

**What to do:**

Every ScrollView on a tab screen must have `paddingBottom` sufficient to prevent the island from occluding the last visible element.

```
Home screen:     paddingBottom: SPACE_24      ← 96px
Settings screen: paddingBottom: SPACE_24      ← 96px
Entries screen:  paddingBottom: SPACE_ENTRIES_BOTTOM  ← 160px (resolves WIREFRAMES C1)
```

The Entries screen value of 160px is higher to account for the FAB sitting above the island. See WIREFRAMES.md §9 Conflict 1 for the derivation:
- Island bottom: 16 + insets.bottom (≈ 50px from screen floor on iOS)
- FAB bottom: 16 + 64 + 16 + insets.bottom ≈ 130px from screen floor
- FAB size: 56px
- Safe clearance: 130 + 56 + 16 = 202px ← use 160px as a reasonable middle ground
  (The last card needs 160px clearance to be fully visible above the FAB)

If `insets.bottom` is dynamic, compute `paddingBottom` dynamically:
```
const insets = useSafeAreaInsets()
const islandHeight = 64
const islandGap = 16
const islandBottom = islandGap + insets.bottom
const fabHeight = 56
const fabGap = 16
const entriesBottomPad = islandBottom + islandHeight + fabGap + fabHeight + fabGap
```

**Risks:** Medium. If paddingBottom is insufficient, the last card or button will be hidden behind the island. Test by scrolling to the bottom of each screen and confirming the last element is fully visible with space to spare.

---

## Phase 4 — Expected Visual Outcome

After Phase 4:
- The native Material tab bar is gone
- A floating glass pill hovers above the screen floor with 24px margins on each side
- The active tab shows a soft blue capsule behind its icon and label, both in `#0A84FF`
- Inactive tabs show outline icons in `#636366`
- Tapping a tab icon produces a satisfying spring compress-and-overshoot
- On first app launch, the island slides up from below the screen and settles with a slight overshoot
- A barely-perceptible blue glow sits beneath the island
- All screen content clears the island with comfortable bottom padding

---

## Phase 4 — Testing Requirements

1. **Island renders** on all three screens (Home, Entries, Settings)
2. **Native tab bar is invisible** — no Material underline, no system tab bar visible
3. **Island does not touch screen edges** — 24px left/right margin confirmed on 390px device and on 375px SE
4. **Island lifts above screen floor** — visible gap below island, above safe area indicator
5. **Active indicator** is a blue capsule, not a dot or underline
6. **Tab switching** — tapping each tab navigates correctly and updates active indicator
7. **Active indicator cross-fades** — no slide, no snap, 120ms fade
8. **Icon spring animation** — compress on press, overshoot on release, ~180ms
9. **Entrance animation** plays once on app launch, not on every tab switch
10. **BlurView count** — on Home screen with Analysis Result visible: DailyProgress + AnalysisResult + Island = 3. Never 4.
11. **Scroll content clears island** — bottom of each screen's content is fully visible when scrolled to end
12. **Entries screen** — last log card is fully visible above FAB, FAB is fully visible above island
13. **Android bottom inset** — island does not overlap system gesture navigation area
14. **Modal behaviour** — Log Food and Edit Entry modals render above the island (higher zIndex or modal system handles this automatically)
15. **Touch targets** — all three tab items are easily tappable, no dead zones

---

## Phase 4 — Rollback Strategy

```
git revert redesign/phase-4-tab-bar

IMPORTANT: B-01 and B-02 must be reverted together. Reverting B-02 alone
(showing the native tab bar again) while the custom island is still rendered
will result in double tab bars. Revert the entire phase as a unit.

If the island is causing performance issues on Android specifically:
  1. Keep the custom island component
  2. Reduce BlurView intensity from 36 to 20
  3. Or replace BlurView with View + BG_GLASS background on Android only
     using Platform.OS === 'android' conditional

If entrance animation causes jank:
  Set hasAnimated = true immediately on mount (skip the animation entirely)
  The entrance animation is polish, not functional.
```

---

---

# PHASE 5 — ENTRIES SCREEN

**Goal:** Complete the Entries screen redesign — replace BlurView on log cards with View (performance), add units to macro values, standardise modal headers, add EmptyState icon, fix FAB positioning, and deliver two clean modals.

**Branch name convention:** `redesign/phase-5-entries`

**Prerequisite:** Phase 4 merged and green.

---

## E-01 — Replace BlurView on log cards with View

**Files to modify:**
- `app/home/(tabs)/entries.tsx`

**Components affected:** The log entry card component (may be inline in `entries.tsx` or a separate component)

**Complexity:** S

**Dependencies:** T-01

**What to do:**

Locate every `BlurView` used to render log entry cards. Replace each with a plain `View`:

```
REMOVE: <BlurView tint="dark" intensity={40} ...>
ADD:    <View style={{ backgroundColor: BG_SURFACE, ...rest }}>

```

Log entry cards are Level 1 (Raised) content surfaces — they are not floating elements and do not require blur. Using BlurView on every card in a scroll list causes measurable jank on mid-range Android (7+ simultaneous BlurViews).

The card's other styles remain unchanged:
```
borderRadius: RADIUS_MD    ← 16 (already updated in T-06)
borderWidth: 1
borderColor: GLASS_BORDER  ← rgba(255,255,255,0.08)
padding: 14
marginBottom: CARD_GAP     ← 8
```

**Risks:** Low. Visual change is minimal — the cards will no longer have a frosted look, but the opaque `#1C1C1E` surface on `#0C0C0E` background still creates visible depth through color contrast. Performance will improve.

---

## E-02 — Add units to log card macro values

**Files to modify:**
- `app/home/(tabs)/entries.tsx` (or the log card rendering function/component)

**Components affected:** The macro summary row inside each log card

**Complexity:** S

**Dependencies:** T-01, T-04

**What to do:**

Currently the macro row renders raw numbers: `462  76  8  12`.

Change to: `462kcal  76g  8g  12g`

Format strings: `${value}kcal` for calories, `${value}g` for protein, carbs, fat.

No space between value and unit (matches iOS Health display convention: `462kcal`, not `462 kcal`).

Typography:
```
Calories: CAPTION (13px/500) but fontWeight: '700', color: MACRO_CALORIES
Protein:  CAPTION (13px/500) but fontWeight: '600', color: MACRO_PROTEIN
Carbs:    CAPTION (13px/500) but fontWeight: '600', color: MACRO_CARBS
Fat:      CAPTION (13px/500) but fontWeight: '600', color: MACRO_FAT
```

The four values are in a `flexDirection: 'row'` View with `gap: CHIP_GAP` (8px).

**Risks:** Low. String formatting only. Verify the macro row does not wrap to two lines on narrow screens (SE, 375px). If it wraps: reduce gap to 4px or truncate calories to `462` + separate `kcal` sub-label.

---

## E-03 — Day picker glass treatment

**Files to modify:**
- `app/home/(tabs)/entries.tsx`

**Components affected:** The day picker container at the top of Entries

**Complexity:** M

**Dependencies:** T-01, T-03, Phase 1 complete

**What to do:**

Replace the current day picker container with the glass specification:

**Outer wrapper** (relative, for atmospheric layer):
```
position: 'relative'
```

**Atmospheric layer** (behind day picker):
```
position: 'absolute'
width: '100%', height: '200%'
top: '-50%'
backgroundColor: GLOW_NEUTRAL    ← rgba(255,255,255,0.015)
pointerEvents: 'none'
```

**BlurView:**
```
tint: 'dark'
intensity: 28
borderRadius: 0                   ← full-width strip, not rounded
borderBottomWidth: 1
borderBottomColor: GLASS_BORDER   ← rgba(255,255,255,0.08)
borderTopColor: GLASS_TOP_HIGHLIGHT_SOFT  ← rgba(255,255,255,0.14)
borderTopWidth: 0.5
paddingVertical: 10
paddingHorizontal: SCREEN_PADDING_H   ← 16
```

The day pills scroll horizontally inside a `ScrollView` (horizontal, `showsHorizontalScrollIndicator: false`) inside the BlurView.

**Risks:** Low. The day picker is not in the BlurView budget on Entries screen (Day picker + Island = 2, within the 3 budget).

---

## E-04 — Day picker pill radius 20→10

**Files to modify:**
- `app/home/(tabs)/entries.tsx`

**Components affected:** Day pill components inside the day picker

**Complexity:** S

**Dependencies:** T-03

**What to do:**

This is covered by T-06 (radius unification) but called out here since the pill radius change on the Entries screen is visible and may need specific verification.

Confirm day pills use `RADIUS_SM: 10` (not 20). If T-06 already applied this, verify and move on.

Day pill style per state:
```
Inactive:
  backgroundColor: 'rgba(255,255,255,0.08)'
  borderRadius: RADIUS_SM     ← 10
  paddingHorizontal: 20
  paddingVertical: 8
  color: TEXT_SECONDARY       ← #98989D
  fontSize: 14, fontWeight: '600'

Active:
  backgroundColor: MACRO_CALORIES   ← #0A84FF
  color: TEXT_PRIMARY                ← #FFFFFF
  (same radius, padding as inactive)

Today (when not the active tab):
  backgroundColor: 'rgba(255,255,255,0.08)'
  borderWidth: 1
  borderColor: MACRO_CALORIES    ← thin blue border indicates today
  color: TEXT_SECONDARY
```

**Risks:** Low. The visual change (lozenges → squared pills) is intentional per DESIGN.md.

---

## E-05 — FAB bottom position formula

**Files to modify:**
- `app/home/(tabs)/entries.tsx`

**Components affected:** The FAB (Floating Action Button)

**Complexity:** S

**Dependencies:** B-01 (need island dimensions), T-01

**What to do:**

Update the FAB's `bottom` position from the current `bottom: 16` to:
```
const insets = useSafeAreaInsets()
const fabBottom = 16 + 64 + 16 + insets.bottom
             ↑       ↑    ↑
           gap    island  gap above island
```

Also update the FAB's `right` alignment to `right: 24` to align with the island's right edge (island ends at `right: 24`).

Full FAB style:
```
position: 'absolute'
right: 24
bottom: fabBottom    ← computed above
width: 56
height: 56
borderRadius: RADIUS_LG    ← 24
backgroundColor: COLOR_PRIMARY    ← #0A84FF
shadow:
  shadowColor: COLOR_PRIMARY
  shadowOffset: { width: 0, height: 4 }
  shadowOpacity: 0.35
  shadowRadius: 12
  elevation: 8        ← Android elevation
zIndex: 50            ← above content, below island (zIndex 100)
```

**Risks:** Medium. If `useSafeAreaInsets()` is not already imported in `entries.tsx`, add the import. Verify on a physical iPhone (notch or Dynamic Island) that the FAB does not overlap the island.

---

## E-06 — Entries paddingBottom = 160px

**Files to modify:**
- `app/home/(tabs)/entries.tsx` — the ScrollView's `contentContainerStyle`

**Components affected:** Entries screen ScrollView

**Complexity:** S

**Dependencies:** B-07, E-05

**What to do:**

Set `paddingBottom: SPACE_ENTRIES_BOTTOM` (160) on the ScrollView's `contentContainerStyle`. This is defined in `constants/spacing.ts` (T-02).

If `SPACE_ENTRIES_BOTTOM` is computed dynamically (using `insets.bottom`), pass it as a computed value:
```
const insets = useSafeAreaInsets()
const entriesBottomPad = 16 + 64 + 16 + insets.bottom + 56 + 16
```

**Risks:** Low. Insufficient padding is the only risk — test by scrolling to the bottom and confirming the last log card is fully visible above the FAB.

---

## E-07 — EmptyState with Ionicons icon

**Files to modify:**
- `components/EmptyState.tsx` (or wherever the EmptyState component is defined; may be inline in `entries.tsx`)

**Components affected:** `EmptyState`

**Complexity:** S

**Dependencies:** T-01, T-04

**What to do:**

Add an Ionicons icon above the existing empty state text. The complete EmptyState layout:

```
View (alignItems: 'center', paddingVertical: SPACE_16)
  Icon (Ionicons, name: 'restaurant-outline', size: 40, color: TEXT_DISABLED)
  [Spacer: 12px]
  Text (title) — 15px/600, TEXT_SECONDARY
  [Spacer: 4px]
  Text (CTA) — 13px/400, TEXT_DISABLED
```

Suggested icon names per context:
- Entries empty state: `'restaurant-outline'` or `'calendar-outline'`
- Home empty state (no analysis yet): `'pencil-outline'` or `'create-outline'`

If the EmptyState component receives a `context` or `icon` prop, use it. If not, hardcode appropriate defaults per screen context.

CTA text for Entries empty state: `"Tap + to log a meal"`
CTA text for Home empty state: `"Describe what you ate and tap Analyze"`

**Risks:** Low. Purely additive.

---

## E-08 — Log Food modal header standardisation

**Files to modify:**
- The Log Food modal component (may be inline in `entries.tsx` or a separate `LogFoodModal.tsx`)

**Components affected:** Log Food modal header

**Complexity:** M

**Dependencies:** T-01, T-03, T-04

**What to do:**

Implement the three-part header pattern on the Log Food modal. See WIREFRAMES.md §7 for the full header anatomy.

**Header structure** (BlurView container):
```
flexDirection: 'row'
justifyContent: 'space-between'
alignItems: 'center'
paddingHorizontal: SCREEN_PADDING_H   ← 16
paddingTop: Platform.OS === 'ios' ? insets.top + 8 : 16
paddingBottom: 12
```

**Three parts:**
1. Left: `Cancel` — Text/Pressable, 13px, COLOR_PRIMARY (#0A84FF), dismisses modal without saving
2. Center: `Log Food` — HEADING (17px/600), TEXT_PRIMARY, `flex: 1`, `textAlign: 'center'`
3. Right: Empty `View` with `width: ~60px` — this is a spacer that keeps the title visually centered

The right spacer width should approximately match the width of the "Cancel" text (measured or estimated at ~55–65px). Use `minWidth: 60` as a reasonable constant.

**BlurView spec for modal header:**
```
tint: 'dark'
intensity: 28
borderRadius: 0              ← flush with modal top edges
borderBottomWidth: 1
borderBottomColor: GLASS_BORDER   ← rgba(255,255,255,0.08)
borderTopColor: GLASS_TOP_HIGHLIGHT_SOFT  ← rgba(255,255,255,0.14)
borderTopWidth: 0.5
```

**Risks:** Low. Visual standardisation. Verify the Cancel button has a sufficiently large touch target (minimum 44px height — use paddingVertical on the Pressable).

---

## E-09 — Edit Entry modal header standardisation

**Files to modify:**
- The Edit Entry modal component (may be inline in `entries.tsx` or a separate `EditEntryModal.tsx`)

**Components affected:** Edit Entry modal header

**Complexity:** M

**Dependencies:** T-01, T-03, T-04, E-08

**What to do:**

Implement the same three-part header pattern on the Edit Entry modal, with the right slot now containing an active `Save` button instead of an empty View.

**Three parts:**
1. Left: `Cancel` — Text/Pressable, 13px, COLOR_PRIMARY (#0A84FF), dismisses without saving
2. Center: `Edit Entry` — HEADING (17px/600), TEXT_PRIMARY, `flex: 1`, `textAlign: 'center'`
3. Right: `Save` — Text/Pressable, 13px/600, COLOR_PRIMARY (#0A84FF)

The `Save` button in the header calls the **same save handler** as any save action in the form body. Both paths must produce identical behavior: save the edited entry and dismiss the modal.

Also add a `Save Changes` button at the bottom of the Edit Entry modal scroll area (above Delete Entry), per WIREFRAMES.md §9 Conflict 5. This resolves the UX gap where macro inputs near the bottom of the modal are far from the only Save action in the header.

Bottom `Save Changes` button style: contained, full-width, `#0A84FF`, `RADIUS_LG: 24`. Same handler as header Save.

**Risks:** Low. The two Save entry points (header + form bottom) must call the same function. Verify both trigger identical save-and-dismiss behavior.

---

## E-10 — Delete Entry → RNP Button mode="text"

**Files to modify:**
- The Edit Entry modal component
- `entries.tsx` if Delete is also triggered from the card list

**Components affected:** Delete Entry action

**Complexity:** S

**Dependencies:** T-01

**What to do:**

Replace the current `TouchableOpacity` + plain `Text` Delete implementation with:
```
<Button
  mode="text"
  textColor={COLOR_ERROR}    ← #FF453A
  onPress={handleDeleteConfirm}
>
  Delete Entry
</Button>
```

The button should have `paddingVertical: 16` for a large touch target (or set via `contentStyle`).

Position: below all form fields in the Edit Entry modal scroll area, below the `Save Changes` button, with `marginTop: SPACE_8` (32px) separation from the Save button to visually separate destructive from constructive.

**Delete confirmation:** Keep the existing confirmation behavior (Alert.alert with "Delete" and "Cancel" options). Do not remove the confirmation step — silent deletion is a data-loss risk.

**Risks:** Low. Functional behavior unchanged.

---

## E-11 — Edit Entry Cancel confirmation dialog

**Files to modify:**
- The Edit Entry modal component

**Components affected:** Cancel button in Edit Entry modal header

**Complexity:** M

**Dependencies:** E-09, T-01

**What to do:**

Per WIREFRAMES.md Challenge D7, the Edit Entry modal should show a confirmation when Cancel is tapped if the user has made changes.

Implementation:
1. On modal open, snapshot the initial values of all fields: `initialValues = useRef({ foodText, calories, protein, carbs, fat, date, time, oilLevel })`
2. On Cancel tap, compare current field values to `initialValues.current`
3. If any value differs, show an Alert:
   ```
   Alert.alert(
     'Discard changes?',
     'Your edits to this entry will be lost.',
     [
       { text: 'Keep Editing', style: 'cancel' },
       { text: 'Discard', style: 'destructive', onPress: dismissModal }
     ]
   )
   ```
4. If no values have changed, dismiss immediately without alert

**Risks:** Low. Standard pattern. Ensure the comparison is value-equality (not reference equality) for string fields.

---

## Phase 5 — Expected Visual Outcome

After Phase 5:
- Log entry cards are solid `#1C1C1E` — no frosted glass, no jank
- Every macro value on every card shows units: `462kcal 76g 8g 12g`
- The day picker at the top of Entries has a frosted glass appearance with a subtle bottom border
- Day pills are squared (radius 10) rather than lozenge-shaped
- The FAB is positioned correctly above the island and does not overlap any card
- Empty states have an icon above the text, plus a contextual CTA
- Both modals have matching three-part glass headers
- Edit Entry has a Save Changes button at the bottom of its scroll area
- Delete Entry is a red text-mode RNP Button
- Cancelling Edit Entry with unsaved changes shows a confirmation alert

---

## Phase 5 — Testing Requirements

1. **Performance** — scroll Entries list with 10+ entries. Confirm no jank. Verify no BlurView on any log card.
2. **Macro units** — all four macro values on every log card include units (`kcal`, `g`)
3. **Day picker** — glass treatment visible, bottom border, pills scroll horizontally
4. **Day pill states** — active (blue fill), inactive (translucent), today-not-active (blue border)
5. **FAB position** — fully visible above island, no overlap with last card
6. **Empty state** — icon renders, CTA text is contextually appropriate
7. **Log Food modal** — glass header with three-part layout; Cancel (left), Log Food (center), spacer (right)
8. **Edit Entry modal** — glass header with Cancel (left), Edit Entry (center), Save (right); Save Changes at form bottom
9. **Header Save vs. body Save** — both call the same handler and produce identical behavior
10. **Delete Entry** — is a red text button with no border; confirmation Alert appears before deletion
11. **Cancel with changes** — Alert appears when any field is modified; no alert when no changes made
12. **Cancel without changes** — modal dismisses immediately, no Alert
13. **Android bottom inset** — FAB is above system gesture bar on Android

---

## Phase 5 — Rollback Strategy

```
git revert redesign/phase-5-entries

Individual task rollbacks:
  E-01: Restore BlurView on log cards (single-file revert in entries.tsx)
  E-02: Remove unit suffixes (string format revert)
  E-08/E-09: Revert modal component files individually
  E-11: Remove the initial values snapshot and Alert logic

E-05 and E-06 depend on B-01/B-07 being in place. If Phase 4 is rolled back,
E-05 and E-06 must also be rolled back or the FAB position formula will use
island constants that are no longer rendered.
```

---

---

# PHASE 6 — SETTINGS SCREEN

**Goal:** Clean up the Settings screen — remove the duplicate page title, recover vertical space, standardise typography, fix input width constraints, and replace the Alert-based save confirmation with an RNP Snackbar.

**Branch name convention:** `redesign/phase-6-settings`

**Prerequisite:** Phase 5 merged and green.

---

## S-01 — Remove duplicate Settings page title

**Files to modify:**
- `app/home/(tabs)/settings.tsx`

**Components affected:** The `<Text>` element rendering "Settings" at 28px at the top of the Settings screen

**Complexity:** S

**Dependencies:** Phase 4 (island showing "Settings" label — must be live before removing screen title)

**What to do:**

Delete the `<Text style={styles.pageTitle}>Settings</Text>` element and its associated style in the Settings screen. Also delete the `pageTitle` style definition in the StyleSheet.

This recovers approximately 48px of vertical space at the top of the screen.

After removing the title, the first visible text on Settings is the section label `DAILY NUTRITION TARGETS`. Add `paddingTop: SPACE_6` (24px) to the ScrollView's `contentContainerStyle` to give the section label breathing room from the status bar / safe area.

**Risks:** Low. Single element removal. Verify the section label is not visually cramped after the title is removed.

---

## S-02 — Settings: section label as first text element

**Files to modify:**
- `app/home/(tabs)/settings.tsx`

**Components affected:** The `DAILY NUTRITION TARGETS` section label

**Complexity:** S

**Dependencies:** S-01, T-01, T-04

**What to do:**

Confirm the section label uses the correct style:
```
fontSize: 13, fontWeight: '500'
color: TEXT_SECONDARY    ← #98989D
textTransform: 'uppercase'
letterSpacing: 0.5
marginBottom: CARD_GAP   ← 8px
```

If the section label currently uses HEADING (17px) or any other style, update it to the caption uppercase pattern above.

Add the hint text directly below the section label (before the card):
```
{ Changes take effect immediately. }
fontSize: 13, fontWeight: '400'
color: TEXT_SECONDARY    ← #98989D
marginBottom: CARD_GAP   ← 8px
```

Verify the ABOUT section label uses the same uppercase caption style.

**Risks:** Low.

---

## S-03 — Settings: input minWidth 80, maxWidth 110

**Files to modify:**
- `app/home/(tabs)/settings.tsx`

**Components affected:** The numeric TextInput elements in each settings row (Calories, Protein, Carbs, Fat)

**Complexity:** S

**Dependencies:** T-01, T-03

**What to do:**

Update each input's width constraint:
```
minWidth: 80
maxWidth: 110
```

Remove any fixed `width` value that may currently clip inputs on small screens.

Additional input style:
```
backgroundColor: BG_ELEVATED   ← #2C2C2E
borderRadius: RADIUS_SM        ← 10
textAlign: 'right'
color: TEXT_PRIMARY
fontSize: 15
fontWeight: '400'
```

The unit label (`kcal`, `g`) positioned to the right of the input:
```
fontSize: 13, fontWeight: '400'
color: TEXT_SECONDARY    ← #98989D
marginLeft: SPACE_2      ← 8px
```

**Risks:** Low. Verify inputs do not expand beyond their maxWidth on iPads or large text size settings.

---

## S-04 — Settings: Save → RNP Snackbar

**Files to modify:**
- `app/home/(tabs)/settings.tsx`

**Components affected:** The save action handler and its success feedback UI

**Complexity:** S

**Dependencies:** T-01

**What to do:**

Replace `Alert.alert('Settings saved', ...)` with `react-native-paper`'s `Snackbar` component.

Pattern:
1. Add a `snackbarVisible` boolean state: `const [snackbarVisible, setSnackbarVisible] = useState(false)`
2. In the save handler, after successfully persisting values, set `setSnackbarVisible(true)`
3. Render an RNP `Snackbar` at the bottom of the Settings screen (or use the Provider's Snackbar portal if configured):
   ```
   <Snackbar
     visible={snackbarVisible}
     onDismiss={() => setSnackbarVisible(false)}
     duration={2000}
     style={{ backgroundColor: BG_SURFACE }}
   >
     Settings saved
   </Snackbar>
   ```

The Snackbar text: `"Settings saved"`. 15px/400, TEXT_PRIMARY. No action button needed.

**Risks:** Low. If `react-native-paper`'s Provider is already wrapping the app (required for RNP components), Snackbar works without additional setup. Verify Provider is in place.

---

## Phase 6 — Expected Visual Outcome

After Phase 6:
- Settings screen opens directly to `DAILY NUTRITION TARGETS` — no "Settings" heading
- The screen has more vertical breathing room — the 48px title space is recovered
- Section labels are small, uppercase, gray — not large headings
- Input fields are appropriately wide (80–110px), right-aligned, with unit labels
- Tapping Save Settings shows a Snackbar notification at the bottom of the screen instead of an Alert dialog

---

## Phase 6 — Testing Requirements

1. **No "Settings" page title** — verify the 28px Text element is gone
2. **Section label** "DAILY NUTRITION TARGETS" is the first text on the screen
3. **Hint text** appears below section label, above the targets card
4. **Input width** — does not clip on iPhone SE (375px). Does not expand too wide on iPad
5. **Unit labels** (`kcal`, `g`) are visible to the right of each input
6. **ABOUT section** — label, rows, and dividers render correctly
7. **Save Snackbar** — appears at the bottom of the screen after tapping Save, auto-dismisses after 2 seconds
8. **Save Snackbar** — does NOT show if save fails (error state remains Alert or inline error)
9. **paddingBottom** — Settings screen ScrollView has 96px bottom padding to clear island

---

## Phase 6 — Rollback Strategy

```
git revert redesign/phase-6-settings

Settings screen changes are fully isolated to settings.tsx.
No other component depends on these changes.
All tasks in Phase 6 can be individually reverted via git diff.

S-01 rollback: restore the pageTitle Text element and its style.
S-04 rollback: restore Alert.alert and remove Snackbar state.
```

---

---

# PHASE 7 — MOTION AND POLISH

**Goal:** Implement motion continuity across the analyze → save → update chain. Add the Save button morph, ring stagger animation, and the progressive disclosure of the Save Entry button. This phase completes the redesign.

**Branch name convention:** `redesign/phase-7-motion`

**Prerequisite:** Phase 6 merged and green.

---

## M-01 — Analyze button: compress + in-place spinner

**Files to modify:**
- `app/home/(tabs)/index.tsx` — the Analyze button and its loading state handler
- The Log Food modal component — same pattern

**Components affected:** The Analyze `Pressable` button and its loading state

**Complexity:** M

**Dependencies:** T-01

**What to do:**

Currently the Analyze button likely disappears or is replaced during loading. It must instead hold its size and show a spinner in place.

**Loading state:**
- Button does NOT resize, hide, or change width
- The button text "Analyze" is replaced by an `ActivityIndicator` (React Native built-in, `color="#FFFFFF"`, `size="small"`) at the same position
- The button background stays `#0A84FF`
- The button is non-interactive during loading (disable `onPress`)

**Press animation:**
```
onPressIn:  scale → 0.97 over 80ms (Animated.timing, Easing.linear)
onPressOut: scale → 1.0 over 120ms (Animated.spring, damping: 18, stiffness: 200)
```

Use `useNativeDriver: true` on the scale transform.

**Loading indicator trigger:** When the Analyze press handler fires (before the API call completes), set a `loading` state to `true`. The spinner replaces the text. When the result is ready (success or error), set `loading` to `false`. The button returns to text.

**Button state machine:**
```
idle:     text "Analyze", enabled, accepts press
pressing: scale 0.97, still text "Analyze"
loading:  spinner, disabled, scale 1.0 (released)
done:     text "Analyze", enabled (result is displayed elsewhere)
```

**Risks:** Low. Isolated to the button component.

---

## M-02 — Save button label morph → "✓ Saved"

**Files to modify:**
- `app/home/(tabs)/index.tsx` — the Save Entry button
- The Log Food modal — same pattern

**Components affected:** Save Entry button

**Complexity:** M

**Dependencies:** M-01, T-01

**What to do:**

When Save Entry is tapped and the save completes successfully:

The button label crossfades from `"Save Entry"` to `"✓ Saved"`:
```
"Save Entry" text: opacity 1 → 0 over 75ms
"✓ Saved" text: opacity 0 → 1 over 75ms, starting at the same time
Total crossfade: 75ms (they overlap — simultaneous)
```

Implementation: use two `Animated.Text` elements absolutely positioned inside the button, one for each label. The crossfade animates their opacities inversely.

The checkmark: Unicode `✓` (U+2713) inline in the string `"✓ Saved"`. Do not use an icon component — text is simpler and animates more predictably with opacity.

**Risks:** Low. If the two-text overlay approach causes layout issues, use a single `Animated.Text` and update its content string after the opacity-out phase completes.

---

## M-03 — Save button colour transition (green tint on confirm)

**Files to modify:**
- `app/home/(tabs)/index.tsx` — Save Entry button style animation

**Components affected:** Save Entry button background and border

**Complexity:** S

**Dependencies:** M-02, T-01

**What to do:**

Simultaneously with the label morph (M-02), transition the button's visual style:

```
backgroundColor: #0A84FF → rgba(48,209,88,0.20)   over 300ms, Easing.out(cubic)
borderColor:     none     → #30D158 (1.5px border)  over 300ms
```

`backgroundColor` interpolation with `Animated.Value`:

Use `interpolate()` on an `Animated.Value` (0 → 1) mapped to the color range. Note: React Native's `Animated.Value.interpolate` supports string color interpolation when `useNativeDriver: false`. Use `useNativeDriver: false` for this specific animation (color transitions are not supported on native driver).

The button height and width must not change during this transition.

**Risks:** Low. `useNativeDriver: false` for color — this is expected and acceptable. The button does not need native driver performance for a 300ms one-shot transition.

---

## M-04 — Save button auto-reset after 1200ms

**Files to modify:**
- `app/home/(tabs)/index.tsx`

**Components affected:** Save Entry button

**Complexity:** S

**Dependencies:** M-02, M-03

**What to do:**

After the "✓ Saved" confirmation state has been held for 1200ms, reset the button to its default state:

```
After 1200ms delay:
  label: "✓ Saved" → "Save Entry" (same 75ms crossfade as M-02, reversed)
  backgroundColor: rgba(48,209,88,0.20) → #0A84FF (200ms, Easing.inOut(ease))
  borderColor: #30D158 → none (200ms)
```

Use `setTimeout(() => resetAnimation(), 1200)` where `resetAnimation` plays the reverse transitions.

Store the timeout ID in a `useRef` and clear it on component unmount to prevent state updates on unmounted components.

The button also resets when the form is reset (e.g., after the entry is saved and the food input is cleared). Fire the reset immediately in that case (no 1200ms wait — the visual context has already changed).

**Risks:** Low. Standard timeout + cleanup pattern.

---

## M-05 — Ring stagger animation on save

**Files to modify:**
- `components/DailyProgress.tsx`
- `app/home/(tabs)/index.tsx` — trigger the ring animation from the Home screen's save handler

**Components affected:** `DailyProgress` ring animation, Home screen save flow

**Complexity:** M

**Dependencies:** D-07, M-02

**What to do:**

Currently (after D-07) the rings animate from previous to new value simultaneously when the macro totals state updates. This phase adds the stagger: Calories ring animates first, then Protein (60ms later), then Carbs (120ms later), then Fat (180ms later).

**Implementation options:**

**Option A (recommended) — delay per ring in DailyProgress:**
Add a `staggerDelay` prop to each ring inside DailyProgress (or hardcode the delays per ring position). When the macro total prop changes, each ring's `Animated.timing` fires with:
```
Calories: delay: 0ms
Protein:  delay: 60ms
Carbs:    delay: 120ms
Fat:      delay: 180ms
```

Each ring still uses `duration: 500ms, Easing.out(Easing.cubic)` per D-07.

**Option B — external trigger:**
DailyProgress exposes a `triggerStaggerAnimation()` ref method. The Home screen's save handler calls it after the save succeeds. Each ring fires sequentially inside DailyProgress using `Animated.sequence` or `Animated.stagger`.

Use Option A — it keeps the animation logic inside DailyProgress where it belongs.

**Trigger timing:** The ring stagger should begin after the Save button has confirmed (`"✓ Saved"` state). In practice: save the entry → update macro totals state → DailyProgress receives new prop → staggered animation fires. The state update timing naturally places this after the button confirmation.

**The stagger makes the update feel considered:** Calories ring fills first (the most important macro), then the others cascade. The sequence communicates that each macro was individually accounted for.

**Risks:** Medium. The stagger requires either a `delay` prop per ring or `Animated.stagger` with an array of animations. `Animated.stagger` is a clean API but requires all animations to be constructed before firing — verify it works correctly when the "previous value" differs per ring (D-07 dependency).

---

## M-06 — Save Entry progressive disclosure

**Files to modify:**
- `app/home/(tabs)/index.tsx`

**Components affected:** Save Entry button, the 50/50 button row

**Complexity:** M

**Dependencies:** A-04 (analysis result animation)

**What to do:**

Per WIREFRAMES.md Challenge D3: the Save Entry button at 50% width is present and disabled when no analysis result exists. This is visual noise.

Implement progressive disclosure:

**State: no analysis result (idle)**
```
Full-width Analyze button:
  ╭─────────────────────────────────────────╮
  │              [ Analyze ]                │
  ╰─────────────────────────────────────────╯
  (flex: 1, full width, #0A84FF)
  Save Entry: NOT rendered (absent, not disabled)
```

**State: analysis result present**
```
50/50 button row:
  ╭────────────────────╮ ╭──────────────────╮
  │    [ Analyze ]     │ │  [ Save Entry ]  │
  ╰────────────────────╯ ╰──────────────────╯
  Save Entry fades in (opacity 0 → 1, 150ms) alongside the Analysis Result card
```

**Transition:** When the analysis result becomes available, simultaneously:
1. Analysis Result card rises (A-04 animation, 220ms)
2. Save Entry button fades in (opacity 0 → 1, 150ms)
3. Analyze button visually narrows (from flex:1 to flex:0.5) — this layout change is instant (no animation needed; the fade-in of Save Entry is the visual transition)

**Implementation:** Conditionally render the Save Entry button based on whether an `analysisResult` state value is non-null. Use the `Animated.Value` opacity fade for its appearance.

After save and form reset, set `analysisResult` to `null` — Save Entry disappears, Analyze returns to full-width. No animation on disappearance (the form reset is already a significant visual change).

**Risks:** Low. Conditional rendering is simpler than a disabled button. The layout shift when Save Entry appears (Analyze button narrows) is mitigated by the simultaneous appearance of the result card drawing the eye downward.

---

## Phase 7 — Expected Visual Outcome

After Phase 7, the full analyze → save flow works as follows:

1. User taps **Analyze** → button compresses (scale 0.97), returns to scale 1.0, spinner appears inside button (button holds its size)
2. ~1–2 seconds later, result ready → Analysis Result card rises from slightly below the button area (220ms), simultaneously the **Save Entry** button fades in to form a 50/50 row
3. User taps **Save Entry** → button compresses → brief spinner → label crossfades from "Save Entry" to "✓ Saved" (75ms), button background transitions to green tint (300ms)
4. After 1200ms → Save button fades back to default Analyze-only layout
5. DailyProgress rings animate to new totals — Calories ring fills first (0ms delay), then Protein (60ms), then Carbs (120ms), then Fat (180ms) — each ring animating over 500ms

The interaction chain communicates causality at every step. No element snaps between states without a transition.

---

## Phase 7 — Testing Requirements

1. **Analyze button** holds its size during loading — does not collapse or disappear
2. **Spinner** appears inside the Analyze button, not adjacent to it
3. **Analysis Result card** rises from below the button row on result — not from the top of screen
4. **Save Entry button** is absent before analysis; fades in alongside the result card
5. **Save button morph** — "Save Entry" crossfades to "✓ Saved", no snap
6. **Green tint transition** — backgroundColor and border transition over 300ms (not instant)
7. **Auto-reset** — Save button returns to default after 1200ms
8. **Ring stagger** — Calories ring visibly starts animating before Protein, Carbs, Fat
9. **Ring stagger** — fires from the correct previous value (not from 0)
10. **Motion timing** — no transition takes longer than its spec value. Test with slow-motion recording on physical device if possible
11. **No snap transitions** — every state change in the button flow has a minimum 75ms opacity transition
12. **Full chain test** — complete the flow (type food → Analyze → Save) three times consecutively. Confirm the button states reset correctly between sessions
13. **Edge case: Analyze while result is visible** — tapping Analyze again with a previous result visible should replace the old result card with the new one (same rise animation)
14. **Edge case: Save during loading** — Save Entry button is absent during analysis (progressive disclosure state: no result yet) — cannot be tapped during loading

---

## Phase 7 — Rollback Strategy

```
git revert redesign/phase-7-motion

Motion changes are cosmetic — reverting restores functional behavior
with the non-animated states from Phase 6.

Individual task rollbacks:
  M-01: Restore original loading state (text disappears during loading)
  M-02/M-03/M-04: Remove the Animated.Value color/label logic; restore
        simple onPress handler with immediate state change
  M-05: Remove stagger delays from ring animation; all rings animate simultaneously
  M-06: Restore the always-visible disabled Save Entry button (50/50 row always shown)

None of these rollbacks break navigation, data, or persistence.
```

---

---

## APPENDIX A — DEPENDENCY GRAPH

```
Phase 1 (Tokens)
  T-01 → T-04 (typography imports colors)
  T-02 (no deps)
  T-03 (no deps)
  T-05 → T-01
  T-06 → T-03
  T-07 (no deps)
  T-08 (no deps)
  T-09 (no deps)
  │
  ▼
Phase 2 (DailyProgress)
  D-01 → T-01, T-04
  D-02 → T-01, T-04, D-01
  D-03 → D-01
  D-04 → T-01, T-04
  D-05 → T-01, T-03, Phase 1
  D-06 → D-05, T-01
  D-07 → D-03, T-04
  │
  ▼
Phase 3 (Analysis Result)
  A-01 → T-01, T-03, Phase 1
  A-02 → A-01, T-01
  A-03 → T-01, T-03, A-01
  A-04 → A-01, T-01
  A-05 → A-01
  │
  ▼
Phase 4 (Tab Bar)
  B-01 → T-01, T-02, T-03, T-04, Phase 1
  B-02 → B-01
  B-03 → B-01
  B-04 → B-01, T-01
  B-05 → B-01
  B-06 → B-01, B-05
  B-07 → B-01
  │
  ▼
Phase 5 (Entries)
  E-01 → T-01
  E-02 → T-01, T-04
  E-03 → T-01, T-03, Phase 1
  E-04 → T-03
  E-05 → B-01, T-01
  E-06 → B-07, E-05
  E-07 → T-01, T-04
  E-08 → T-01, T-03, T-04
  E-09 → T-01, T-03, T-04, E-08
  E-10 → T-01
  E-11 → E-09, T-01
  │
  ▼
Phase 6 (Settings)
  S-01 → Phase 4 (island must be live)
  S-02 → S-01, T-01, T-04
  S-03 → T-01, T-03
  S-04 → T-01
  │
  ▼
Phase 7 (Motion)
  M-01 → T-01
  M-02 → M-01, T-01
  M-03 → M-02, T-01
  M-04 → M-02, M-03
  M-05 → D-07, M-02
  M-06 → A-04
```

---

## APPENDIX B — BLURVIEW BUDGET TRACKER

Maximum 3 simultaneous BlurViews per screen (§23 success criterion).

| Screen | BlurViews | Count | Status |
|--------|-----------|-------|--------|
| Home (idle) | DailyProgress + Island | 2 | ✅ |
| Home (analysis visible) | DailyProgress + AnalysisResult + Island | 3 | ✅ |
| Entries (no modal) | DayPicker + Island | 2 | ✅ |
| Entries (Log Food modal open) | DayPicker + ModalHeader | 2 | ✅ (island should not render behind modal) |
| Entries (Edit Entry modal open) | DayPicker + ModalHeader | 2 | ✅ |
| Settings | Island only | 1 | ✅ |

**Critical:** When a modal opens, the `TabBarIsland` must not render behind it. If the island is mounted on all screens including when a modal is displayed, and the modal is transparent-windowed on Android, the island's BlurView may render simultaneously with the modal header's BlurView. Verify that on Android, the island is either not rendered when a modal is open, or the modal uses `Modal` with `animationType="slide"` which fully covers the screen.

---

## APPENDIX C — ANDROID-SPECIFIC RISKS

| Risk | Affected phases | Mitigation |
|------|-----------------|------------|
| BlurView renders without blur (semi-transparent only) | 2, 3, 4, 5 | `Platform.OS === 'ios' ? <BlurView> : <View bg={BG_GLASS}>` per element |
| Safe area insets = 0 (3-button nav) | 4, 5 | `Math.max(insets.bottom, 16)` floor on all bottom position calculations |
| Keyboard behavior with `behavior="height"` different from iOS | 1, 7 | Test on physical Android device; may need `keyboardVerticalOffset` per modal |
| `Easing.back()` spring overshoot jank | 4 | Reduce `back(1.2)` to `back(1.05)` or switch to cubic if janky |
| Atmospheric glow too bright on LCD screens | 2, 3, 4 | Multiply all glow opacities by 0.70 on Android (platform conditional) |
| `useNativeDriver: false` color animations | 7 | These run on JS thread — acceptable for 300ms one-shot transitions |

---

## APPENDIX D — FILE CREATION CHECKLIST

New files that must be created (do not exist in current project):

| File | Created in Phase | Purpose |
|------|-----------------|---------|
| `constants/colors.ts` | 1 (T-01) | All color tokens |
| `constants/spacing.ts` | 1 (T-02) | All spacing tokens |
| `constants/radius.ts` | 1 (T-03) | Three radius values |
| `constants/typography.ts` | 1 (T-04) | All typography styles |
| `components/TabBarIsland.tsx` | 4 (B-01) | Custom floating tab bar |

---

## APPENDIX E — SUCCESS CRITERIA CROSS-REFERENCE

Cross-reference with DESIGN.md §23 success criteria to confirm coverage:

| Criterion | Task(s) | Phase |
|-----------|---------|-------|
| Border radius: exactly 3 values (10, 16, 24) | T-06 | 1 |
| Gray text values: exactly 2 (#98989D, #636366) | T-05 | 1 |
| No dead code components | T-07 | 1 |
| Every macro value on log card has unit suffix | E-02 | 5 |
| DailyProgress values are dominant typographic element | D-01 | 2 |
| "Settings" appears exactly once | S-01 | 6 |
| Three visual planes perceptible within 300ms | D-05, A-01, B-01 | 2, 3, 4 |
| Every glass surface has atmospheric layer | D-06, A-02, B-04, E-03 | 2, 3, 4, 5 |
| No atmospheric layer opacity > 0.04 | D-06, A-02, B-04 | 2, 3, 4 |
| Island does not touch screen edges (24px margin) | B-01 | 4 |
| Island sits ≥16px above screen floor | B-01 | 4 |
| DailyProgress has four aurora ellipses | D-06 | 2 |
| Analysis Result uses BlurView intensity 24 | A-01 | 3 |
| Active tab indicator is blue capsule | B-03 | 4 |
| Log cards use bg-surface (not BlurView) | E-01 | 5 |
| All glass surfaces have specular highlight | D-05, A-01, B-01, E-03 | 2, 3, 4, 5 |
| All glass surfaces have bottom shadow edge | D-05, A-01, B-01 | 2, 3, 4 |
| Analysis Result materialises with transition | A-04 | 3 |
| Delete action uses red text-mode button | E-10 | 5 |
| Both modals use three-part header | E-08, E-09 | 5 |
| Primary and secondary buttons visually distinct | T-06 (radius unification confirms button stays radius-lg) | 1 |
| Tab icon springs on press | B-05 | 4 |
| Analyze button holds loading state | M-01 | 7 |
| Analysis Result rises from button area | A-04 | 3 |
| Save button morphs to ✓ Saved | M-02 | 7 |
| Save button resets after 1200ms | M-04 | 7 |
| Ring animates from previous value | D-07 | 2 |
| Ring stagger: 60ms between Calories→Protein→Carbs→Fat | M-05 | 7 |
| No element snaps without ≥120ms transition | M-01–M-06 | 7 |
| Island entrance runs once on launch | B-06 | 4 |
| Max 3 BlurViews simultaneously | Appendix B | all |
| No BlurView on log entry cards | E-01 | 5 |
| Atmospheric layers use pointerEvents: none | D-06, A-02, B-04 | 2, 3, 4 |
```
