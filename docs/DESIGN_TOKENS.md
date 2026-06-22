# DESIGN_TOKENS.md — JC Food Tracker
### Source of Truth for All Visual Constants · v1.0

> Extracted from DESIGN.md v1.0.
> Every value in this file is canonical. No token defined here may be overridden in a component's StyleSheet. No value used in a component may exist only in that component's StyleSheet — it must be referenced from this file.
> This document contains no implementation code. Token names use dot notation for namespace clarity. Implementers map these directly to their chosen constant format (TypeScript object, CSS custom properties, etc).

---

## TABLE OF CONTENTS

1. [Color Tokens](#1-color-tokens)
   - 1.1 Background
   - 1.2 Macro (Nutrition)
   - 1.3 Semantic
   - 1.4 Text
   - 1.5 Border
   - 1.6 Interactive States
   - 1.7 Atmospheric Glow
2. [Typography Tokens](#2-typography-tokens)
   - 2.1 Scale
   - 2.2 Weight
   - 2.3 Line Height
   - 2.4 Composed Styles
3. [Spacing Tokens](#3-spacing-tokens)
   - 3.1 Base Scale
   - 3.2 Named Contexts
4. [Radius Tokens](#4-radius-tokens)
5. [Elevation Tokens](#5-elevation-tokens)
   - 5.1 Levels
   - 5.2 Surface Colors per Level
   - 5.3 Shadow (FAB only)
6. [Glass Tokens](#6-glass-tokens)
   - 6.1 Shared Glass Foundation
   - 6.2 Per-Surface Variants
   - 6.3 Glass Constraints
7. [Atmospheric Layer Tokens](#7-atmospheric-layer-tokens)
   - 7.1 Per-Surface Configurations
   - 7.2 Geometry
   - 7.3 Constraints
8. [Motion Tokens](#8-motion-tokens)
   - 8.1 Spring Configs
   - 8.2 Duration
   - 8.3 Easing
   - 8.4 Scale Values
   - 8.5 Translate Values
   - 8.6 Opacity Values
   - 8.7 Delay Values
   - 8.8 Composed Transitions
9. [Component Tokens](#9-component-tokens)
   - 9.1 Buttons
   - 9.2 Inputs
   - 9.3 Cards
   - 9.4 Progress Rings
   - 9.5 Chips (Macro Display)
   - 9.6 Meal Chips
   - 9.7 Tab Bar Island
   - 9.8 FAB
   - 9.9 Entry Cards
   - 9.10 Modal Headers
   - 9.11 Settings Rows
   - 9.12 Day Picker Pills
10. [Layout Tokens](#10-layout-tokens)
11. [Constraint Tokens](#11-constraint-tokens)
12. [Token Index](#12-token-index)

---

## HOW TO READ THIS DOCUMENT

**Token name format:** `namespace.sub-namespace.variant`
**Value:** The raw value — hex, rgba, px integer, ms integer, or unitless number
**Usage:** Where and only where this token is applied
**Rule:** A constraint or prohibition that applies to this token

Tokens marked **IMMUTABLE** must not be adjusted per-component. Tokens marked **PLATFORM** have platform-specific variants.

---

---

## 1. COLOR TOKENS

### 1.1 Background

These four values form the complete background hierarchy. They must never be mixed in order (never place a darker level on top of a lighter one).

```
colors.background.base
  value:   #0C0C0E
  usage:   All screen backgrounds, modal content areas
  rule:    The darkest surface. Nothing sits on top of this without a Level 1+ surface.

colors.background.surface
  value:   #1C1C1E
  usage:   Cards, log entry rows, input backgrounds, settings card rows
  rule:    Content plane. Use for non-floating elements. Never use BlurView here.

colors.background.elevated
  value:   #2C2C2E
  usage:   Settings input fields, secondary inputs, chip backgrounds, macro edit inputs
  rule:    Secondary elevated input surface only. Not for cards or headers.

colors.background.glass
  value:   rgba(28,28,30,0.72)
  usage:   BlurView backgroundColor on all glass surfaces (always paired with BlurView — never used alone)
  rule:    Only valid as the backgroundColor of a BlurView. Using this value on a plain View is forbidden.
```

---

### 1.2 Macro (Nutrition)

These four colors are the visual identity of the app. They are the only colors permitted to communicate macro nutrient data. No token may be reassigned — each maps to exactly one nutrient, forever.

```
colors.macro.calories
  value:   #0A84FF
  usage:   Calories value text, ring fill, progress arc, macro chip, active primary button
  rule:    The only blue permitted in the app. Exception: primary buttons use this color
           because the primary action (Analyze) is directly about calorie tracking.

colors.macro.protein
  value:   #30D158
  usage:   Protein value text, ring fill, progress arc, macro chip
  rule:    Also aliased as colors.semantic.success — intentional. Never use for
           non-nutrition success states on screens unrelated to protein tracking.

colors.macro.carbs
  value:   #5AC8FA
  usage:   Carbs value text, ring fill, progress arc, macro chip
  rule:    Cyan. Distinct from the blue of calories. Never use for links or info states.

colors.macro.fat
  value:   #FF9F0A
  usage:   Fat value text, ring fill, progress arc, macro chip
  rule:    Amber. Never use for warnings — this is nutrition data, not a status color.
```

**Derived macro values** — generated at runtime, not stored as tokens:

```
colors.macro.calories.track
  value:   #0A84FF + '20' suffix   →   #0A84FF20
  usage:   Progress ring background track (8% opacity of macro color)
  rule:    Always generated as: macroColor + '20'. Never hardcode as a separate rgba.

colors.macro.protein.track     →   #30D15820
colors.macro.carbs.track       →   #5AC8FA20
colors.macro.fat.track         →   #FF9F0A20

colors.macro.calories.chip-bg
  value:   rgba(10,132,255,0.08)   [or #0A84FF + '15']
  usage:   Macro chip background fill
  rule:    Generated as: macroColor at 8% opacity.

colors.macro.protein.chip-bg   →   rgba(48,209,88,0.08)
colors.macro.carbs.chip-bg     →   rgba(90,200,250,0.08)
colors.macro.fat.chip-bg       →   rgba(255,159,10,0.08)
```

---

### 1.3 Semantic

Action and status colors that communicate meaning independent of nutrition context.

```
colors.semantic.primary
  value:   #0A84FF
  usage:   Primary contained buttons (Analyze, Save Settings), active tab indicator
  rule:    Same hex as colors.macro.calories. Shared intentionally.
           Use colors.semantic.primary for interactive elements,
           colors.macro.calories for nutrition data. Context distinguishes them.

colors.semantic.error
  value:   #FF453A
  usage:   Delete actions, error states, validation failure indicators
  rule:    Used only for text (mode="text" button or error label). Never as button fill.

colors.semantic.success
  value:   #30D158
  usage:   Save confirmation state (Save button → "✓ Saved"), positive feedback
  rule:    Same hex as colors.macro.protein. Shared intentionally.
           Success states use this only in contexts directly about saving food data.

colors.semantic.success.tint
  value:   rgba(48,209,88,0.20)
  usage:   Save button background during "✓ Saved" confirmation state
  rule:    Used only during the 1200ms save confirmation window. Not a permanent color.

colors.semantic.success.border
  value:   #30D158
  usage:   Save button border during "✓ Saved" confirmation state (1.5px width)
  rule:    Appears only during save confirmation. Width is fixed at 1.5px.
```

---

### 1.4 Text

Exactly three text colors. No other color values are permitted for text.

```
colors.text.primary
  value:   #FFFFFF
  usage:   All primary content — food names, values, settings labels, button text,
           modal titles, input text
  rule:    Default for all legible text. Never use off-white or near-white variants.

colors.text.secondary
  value:   #98989D
  usage:   Labels below ring values, timestamps, section headers (uppercase),
           hint text, unit labels, modal action button text
  rule:    Replaces the retired #8E8E93. That value must not appear anywhere.

colors.text.disabled
  value:   #636366
  usage:   Placeholder text, inactive tab labels, oil slider tick labels (non-active),
           empty state body text, remaining budget sub-label in rings
  rule:    The quietest text. Used only for information that is genuinely secondary.
           Never use for interactive elements in their enabled state.

RETIRED (do not use):
  #8E8E93   →   replaced by colors.text.secondary (#98989D) everywhere
```

---

### 1.5 Border

```
colors.border.default
  value:   rgba(84,84,88,0.65)
  usage:   Input outlines, dividers between settings rows, meal chip borders (inactive)
  rule:    Standard interactive border. Not for glass edges.

colors.border.subtle
  value:   rgba(255,255,255,0.08)
  usage:   Card outer borders, glass surface edges (all sides), day picker bottom border,
           modal header bottom border, dividers inside Analysis Result card
  rule:    The lightest visible border. Reads as structure without adding weight.
```

---

### 1.6 Interactive States

Computed overlay values for button and pill states. Never used for text or structure.

```
colors.interactive.primary-fill
  value:   #0A84FF
  usage:   Primary contained button background (default state)

colors.interactive.outlined-fill
  value:   rgba(10,132,255,0.08)
  usage:   Outlined button background fill (secondary button default state)

colors.interactive.active-pill
  value:   rgba(10,132,255,0.15)
  usage:   Active indicator capsule background inside tab bar island
  rule:    Used only inside the island — not for selected states anywhere else.

colors.interactive.meal-chip-active-fill
  value:   rgba(10,132,255,0.15)
  usage:   Meal chip (Breakfast/Lunch/etc.) selected state background
  note:    Same value as active-pill — these are parallel selection states.
```

---

### 1.7 Atmospheric Glow

Used exclusively as `backgroundColor` on absolutely-positioned atmospheric ellipse Views. Never for text, borders, buttons, or any interactive element. Always paired with a glass (BlurView) surface above them.

```
colors.glow.aurora.calories
  value:   rgba(10,132,255,0.025)
  usage:   DailyProgress aurora — Ellipse 1 (upper-left, calories quadrant)
           Also used as the single atmospheric ellipse behind the Analysis Result card
  rule:    Maximum single-layer opacity. Do not exceed 0.025 on any single ellipse.

colors.glow.aurora.protein
  value:   rgba(48,209,88,0.02)
  usage:   DailyProgress aurora — Ellipse 2 (upper-right, protein quadrant)

colors.glow.aurora.carbs
  value:   rgba(90,200,250,0.02)
  usage:   DailyProgress aurora — Ellipse 3 (lower-left, carbs quadrant)

colors.glow.aurora.fat
  value:   rgba(255,159,10,0.02)
  usage:   DailyProgress aurora — Ellipse 4 (lower-right, fat quadrant)

colors.glow.island
  value:   rgba(10,132,255,0.02)
  usage:   Tab bar island underlight — elongated horizontal ellipse beneath the island
  rule:    Never exceed 0.02. The island glow is the most risk-prone for over-visibility.

colors.glow.day-picker
  value:   rgba(255,255,255,0.015)
  usage:   Day picker glass underlight — neutral, no color tint
  rule:    Neutral because the day picker has no dominant macro association.

ATMOSPHERIC OPACITY HARD LIMITS:
  Maximum per single ellipse:    0.04
  Recommended per single ellipse: 0.02 – 0.025
  Android reduction:             multiply all glow opacities × 0.70

ENFORCEMENT RULE:
  If you can identify the color of a glow without consciously looking for it
  on a physical device, reduce that ellipse's opacity by 50%.
  Glows must be subliminal — the last thing noticed, not the first.
```

---

---

## 2. TYPOGRAPHY TOKENS

The system font stack is used throughout (San Francisco on iOS, Roboto on Android). No custom typeface.

### 2.1 Scale (Font Sizes)

```
typography.size.display      34
typography.size.title-large  22
typography.size.title        20
typography.size.heading      17
typography.size.body         15
typography.size.body-emphasis 15    ← same size as body, different weight
typography.size.caption      13
typography.size.caption-small 11
typography.size.ring-value   18
typography.size.ring-label   11
typography.size.macro-large  24
typography.size.macro-chip-value 14
typography.size.macro-chip-label 11
```

---

### 2.2 Weight

```
typography.weight.extra-bold   800    ← display only
typography.weight.bold         700    ← values, ring values, macro numbers
typography.weight.semi-bold    600    ← body-emphasis, headings, button text, labels
typography.weight.medium       500    ← caption, ring labels, secondary labels
typography.weight.regular      400    ← body text, food descriptions, hint text
```

---

### 2.3 Line Height

```
typography.line-height.display       40
typography.line-height.title-large   28
typography.line-height.title         26
typography.line-height.heading       22
typography.line-height.body          20
typography.line-height.caption       18
typography.line-height.caption-small 14
typography.line-height.ring-value    22
typography.line-height.ring-label    14
typography.line-height.macro-large   28
```

---

### 2.4 Composed Styles

Each composed style is the complete set of typographic properties for a named role. Apply these as a unit — never mix properties from different composed styles.

```
typography.style.display
  size:        typography.size.display         34
  weight:      typography.weight.extra-bold    800
  lineHeight:  typography.line-height.display  40
  color:       colors.text.primary
  usage:       Not currently used. Reserved for onboarding hero number.

typography.style.title-large
  size:        typography.size.title-large       22
  weight:      typography.weight.bold            700
  lineHeight:  typography.line-height.title-large 28
  color:       colors.text.primary
  usage:       "Today" heading in DailyProgress card

typography.style.title
  size:        typography.size.title       20
  weight:      typography.weight.bold      700
  lineHeight:  typography.line-height.title 26
  color:       colors.text.primary
  usage:       Section headers — "Analysis Result", "Food Items"

typography.style.heading
  size:        typography.size.heading       17
  weight:      typography.weight.semi-bold   600
  lineHeight:  typography.line-height.heading 22
  color:       colors.text.primary
  usage:       Modal titles ("Log Food", "Edit Entry")
  rule:        Modal titles are always 17px/600, never 20px.

typography.style.body
  size:        typography.size.body       15
  weight:      typography.weight.regular  400
  lineHeight:  typography.line-height.body 20
  color:       colors.text.primary
  usage:       Food description text, settings row labels, input text

typography.style.body-emphasis
  size:        typography.size.body-emphasis  15
  weight:      typography.weight.semi-bold    600
  lineHeight:  typography.line-height.body    20
  color:       colors.text.primary
  usage:       Input labels ("What did you eat?", "Oil Level"),
               oil slider header, button text
  rule:        Button text is always 15px/600. Not 16px. Not 14px.

typography.style.caption
  size:        typography.size.caption        13
  weight:      typography.weight.medium        500
  lineHeight:  typography.line-height.caption  18
  color:       colors.text.secondary
  usage:       Timestamps on log cards, section group labels (uppercase),
               log card meta text, date in DailyProgress header
  rule:        Section labels use uppercase + letterSpacing: 0.5

typography.style.caption-small
  size:        typography.size.caption-small        11
  weight:      typography.weight.semi-bold           600
  lineHeight:  typography.line-height.caption-small  14
  color:       colors.text.disabled
  usage:       Tab bar labels, oil slider tick labels, nutrient chip labels
  rule:        Active tab label and active tick label use colors.macro.calories instead
               of colors.text.disabled.

typography.style.ring-value
  size:        typography.size.ring-value       18
  weight:      typography.weight.bold           700
  lineHeight:  typography.line-height.ring-value 22
  color:       [per-macro color]                ← set dynamically
  usage:       Current value shown below/inside each progress ring
  rule:        Values are always larger than their labels. This is the dominant
               typographic element in DailyProgress.

typography.style.ring-label
  size:        typography.size.ring-label        11
  weight:      typography.weight.medium           500
  lineHeight:  typography.line-height.ring-label  14
  color:       colors.text.secondary
  usage:       Label below ring value ("Cal", "Pro", "Crb", "Fat")

typography.style.ring-remaining
  size:        typography.size.ring-label        11
  weight:      typography.weight.regular          400
  lineHeight:  typography.line-height.ring-label  14
  color:       colors.text.disabled
  usage:       Remaining budget sub-label below ring label ("798↓")

typography.style.macro-large
  size:        typography.size.macro-large       24
  weight:      typography.weight.bold            700
  lineHeight:  typography.line-height.macro-large 28
  color:       [per-macro color]
  usage:       Large macro display in modal analysis result (if used)

typography.style.macro-chip-value
  size:        typography.size.macro-chip-value  14
  weight:      typography.weight.bold            700
  color:       [per-macro color]
  usage:       Value inside a macro chip ("462", "76")

typography.style.macro-chip-label
  size:        typography.size.macro-chip-label  11
  weight:      typography.weight.semi-bold        600
  color:       [per-macro color] at 0.80 opacity
  usage:       Label inside a macro chip ("kcal", "g")

typography.style.section-label
  base:        typography.style.caption
  transform:   uppercase
  letterSpacing: 0.5
  usage:       "DAILY NUTRITION TARGETS", "ABOUT", "MACROS", "MEAL"
  rule:        Only for section grouping labels. Never for content text.
```

**Typography invariants:**

```
RULE: Values are always larger than their labels.
  ring-value (18px) > ring-label (11px)         ← enforced
  macro-chip-value (14px) > macro-chip-label (11px)  ← enforced
  body (15px) > caption-small (11px)            ← enforced

RULE: Button text is always typography.style.body-emphasis (15px/600).
  No exceptions. Not 16px. Not 14px.

RULE: Modal titles are always typography.style.heading (17px/600).
  Not 20px. Modals are contextual overlays, not primary screens.

RULE: #8E8E93 is retired. Any occurrence in the codebase is a bug.
```

---

---

## 3. SPACING TOKENS

All spacing is a multiple of 4px. Non-multiple values (6px, 10px, 14px) are bugs.

### 3.1 Base Scale

```
spacing.1     4px    micro — label-to-value gaps, icon margins, chip internal gaps
spacing.2     8px    chip padding (vertical), gap between chips, inner row gaps,
                     gap between cards in a list, section label marginBottom
spacing.3     12px   card inner padding (compact), input bottom margin, button gap row
spacing.4     16px   standard horizontal screen padding (both sides),
                     modal header horizontal padding, card inner padding (default)
spacing.5     20px   card inner padding (standard — DailyProgress),
                     button row paddingTop, section-to-section spacing
spacing.6     24px   between major sections on a screen (DailyProgress → FoodEntry)
spacing.8     32px   between DailyProgress and food entry, macro grid row gap
spacing.12    48px   modal bottom padding, settings row paddingVertical (× 3.5)
spacing.16    64px   empty state vertical padding (top + bottom)
spacing.24    96px   bottom scroll padding (Home, Settings) — clears tab bar island
```

---

### 3.2 Named Contexts

Semantic aliases for specific layout situations. These reference the base scale but communicate intent.

```
spacing.screen.padding-h            spacing.4       16px
  usage:   Horizontal padding on all screens, applied to both left and right

spacing.screen.bottom-home          spacing.24      96px
  usage:   ScrollView paddingBottom on Home and Settings screens

spacing.screen.bottom-entries       160px           ← not a base scale multiple
  usage:   ScrollView paddingBottom on Entries screen (accounts for FAB above island)
  note:    Computed: island(64) + island-gap-above(16) + FAB(56) + FAB-gap(16) + buffer(8)

spacing.card.padding                spacing.4       16px
  usage:   Internal padding of standard cards

spacing.card.padding-progress       spacing.5       20px
  usage:   Internal padding of DailyProgress glass card

spacing.card.gap                    spacing.2       8px
  usage:   Gap between cards in a vertical list

spacing.card.entry-padding          14px            ← not a base scale multiple
  usage:   Internal padding of log entry cards (slightly compact for density)
  note:    This value is the only intentional non-4px spacing. Justified by the density
           requirement: 3–5 entries visible simultaneously at this padding.

spacing.chip.gap                    spacing.2       8px
  usage:   Gap between macro chips in a row

spacing.chip.padding-h              10px            ← not a base scale multiple
  usage:   Horizontal padding inside a macro chip
  note:    Non-4px value justified by chip's small size requiring tighter fit.

spacing.chip.padding-v              5px             ← not a base scale multiple
  usage:   Vertical padding inside a macro chip

spacing.button.gap                  spacing.3       12px
  usage:   Gap between primary and secondary button in a row

spacing.button.padding-v            6px             ← via RNP contentStyle
  usage:   Vertical padding inside buttons (achieves ~48px total height)

spacing.section.label-gap           spacing.2       8px
  usage:   marginBottom below section labels before their card

spacing.modal.header-padding-bottom spacing.3       12px
  usage:   paddingBottom on modal glass header

spacing.modal.bottom-padding        spacing.12      48px
  usage:   paddingBottom at the bottom of modal scroll content

spacing.settings.row-padding-v      14px            ← not a base scale multiple
  usage:   paddingVertical on settings rows

spacing.island.margin-h             24px            ← not a base scale multiple
  usage:   Left and right margin from screen edge to island (no token multiple — exact)

spacing.island.gap-bottom           spacing.4       16px
  usage:   Gap between island bottom and safe area floor

spacing.island.glow-inset          40px
  usage:   left/right inset of atmospheric glow ellipse relative to island container

spacing.fab.size                    56px
  usage:   Width and height of FAB

spacing.fab.gap-above-island        spacing.4       16px
  usage:   Gap between FAB bottom and island top
```

---

---

## 4. RADIUS TOKENS

Exactly three values. No other border radius values are permitted anywhere in the codebase.

```
radius.sm     10px
  usage:   Chips (macro chips, meal chips, raw/cooked toggle, nutrient chips),
           TextInput outlines, day picker pills, settings input fields,
           FoodItemCard translucent inner surface, macro edit inputs

radius.md     16px
  usage:   Cards (log cards, DailyProgress, FoodItemCard, AnalysisResultCard,
           settings card), modal containers
  also:    theme.roundness in react-native-paper PaperProvider

radius.lg     24px
  usage:   Buttons (all — Analyze, Save Entry, Save Settings),
           FAB, tab bar island

SPECIAL:
radius.active-pill    12px
  usage:   Active indicator capsule inside tab bar island ONLY
  rule:    This value does not appear in the three-token system.
           It is used only for the island's internal UI — not for any exposed surface.

radius.atmospheric    9999px
  usage:   All atmospheric ellipse Views (makes them fully elliptical)
  rule:    Always use 9999 (or equivalent large value) for atmospheric layers.
           Do not use 50% — behavior differs per platform on non-square Views.

REMOVED values (any occurrence is a bug):
  8px   →   radius.sm (10)
  12px  →   radius.sm (10)
  14px  →   radius.md (16)   [was theme.roundness]
  20px  →   radius.sm (10)   [was day pills]
  28px  →   radius.lg (24)   [was FAB]
```

---

---

## 5. ELEVATION TOKENS

Five levels plus one special atmospheric level. Level determines visual treatment, not z-index alone.

### 5.1 Levels

```
elevation.level.-1   Atmospheric
  treatment:   Absolutely-positioned elliptical View with low-opacity macro color
  zIndex:      Below its paired glass surface; above base
  rule:        Every Level 2 and Level 3 element MUST have a corresponding Level −1
               atmospheric layer. A glass surface without its atmospheric layer is incomplete.

elevation.level.0    Base
  treatment:   No visual treatment. colors.background.base background.
  elements:    Screen backgrounds, modal content areas
  rule:        Never place any element directly on Base without a Level 1 surface beneath it.

elevation.level.1    Raised
  treatment:   colors.background.surface, colors.border.subtle border
  elements:    Cards, log entry cards, FoodItemCard, settings card, input fields
  rule:        Content plane. Do not use BlurView here. No shadows.

elevation.level.2    Floating (Glass)
  treatment:   BlurView + colors.background.glass + specular top + bottom shadow
  elements:    DailyProgress, Analysis Result card, day picker, modal headers
  rule:        Glass only for genuinely floating surfaces. Intensity: 24–28.

elevation.level.3    Island (Glass — Detached)
  treatment:   Same as Level 2 but stronger intensity, detached from screen edges
  elements:    Tab bar island ONLY
  rule:        Strongest blur (intensity: 36). Does not touch left/right screen edges.

elevation.level.4    Overlay
  treatment:   System modal presentation over base background
  elements:    Log Food modal, Edit Entry modal
  rule:        Full-screen overlays. Modal content area uses base background.
```

---

### 5.2 Surface Colors per Level

```
elevation.surface.-1   [atmospheric color — per element, see §7]
elevation.surface.0    colors.background.base         #0C0C0E
elevation.surface.1    colors.background.surface      #1C1C1E
elevation.surface.2    colors.background.glass        rgba(28,28,30,0.72) + blur
elevation.surface.3    rgba(28,28,30,0.80) + blur     ← island is more opaque
elevation.surface.4    colors.background.base         #0C0C0E
```

---

### 5.3 Shadow (FAB only)

Drop shadows are used on exactly one element: the FAB. All other elements use elevation through color contrast and blur alone.

```
elevation.shadow.fab.color          colors.macro.calories    #0A84FF
elevation.shadow.fab.offset-x       0
elevation.shadow.fab.offset-y       4
elevation.shadow.fab.opacity        0.35
elevation.shadow.fab.radius         12
elevation.shadow.fab.android-elevation   8
```

---

---

## 6. GLASS TOKENS

All glass surfaces share a foundation specification. Per-surface variants override only the values that differ.

### 6.1 Shared Glass Foundation

```
glass.blur.tint                  dark
glass.border.all                 colors.border.subtle        rgba(255,255,255,0.08)
glass.border.width               1
glass.border.top-color.default   rgba(255,255,255,0.16)
glass.border.top-width           0.5
glass.border.bottom-color.default  rgba(0,0,0,0.30)
glass.border.bottom-width        0.5
glass.overflow                   hidden
```

---

### 6.2 Per-Surface Variants

Each glass surface overrides exactly the values listed. Everything not listed inherits from §6.1.

**DailyProgress (primary glass)**
```
glass.daily-progress.blur-intensity          28
glass.daily-progress.background-color        colors.background.glass   rgba(28,28,30,0.72)
glass.daily-progress.border-radius           radius.md                 16
glass.daily-progress.border-top-color        rgba(255,255,255,0.16)    ← foundation default
glass.daily-progress.border-bottom-color     rgba(0,0,0,0.30)          ← foundation default
glass.daily-progress.padding                 spacing.card.padding-progress   20
glass.daily-progress.margin-h                spacing.screen.padding-h        16
glass.daily-progress.margin-top              spacing.2                        8
```

**Analysis Result (secondary glass)**
```
glass.analysis-result.blur-intensity         24                        ← less than daily-progress
glass.analysis-result.background-color       colors.background.glass   rgba(28,28,30,0.72)
glass.analysis-result.border-radius          radius.md                 16
glass.analysis-result.border-top-color       rgba(255,255,255,0.14)    ← softer than daily-progress
glass.analysis-result.border-bottom-color    rgba(0,0,0,0.25)          ← softer than daily-progress
glass.analysis-result.padding                spacing.card.padding      16
glass.analysis-result.margin-h               spacing.screen.padding-h  16
glass.analysis-result.margin-top             spacing.4                 16
```

**Tab Bar Island**
```
glass.island.blur-intensity                  36                        ← strongest
glass.island.background-color               rgba(28,28,30,0.80)       ← more opaque than cards
glass.island.border-radius                  radius.lg                  24
glass.island.border-color                   rgba(255,255,255,0.10)    ← slightly stronger all-side border
glass.island.border-top-color              rgba(255,255,255,0.22)    ← strongest specular
glass.island.border-bottom-color           rgba(0,0,0,0.50)          ← deepest shadow edge
glass.island.height                         64
glass.island.left                           spacing.island.margin-h   24
glass.island.right                          spacing.island.margin-h   24
glass.island.bottom                         spacing.island.gap-bottom + insets.bottom
```

**Day Picker**
```
glass.day-picker.blur-intensity              28
glass.day-picker.background-color           colors.background.glass
glass.day-picker.border-radius              0                          ← full-width strip, no corners
glass.day-picker.border-top-color           rgba(255,255,255,0.14)
glass.day-picker.border-bottom-color        rgba(0,0,0,0.08)          ← very subtle
glass.day-picker.border-bottom-only         true                       ← only bottom border visible
glass.day-picker.padding-v                  10
glass.day-picker.padding-h                  spacing.screen.padding-h  16
```

**Modal Headers**
```
glass.modal-header.blur-intensity            28
glass.modal-header.background-color         colors.background.glass
glass.modal-header.border-radius            0                          ← flush with modal edges
glass.modal-header.border-top-color         rgba(255,255,255,0.14)
glass.modal-header.border-bottom-width      1
glass.modal-header.border-bottom-color      colors.border.subtle       rgba(255,255,255,0.08)
glass.modal-header.padding-h                spacing.screen.padding-h   16
glass.modal-header.padding-top-ios          insets.top + 8             ← platform-specific
glass.modal-header.padding-top-android      spacing.4                  16
glass.modal-header.padding-bottom           spacing.modal.header-padding-bottom   12
glass.modal-header.atmospheric-layer        none                       ← no atmospheric layer
                                                                          on modal headers
```

---

### 6.3 Glass Constraints

```
PERMITTED glass surfaces (exactly 5):
  1. DailyProgress card
  2. Analysis Result card
  3. Tab bar island
  4. Day picker header (Entries screen)
  5. Modal headers (Log Food, Edit Entry)

FORBIDDEN glass surfaces:
  Log entry cards        → use elevation.level.1 (colors.background.surface)
  FoodItemCard           → use elevation.level.1
  Settings rows          → use elevation.level.1
  Buttons                → no surface treatment
  Input fields           → use colors.background.elevated
  Modal content areas    → use colors.background.base

SIMULTANEOUS BLURVIEW BUDGET:
  Maximum 3 BlurViews visible at any one time on any screen.
  Permitted combinations:
    Home (idle):             DailyProgress + Island = 2
    Home (result visible):   DailyProgress + AnalysisResult + Island = 3
    Entries:                 DayPicker + Island = 2
    Entries (modal open):    DayPicker + ModalHeader = 2  [island hidden behind modal]
    Settings:                Island = 1
  VIOLATION: Any screen rendering 4+ simultaneous BlurViews is a performance bug.
```

---

---

## 7. ATMOSPHERIC LAYER TOKENS

Every Level 2 and Level 3 glass surface has exactly one atmospheric layer (or four for DailyProgress). These layers are the mechanism that makes glass surfaces read as physically elevated.

### 7.1 Per-Surface Configurations

**DailyProgress Aurora (4 ellipses)**

```
atmospheric.daily-progress.ellipse-1
  color:       colors.glow.aurora.calories   rgba(10,132,255,0.025)
  width:       80%
  height:      80px
  top:         -20px
  left:        -5%
  quadrant:    upper-left (calories)

atmospheric.daily-progress.ellipse-2
  color:       colors.glow.aurora.protein    rgba(48,209,88,0.02)
  width:       65%
  height:      60px
  top:         -10px
  right:       -5%
  quadrant:    upper-right (protein)

atmospheric.daily-progress.ellipse-3
  color:       colors.glow.aurora.carbs      rgba(90,200,250,0.02)
  width:       60%
  height:      55px
  bottom:      -15px
  left:        -5%
  quadrant:    lower-left (carbs)

atmospheric.daily-progress.ellipse-4
  color:       colors.glow.aurora.fat        rgba(255,159,10,0.02)
  width:       50%
  height:      50px
  bottom:      -20px
  right:       0
  quadrant:    lower-right (fat)
```

**Analysis Result Card (1 ellipse)**

```
atmospheric.analysis-result.ellipse-1
  color:       colors.glow.aurora.calories   rgba(10,132,255,0.025)
  width:       120%
  height:      130%
  left:        -10%
  top:         -15%
  note:        Oversized relative to card — bleeds above and below glass edges
  note:        Fixed blue regardless of which macro dominates result
```

**Tab Bar Island (1 ellipse — elongated horizontal)**

```
atmospheric.island.ellipse-1
  color:       colors.glow.island            rgba(10,132,255,0.02)
  height:      20px                          ← flat, wide ellipse
  bottom:      -8px                          ← below island bottom edge
  left:        spacing.island.glow-inset     40px
  right:       spacing.island.glow-inset     40px
  note:        Narrower than island — creates centred falloff glow
  note:        Simulates the island casting light downward onto the screen
```

**Day Picker (1 ellipse — full-width)**

```
atmospheric.day-picker.ellipse-1
  color:       colors.glow.day-picker        rgba(255,255,255,0.015)
  width:       100%
  height:      200%
  top:         -50%
  note:        No border radius — full-width neutral haze
  note:        Neutral (white) because no macro association
```

**Modal Headers**

```
atmospheric.modal-header      none
  reason:   Modal headers sit above an opaque bg-base content area.
            There is no content below the header that benefits from perceived
            depth separation. Atmospheric backlighting has no meaningful target.
```

---

### 7.2 Geometry

All atmospheric layers share these layout properties:

```
atmospheric.geometry.position              absolute
atmospheric.geometry.border-radius         radius.atmospheric    9999px
atmospheric.geometry.pointer-events        none      ← REQUIRED — must never intercept touches
atmospheric.geometry.z-index               below paired glass surface
atmospheric.geometry.render-order         before (behind) the BlurView in JSX
```

---

### 7.3 Constraints

```
HARD LIMITS:
  Maximum opacity per single ellipse:   0.04
  Recommended max per ellipse:          0.025
  DailyProgress total (4 ellipses):     cumulative perceived ~0.08 — still subliminal
                                        due to different quadrant positions and colors

ANDROID ADJUSTMENT:
  Multiply all glow opacities × 0.70 on Android if BlurView renders at full intensity.
  Reason: blur lifts perceived brightness of anything behind it on Android.

SUBLIMINAL TEST:
  If any glow color is identifiable without consciously looking for it → reduce by 50%.
  The glow must be noticed only when the user looks for it, never first.

FORBIDDEN:
  Atmospheric layer without a paired glass (BlurView) surface above it.
  A glow with no glass surface to float above has no spatial meaning.
```

---

---

## 8. MOTION TOKENS

All motion serves continuity — elements transform between states, they do not appear and disappear. Every token in this section represents a decision about perceived causality.

### 8.1 Spring Configs

Named spring presets. Each is a complete set of damping/stiffness/mass values.

```
motion.spring.default
  damping:    18
  stiffness:  200
  mass:       0.8
  usage:      Standard element response to interaction (button release)
  character:  Snappy, slightly springy, not bouncy

motion.spring.tab-icon
  damping:    20
  stiffness:  300
  mass:       1.0 (implicit)
  usage:      Tab bar icon press-and-release animation
  character:  Faster and tighter than default — physical, pressable feel

motion.spring.island-entrance
  type:       Easing.out(back(1.2))    ← not a true spring — uses back easing
  usage:      Island entrance on app launch only
  character:  Slight overshoot then settle — premium physical feel
  fallback:   Easing.out(cubic) if back easing produces jank on Android
```

---

### 8.2 Duration

All durations in milliseconds.

```
motion.duration.instant                  0ms
  usage:   Tab icon compress on press (immediate response)

motion.duration.micro                    75ms
  usage:   Save button label crossfade (50% of each leg)

motion.duration.xfast                    80ms
  usage:   Button compress on press (Analyze, Save buttons)

motion.duration.fast                     120ms
  usage:   Button release (return to scale 1.0), active indicator fade out

motion.duration.snappy                   150ms
  usage:   Save label morph total duration, loading state opacity fade

motion.duration.standard                 180ms
  usage:   Tab icon spring release total (~180ms)

motion.duration.card-appear              220ms
  usage:   Analysis Result card entrance (opacity + translateY)

motion.duration.color-transition         300ms
  usage:   Save button background/border color change to green tint

motion.duration.island-entrance          400ms
  usage:   Island entrance translateY + opacity on app launch

motion.duration.ring                     500ms
  usage:   Each progress ring animation (strokeDashoffset)

motion.duration.save-confirm-hold        1200ms
  usage:   Duration "✓ Saved" state is held before button resets

motion.duration.save-button-reset        200ms
  usage:   Save button fade back to default after confirmation

motion.duration.min-state-change         120ms
  usage:   Minimum duration for any state change. No element may snap
           between states without at least a 120ms opacity transition.
           EXCEPTION: validation failures (instant red border — direct response)
```

---

### 8.3 Easing

Named easing functions. These reference standard React Native Animated.Easing values.

```
motion.easing.linear
  value:   Easing.linear
  usage:   Button compress on press (immediate, perceptible directness)

motion.easing.out-cubic
  value:   Easing.out(Easing.cubic)
  usage:   Card appearances, ring animation, color transitions, button release
  character: Fast start, graceful finish — content arrives with confidence

motion.easing.in-out-ease
  value:   Easing.inOut(Easing.ease)
  usage:   Save button label morph, save button reset fade
  character: Symmetric — appropriate for bidirectional state transitions

motion.easing.back-overshoot
  value:   Easing.out(Easing.back(1.2))
  usage:   Island entrance only
  character: Slight overshoot then settle — physical premium feel
  rule:    Only for the island entrance. Content transitions must NOT use back easing.
           Content springs only on UI furniture (island) and icon press (tab icons).
```

---

### 8.4 Scale Values

```
motion.scale.rest                1.0     ← default state, all elements
motion.scale.button-press        0.97    ← primary/secondary button compress on press
motion.scale.tab-icon-press      0.92    ← tab icon compress on press
motion.scale.tab-icon-overshoot  1.06    ← tab icon spring overshoot on release
```

---

### 8.5 Translate Values

```
motion.translate.card-appear-from    12px    ← Analysis Result card enters from +12px below
motion.translate.island-enter-from   40px    ← Island slides up from +40px below on launch
```

---

### 8.6 Opacity Values

```
motion.opacity.hidden        0
motion.opacity.visible       1
motion.opacity.disabled      0.4    ← disabled button state — not grayed out, just dimmed
```

---

### 8.7 Delay Values

```
motion.delay.none                    0ms
motion.delay.island-entrance         200ms   ← after content loads, before island animates in
motion.delay.ring-stagger            60ms    ← between each ring in the post-save cascade

RING STAGGER SEQUENCE:
  Calories:   delay = 0ms   (fires first)
  Protein:    delay = 60ms
  Carbs:      delay = 120ms
  Fat:        delay = 180ms
  Total cascade duration: 180ms (delay) + 500ms (animation) = 680ms for final ring
```

---

### 8.8 Composed Transitions

Complete specifications for each named transition. An agent implementing a transition must use the exact values defined here.

```
motion.transition.button-press
  property:  transform.scale
  from:      motion.scale.rest              1.0
  to:        motion.scale.button-press      0.97
  duration:  motion.duration.xfast          80ms
  easing:    motion.easing.linear
  driver:    native

motion.transition.button-release
  property:  transform.scale
  from:      motion.scale.button-press      0.97
  to:        motion.scale.rest              1.0
  duration:  motion.duration.fast           120ms
  easing:    motion.spring.default          damping 18, stiffness 200, mass 0.8
  driver:    native

motion.transition.card-appear
  properties: opacity, transform.translateY
  from:       opacity=0, translateY=+12px
  to:         opacity=1, translateY=0
  duration:   motion.duration.card-appear   220ms
  easing:     motion.easing.out-cubic
  driver:     native
  origin:     Card rises from BELOW the button row. translateY starts positive (below).
  rule:       Do not slide in from off-screen. Do not drop from above. Rise from below.

motion.transition.save-label-morph
  property:  opacity (crossfade between two Text layers)
  out-label: "Save Entry"  opacity 1→0 over 75ms
  in-label:  "✓ Saved"     opacity 0→1 over 75ms, starting simultaneously
  duration:  motion.duration.micro   75ms per leg (simultaneous)
  easing:    motion.easing.in-out-ease
  driver:    js (required for crossfade of text content)

motion.transition.save-color-confirm
  property:  backgroundColor, borderColor
  from:      backgroundColor=colors.semantic.primary, no border
  to:        backgroundColor=colors.semantic.success.tint, borderColor=colors.semantic.success
  duration:  motion.duration.color-transition   300ms
  easing:    motion.easing.out-cubic
  driver:    js (color interpolation not supported on native driver)
  border-width: 1.5px

motion.transition.save-button-reset
  property:  opacity (full button wrapper fades out then in with new state)
  or:        reverse of save-color-confirm
  delay:     motion.duration.save-confirm-hold   1200ms after "✓ Saved" appears
  duration:  motion.duration.save-button-reset   200ms
  easing:    motion.easing.in-out-ease

motion.transition.ring-update
  property:  strokeDashoffset
  from:      previous value (stored in ref — NOT always from 0)
  to:        new computed value
  duration:  motion.duration.ring    500ms
  easing:    motion.easing.out-cubic
  stagger:   motion.delay.ring-stagger   60ms between Calories→Protein→Carbs→Fat
  driver:    js (SVG property)
  rule:      Animate from current value, not from 0. Reset to 0 only on initial mount.

motion.transition.tab-icon-press
  property:  transform.scale
  from:      motion.scale.rest              1.0
  to:        motion.scale.tab-icon-press    0.92
  duration:  motion.duration.instant        0ms   ← immediate
  driver:    native

motion.transition.tab-icon-release
  property:  transform.scale
  from:      motion.scale.tab-icon-press    0.92
  to:        motion.scale.rest              1.0   ← via 1.06 overshoot
  duration:  motion.duration.standard       ~180ms
  easing:    motion.spring.tab-icon         damping 20, stiffness 300
  driver:    native

motion.transition.tab-indicator-crossfade
  property:  opacity of active indicator pill
  out:       opacity 1→0 over motion.duration.fast   120ms
  in:        opacity 0→1 over motion.duration.fast   120ms
  timing:    simultaneous (not sequential)
  rule:      Do NOT slide the indicator between tabs. Cross-fade only.

motion.transition.island-entrance
  properties: transform.translateY, opacity
  from:       translateY=+40px, opacity=0
  to:         translateY=0, opacity=1
  duration:   motion.duration.island-entrance   400ms
  easing:     motion.easing.back-overshoot      Easing.out(back(1.2))
  delay:      motion.delay.island-entrance      200ms after mount
  fires:      ONCE per app process launch only
  driver:     native
  rule:       Does not fire on tab switches. Does not fire on modal open/close.

motion.transition.loading-fade
  property:  opacity
  from:      0
  to:        1
  duration:  motion.duration.snappy   150ms
  usage:     Loading states appearing/disappearing
```

---

**Motion constraints:**

```
DO NOT ANIMATE:
  Settings form fields on focus
  Day pill selection (instant color change)
  Log card list items (no stagger — adds latency)
  Modal dismiss (system animation — do not intercept)
  FoodItemCards inside Analysis Result (appear simultaneously with glass panel — no stagger)

DO NOT USE:
  Back easing on content (only island entrance and tab icon)
  Looping animations (only ActivityIndicator spins)
  Off-screen slide-in for inline content (use translateY rise from below)
  Particle effects, path animations, physics simulations

MINIMUM TRANSITION:
  Any state change must have at least a 120ms opacity transition.
  Instant state changes ONLY for:
    - Error/validation states requiring immediate user attention
    - Validation failure border color (direct response — must feel immediate)
```

---

---

## 9. COMPONENT TOKENS

Complete visual specifications for each reusable component. All values reference tokens defined in §1–§8.

### 9.1 Buttons

```
component.button.primary
  background:       colors.semantic.primary          #0A84FF
  text-color:       colors.text.primary              #FFFFFF
  typography:       typography.style.body-emphasis   15px/600
  border-radius:    radius.lg                        24px
  height:           ~48px (via paddingVertical: 6 + lineHeight)
  disabled-opacity: motion.opacity.disabled          0.4
  loading:          ActivityIndicator in place of text, button holds full width
  press:            motion.transition.button-press + motion.transition.button-release

component.button.secondary
  background:       colors.interactive.outlined-fill  rgba(10,132,255,0.08)
  border-color:     colors.semantic.primary            #0A84FF
  border-width:     1.5px
  text-color:       colors.semantic.primary            #0A84FF
  typography:       typography.style.body-emphasis     15px/600
  border-radius:    radius.lg                          24px
  height:           same as primary
  press:            same motion as primary

component.button.destructive
  background:       transparent
  border:           none
  text-color:       colors.semantic.error             #FF453A
  typography:       typography.style.body-emphasis    15px/600
  padding-v:        spacing.12 / 3    16px           ← large touch target
  component:        RNP Button mode="text"
  rule:             Never use as button fill. Text only. Always has touch target padding.

RULE: Never show three button types simultaneously on one screen.
  Home screen:  primary (Analyze) + secondary (Save Entry) only
  Modals:       primary only (no secondary in modal scroll body)
  Delete:       destructive text-mode only
```

---

### 9.2 Inputs

```
component.input.default
  mode:             outlined
  background:       colors.background.surface         #1C1C1E
  border-radius:    radius.sm                         10px
  border-color:     colors.border.default             rgba(84,84,88,0.65)
  active-border:    colors.semantic.primary            #0A84FF
  text-color:       colors.text.primary               #FFFFFF
  placeholder-color: colors.text.disabled             #636366
  typography:       typography.style.body             15px/400
  padding-left:     spacing.3                         12px

component.input.settings
  base:             component.input.default
  background:       colors.background.elevated        #2C2C2E
  text-align:       right
  min-width:        80px
  max-width:        110px
  note:             Settings inputs override background and alignment
```

---

### 9.3 Cards (Standard Surface)

```
component.card.default
  background:       colors.background.surface         #1C1C1E
  border-radius:    radius.md                         16px
  border-width:     1
  border-color:     colors.border.subtle              rgba(255,255,255,0.08)
  padding:          spacing.card.padding              16px
  overflow:         hidden
  elevation:        0                                 no drop shadow
  usage:            Settings card, About card, standard content groupings
```

---

### 9.4 Progress Rings

```
component.ring.calories
  radius:           32px                              ← primary macro, slightly larger
  stroke-width:     5px
  color:            colors.macro.calories             #0A84FF
  track-color:      colors.macro.calories.track       #0A84FF20

component.ring.protein
  radius:           28px
  stroke-width:     4px
  color:            colors.macro.protein              #30D158
  track-color:      colors.macro.protein.track        #30D15820

component.ring.carbs
  radius:           28px
  stroke-width:     4px
  color:            colors.macro.carbs                #5AC8FA
  track-color:      colors.macro.carbs.track          #5AC8FA20

component.ring.fat
  radius:           28px
  stroke-width:     4px
  color:            colors.macro.fat                  #FF9F0A
  track-color:      colors.macro.fat.track            #FF9F0A20

component.ring.shared
  stroke-linecap:   round
  rotation:         -90deg                            ← arc starts at top
  animation:        motion.transition.ring-update
  value-typography: typography.style.ring-value       18px/700, per-macro color
  label-typography: typography.style.ring-label       11px/500, colors.text.secondary
  remaining-typography: typography.style.ring-remaining  11px/400, colors.text.disabled
  value-position:   below ring (NOT overlaid inside ring)
```

---

### 9.5 Chips (Macro Display)

Used inside FoodItemCard and log entry cards.

```
component.chip.macro
  background:       colors.macro.[X].chip-bg          color at ~8% opacity
  border-radius:    radius.sm                         10px
  padding-h:        spacing.chip.padding-h            10px
  padding-v:        spacing.chip.padding-v            5px
  direction:        row
  gap:              3px                               ← tighter than chip-gap
  value-typography: typography.style.macro-chip-value 14px/700, macro color
  label-typography: typography.style.macro-chip-label 11px/600, macro color 0.80 opacity
```

---

### 9.6 Meal Chips

Used in Log Food modal and Edit Entry modal for Breakfast/Lunch/Dinner/Snack.

```
component.chip.meal.inactive
  background:       colors.background.surface         #1C1C1E
  border-width:     1
  border-color:     colors.border.default             rgba(84,84,88,0.65)
  text-color:       colors.text.secondary             #98989D
  border-radius:    radius.sm                         10px

component.chip.meal.active
  background:       colors.interactive.meal-chip-active-fill  rgba(10,132,255,0.15)
  border-color:     colors.semantic.primary                    #0A84FF
  text-color:       colors.semantic.primary                    #0A84FF
  font-weight:      typography.weight.semi-bold                600
  border-radius:    radius.sm                                  10px
```

---

### 9.7 Tab Bar Island

```
component.island.container
  position:         absolute
  bottom:           spacing.island.gap-bottom + insets.bottom   16 + insets.bottom
  left:             spacing.island.margin-h                      24px
  right:            spacing.island.margin-h                      24px
  height:           glass.island.height                          64px
  z-index:          100

component.island.glass
  [all values from glass.island.* in §6.2]

component.island.tab-item
  flex:             1
  align-items:      center
  justify-content:  center
  min-width:        76px
  touch-target:     (screenWidth - 48) / 3  ←  ≈114px on 390px device

component.island.tab-item.active
  icon-variant:     filled (Ionicons: "home", "list-sharp", "settings")
  icon-color:       colors.macro.calories              #0A84FF
  icon-size:        22px
  label-color:      colors.macro.calories              #0A84FF
  label-typography: typography.style.caption-small     11px/600
  indicator:        component.island.active-pill

component.island.tab-item.inactive
  icon-variant:     outline (Ionicons: "home-outline", "list-outline", "settings-outline")
  icon-color:       colors.text.disabled               #636366
  icon-size:        22px
  label-color:      colors.text.disabled               #636366
  label-typography: typography.style.caption-small     11px/500

component.island.active-pill
  background:       colors.interactive.active-pill     rgba(10,132,255,0.15)
  border-radius:    radius.active-pill                 12px
  padding-h:        spacing.screen.padding-h           16px
  padding-v:        spacing.2 / 2                      4px
  transition:       motion.transition.tab-indicator-crossfade
```

---

### 9.8 FAB

```
component.fab
  background:       colors.semantic.primary            #0A84FF
  border-radius:    radius.lg                          24px
  size:             spacing.fab.size                   56×56px
  icon:             Ionicons "plus", colors.text.primary, 24px
  position:         absolute
  right:            spacing.island.margin-h            24px
  bottom:           spacing.island.gap-bottom + glass.island.height
                    + spacing.fab.gap-above-island + insets.bottom
  shadow-color:     elevation.shadow.fab.color         #0A84FF
  shadow-offset-y:  elevation.shadow.fab.offset-y      4
  shadow-opacity:   elevation.shadow.fab.opacity        0.35
  shadow-radius:    elevation.shadow.fab.radius         12
  android-elevation: elevation.shadow.fab.android-elevation  8
  z-index:          50                                 above content, below island
```

---

### 9.9 Entry Cards (Log Cards)

```
component.entry-card
  background:       colors.background.surface          #1C1C1E
  border-radius:    radius.md                          16px
  border-width:     1
  border-color:     colors.border.subtle               rgba(255,255,255,0.08)
  padding:          spacing.card.entry-padding         14px
  margin-bottom:    spacing.card.gap                   8px
  blur-view:        FORBIDDEN                          ← use plain View, not BlurView
  elevation:        elevation.level.1

component.entry-card.time
  typography:       typography.style.caption           13px/500
  color:            colors.text.secondary              #98989D

component.entry-card.macro-row
  direction:        row
  gap:              spacing.chip.gap                   8px

component.entry-card.macro.calories
  typography:       typography.style.caption, weight=700   13px/700
  color:            colors.macro.calories              #0A84FF
  format:           "${value}kcal"                    ← no space between value and unit

component.entry-card.macro.protein
  typography:       typography.style.caption, weight=600   13px/600
  color:            colors.macro.protein               #30D158
  format:           "${value}g"

component.entry-card.macro.carbs
  color:            colors.macro.carbs                 #5AC8FA
  format:           "${value}g"

component.entry-card.macro.fat
  color:            colors.macro.fat                   #FF9F0A
  format:           "${value}g"

component.entry-card.food-text
  typography:       typography.style.body              15px/400
  color:            colors.text.primary                #FFFFFF
  max-lines:        2
  overflow:         ellipsis
```

---

### 9.10 Modal Headers

```
component.modal-header
  glass:            glass.modal-header.*               [see §6.2]
  layout:           row, space-between, align-center
  padding-h:        glass.modal-header.padding-h       16px
  padding-top:      platform-specific                  [see glass.modal-header.padding-top-*]
  padding-bottom:   glass.modal-header.padding-bottom  12px

component.modal-header.cancel
  typography:       typography.style.caption           13px/500
  color:            colors.semantic.primary            #0A84FF
  touch-target-min: 44px height

component.modal-header.title
  typography:       typography.style.heading           17px/600
  color:            colors.text.primary
  flex:             1
  text-align:       center

component.modal-header.action-log-food
  type:             empty View, min-width: 60px        ← balance spacer only

component.modal-header.action-edit-entry
  type:             Text/Pressable
  label:            "Save"
  typography:       13px/600
  color:            colors.semantic.primary            #0A84FF
  min-width:        60px                               ← matches cancel button width
```

---

### 9.11 Settings Rows

```
component.settings-row
  direction:        row
  justify:          space-between
  align:            center
  padding-h:        spacing.screen.padding-h          16px
  padding-v:        spacing.settings.row-padding-v    14px
  background:       transparent                        ← sits inside a card

component.settings-row.divider
  height:           1px
  background:       colors.border.default             rgba(84,84,88,0.65)
  margin-left:      spacing.screen.padding-h          16px  ← inset divider (iOS pattern)

component.settings-row.label
  typography:       typography.style.body             15px/400
  color:            colors.text.primary

component.settings-row.input
  component:        component.input.settings          [see §9.2]

component.settings-row.unit
  typography:       typography.style.caption          13px/500
  color:            colors.text.secondary             #98989D
  margin-left:      spacing.2                         8px
```

---

### 9.12 Day Picker Pills

```
component.day-pill.inactive
  background:       rgba(255,255,255,0.08)
  border-radius:    radius.sm                         10px
  padding-h:        20px
  padding-v:        spacing.2                         8px
  typography:       14px/600
  color:            colors.text.secondary             #98989D
  transition:       instant color change on tap (no animation)

component.day-pill.active
  background:       colors.macro.calories             #0A84FF
  color:            colors.text.primary               #FFFFFF
  border-radius:    radius.sm                         10px
  [all other values same as inactive]

component.day-pill.today-not-active
  background:       rgba(255,255,255,0.08)            ← same as inactive
  border-width:     1px
  border-color:     colors.macro.calories             #0A84FF
  color:            colors.text.secondary             #98989D
  note:             Subtle indicator today is different from selected day
```

---

---

## 10. LAYOUT TOKENS

Fixed layout values that govern positioning of floating elements.

```
layout.island.height                 64px
layout.island.margin-h               24px             left and right from screen edge
layout.island.bottom-gap             16px             gap above safe area insets
layout.island.z-index                100

layout.fab.size                      56px
layout.fab.right                     24px             aligned with island right edge
layout.fab.z-index                   50
layout.fab.bottom
  = layout.island.bottom-gap + layout.island.height + fab.gap-above + insets.bottom
  = 16 + 64 + 16 + insets.bottom

layout.content.max-blurviews         3                maximum simultaneous BlurViews

layout.screen.padding-h              16px
layout.screen.bottom.home            96px
layout.screen.bottom.settings        96px
layout.screen.bottom.entries         160px

layout.modal-header.balancer-width   60px             right spacer in Log Food header
layout.modal-header.min-touch        44px             minimum touch target height for Cancel/Save

layout.touch-target.minimum          44px             iOS HIG minimum touch target
layout.tab-item.width
  = (screenWidth - 48) / 3           ≈114px on 390px device
  minimum:                            76px
```

---

---

## 11. CONSTRAINT TOKENS

Rules that have no direct visual value but govern the use of all other tokens. An agent must enforce these before applying any token.

```
constraint.colors.text
  rule:    Exactly three text colors permitted: text.primary, text.secondary, text.disabled
  retired: #8E8E93 — any occurrence is a bug, replace with text.secondary (#98989D)

constraint.colors.macro
  rule:    Each macro color maps to exactly one nutrient. Never cross-use.
           calories=#0A84FF, protein=#30D158, carbs=#5AC8FA, fat=#FF9F0A
  exception: colors.semantic.primary = #0A84FF (same as calories) — permitted for
             primary buttons because they trigger nutrition actions

constraint.radius
  rule:    Exactly three radius values permitted: radius.sm (10), radius.md (16), radius.lg (24)
           Additional special values: radius.active-pill (12, island only), radius.atmospheric (9999)
  bug:     Any other borderRadius value in a component StyleSheet

constraint.spacing
  rule:    All spacing is a multiple of 4px. Non-multiples in component StyleSheets are bugs.
  exceptions: spacing.card.entry-padding (14px), spacing.chip.padding-h (10px),
              spacing.chip.padding-v (5px), spacing.button.padding-v (6px)
              — these are documented exceptions justified by density/fit requirements

constraint.glass.blurview-budget
  rule:    Maximum 3 BlurViews rendered simultaneously on any screen
  enforcement: see §6.3 permitted combinations

constraint.glass.atmospheric-required
  rule:    Every Level 2 and Level 3 glass surface must have a paired atmospheric layer
  exception: Modal headers (no atmospheric layer — see §7.1 modal-header)

constraint.glass.forbidden-surfaces
  rule:    Log entry cards, FoodItemCard, settings rows, buttons, inputs, modal content areas
           must NEVER use BlurView

constraint.motion.minimum-transition
  rule:    No element may snap between states without at least a 120ms opacity transition
  exceptions: Validation failure borders (instant), day pill selection (instant)

constraint.motion.no-content-springs
  rule:    Spring overshoot (back easing) only for island entrance and tab icon press
           Content transitions use cubic easing, never spring overshoot

constraint.motion.no-looping
  rule:    Nothing loops except ActivityIndicator. Looping animations are forbidden.

constraint.atmospheric.subliminal
  rule:    If any atmospheric glow color is identifiable without consciously looking
           for it, reduce that ellipse's opacity by 50%
  hard-max: 0.04 opacity per single ellipse
```

---

---

## 12. TOKEN INDEX

Quick-reference alphabetical index. Every token defined in this document, with its section.

```
atmospheric.analysis-result.ellipse-1               §7.1
atmospheric.daily-progress.ellipse-1 through 4      §7.1
atmospheric.day-picker.ellipse-1                     §7.1
atmospheric.geometry.*                               §7.2
atmospheric.island.ellipse-1                         §7.1
atmospheric.modal-header                             §7.1

colors.background.base                               §1.1
colors.background.elevated                           §1.1
colors.background.glass                              §1.1
colors.background.surface                            §1.1
colors.border.default                                §1.5
colors.border.subtle                                 §1.5
colors.glow.aurora.calories                          §1.7
colors.glow.aurora.carbs                             §1.7
colors.glow.aurora.fat                               §1.7
colors.glow.aurora.protein                           §1.7
colors.glow.day-picker                               §1.7
colors.glow.island                                   §1.7
colors.interactive.active-pill                       §1.6
colors.interactive.meal-chip-active-fill             §1.6
colors.interactive.outlined-fill                     §1.6
colors.interactive.primary-fill                      §1.6
colors.macro.calories                                §1.2
colors.macro.calories.chip-bg                        §1.2
colors.macro.calories.track                          §1.2
colors.macro.carbs                                   §1.2
colors.macro.carbs.chip-bg                           §1.2
colors.macro.carbs.track                             §1.2
colors.macro.fat                                     §1.2
colors.macro.fat.chip-bg                             §1.2
colors.macro.fat.track                               §1.2
colors.macro.protein                                 §1.2
colors.macro.protein.chip-bg                         §1.2
colors.macro.protein.track                           §1.2
colors.semantic.error                                §1.3
colors.semantic.primary                              §1.3
colors.semantic.success                              §1.3
colors.semantic.success.border                       §1.3
colors.semantic.success.tint                         §1.3
colors.text.disabled                                 §1.4
colors.text.primary                                  §1.4
colors.text.secondary                                §1.4

component.button.destructive                         §9.1
component.button.primary                             §9.1
component.button.secondary                           §9.1
component.card.default                               §9.3
component.chip.macro                                 §9.5
component.chip.meal.active                           §9.6
component.chip.meal.inactive                         §9.6
component.day-pill.active                            §9.12
component.day-pill.inactive                          §9.12
component.day-pill.today-not-active                  §9.12
component.entry-card.*                               §9.9
component.fab                                        §9.8
component.input.default                              §9.2
component.input.settings                             §9.2
component.island.*                                   §9.7
component.modal-header.*                             §9.10
component.ring.*                                     §9.4
component.settings-row.*                             §9.11

constraint.atmospheric.subliminal                    §11
constraint.colors.macro                              §11
constraint.colors.text                               §11
constraint.glass.atmospheric-required                §11
constraint.glass.blurview-budget                     §11
constraint.glass.forbidden-surfaces                  §11
constraint.motion.minimum-transition                 §11
constraint.motion.no-content-springs                 §11
constraint.motion.no-looping                         §11
constraint.radius                                    §11
constraint.spacing                                   §11

elevation.level.-1 through 4                         §5.1
elevation.shadow.fab.*                               §5.3
elevation.surface.*                                  §5.2

glass.analysis-result.*                              §6.2
glass.daily-progress.*                               §6.2
glass.day-picker.*                                   §6.2
glass.island.*                                       §6.2
glass.modal-header.*                                 §6.2

layout.*                                             §10

motion.delay.*                                       §8.7
motion.duration.*                                    §8.2
motion.easing.*                                      §8.3
motion.opacity.*                                     §8.6
motion.scale.*                                       §8.4
motion.spring.*                                      §8.1
motion.translate.*                                   §8.5
motion.transition.*                                  §8.8

radius.active-pill                                   §4
radius.atmospheric                                   §4
radius.lg                                            §4
radius.md                                            §4
radius.sm                                            §4

spacing.1 through spacing.24                         §3.1
spacing.button.*                                     §3.2
spacing.card.*                                       §3.2
spacing.chip.*                                       §3.2
spacing.fab.*                                        §3.2
spacing.island.*                                     §3.2
spacing.modal.*                                      §3.2
spacing.screen.*                                     §3.2
spacing.section.*                                    §3.2
spacing.settings.*                                   §3.2

typography.line-height.*                             §2.3
typography.size.*                                    §2.1
typography.style.*                                   §2.4
typography.weight.*                                  §2.2
```

---

*End of DESIGN_TOKENS.md*

> This document is the source of truth. When a value here conflicts with DESIGN.md prose, DESIGN.md prose governs (this document is a derivation). When a value here conflicts with a component's StyleSheet, this document governs (component StyleSheets are implementations).
