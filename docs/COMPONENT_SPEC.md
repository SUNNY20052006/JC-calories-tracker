# COMPONENT_SPEC.md — JC Food Tracker
### Reusable Component Specification · v1.0

> Based on DESIGN.md v1.0, WIREFRAMES.md v1.0, DESIGN_TOKENS.md v1.0.
> This document specifies behavior and appearance. It contains no implementation code.
> Every token reference (e.g. `radius.md`, `colors.macro.calories`) resolves to its value in DESIGN_TOKENS.md.

---

## TABLE OF CONTENTS

1. [DailyProgress](#1-dailyprogress)
2. [AnalysisResultCard](#2-analysisresultcard)
3. [FoodItemCard](#3-fooditemcard)
4. [FoodEntry](#4-foodentry)
5. [OilSlider](#5-oilslider)
6. [FloatingTabBar](#6-floatingtabbar)
7. [EntryCard](#7-entrycard)
8. [SettingsCard](#8-settingscard)
9. [ModalHeader](#9-modalheader)
10. [MacroChip](#10-macrochip)
11. [MealChip](#11-mealchip)
12. [EmptyState](#12-emptystate)

---

## READING THIS DOCUMENT

Each component spec contains:

**Purpose** — What the component exists to do. One or two sentences. If a component's purpose cannot be stated in two sentences, it is doing too much.

**Props** — The complete public interface. Each prop lists its type, whether it is required, its default if optional, and what it controls. No implementation types — just the shape of the contract.

**Visual Behavior** — How the component looks in every meaningful visual configuration. Exact token references for every visual property. No approximations.

**Interaction Behavior** — How the component responds to user gestures and system events. Exact motion token references for every animation. What happens when a gesture is cancelled, interrupted, or repeated.

**States** — Every distinct visual state the component can be in, and what triggers each transition. States are named and described without ambiguity. The default (rest) state is always listed first.

**Accessibility Requirements** — What the component must expose to screen readers. Minimum touch target sizes. Color contrast rules. What must be announced and when.

---

---

## 1. DAILYPROGRESS

### Purpose

Displays the user's cumulative macro intake for the current day as four animated progress rings, each ring representing one macro nutrient. It is the signature visual element of the app — the first thing a user sees on launch and the primary answer to "where am I today?"

This component is display-only. It does not accept user input and has no press state.

---

### Props

```
macros: {
  calories: { current: number, target: number }   REQUIRED
  protein:  { current: number, target: number }   REQUIRED
  carbs:    { current: number, target: number }   REQUIRED
  fat:      { current: number, target: number }   REQUIRED
}
  The four macro nutrient values and their daily targets.
  current = today's logged total. target = user's goal (from Settings).
  Both values are integers. No rounding inside the component — caller rounds.

date: Date   REQUIRED
  The date displayed in the card header as "Mon, 16 Jun".
  Component formats this value — it does not accept a pre-formatted string.

isLoading: boolean   OPTIONAL   default: false
  When true, replaces ring values with subtle skeleton placeholders.
  Used during the brief moment between app launch and data load.
```

---

### Visual Behavior

**Glass surface:**
The component renders as a Level 2 (Floating) glass surface. See DESIGN_TOKENS.md §6 `glass.daily-progress.*` for all BlurView properties. Key values:
- BlurView intensity: `28`
- Background: `colors.background.glass` — `rgba(28,28,30,0.72)`
- Border radius: `radius.md` — `16px`
- Top specular highlight: `rgba(255,255,255,0.16)` at `0.5px`
- Bottom shadow edge: `rgba(0,0,0,0.30)` at `0.5px`
- Margin horizontal: `spacing.4` — `16px` each side
- Margin top: `spacing.2` — `8px`
- Internal padding: `spacing.5` — `20px`

**Atmospheric aurora (4 ellipses behind the glass):**
Four absolutely-positioned Views render before (behind) the BlurView. All have `borderRadius: 9999` and `pointerEvents: none`. See `atmospheric.daily-progress.*` in DESIGN_TOKENS.md §7 for exact positions, sizes, and colors. The effect is a warm multicolour haze bleeding the macro palette into the dark behind the card. At rest, the aurora is subliminal — it passes the test: a user cannot identify its color without consciously looking for it.

**Header row:**
Two text elements in a row, `justifyContent: space-between`:
- Left: `"Today"` — `typography.style.title-large` (22px/700), `colors.text.primary`
- Right: date formatted as `"Mon, 16 Jun"` — `typography.style.caption` (13px/500), `colors.text.secondary`

**Ring row:**
Four ring columns in a row, `justifyContent: space-around`. Layout is symmetric. Columns do not wrap.

Each ring column contains (top to bottom):
1. SVG progress ring (dimensions vary by macro — see below)
2. Value text — `typography.style.ring-value` (18px/700), color is the macro's color token
3. Label text — `typography.style.ring-label` (11px/500), `colors.text.secondary`
4. Remaining text — `typography.style.ring-remaining` (11px/400), `colors.text.disabled`

**Ring dimensions:**
- Calories: radius `32px`, stroke width `5px`, color `colors.macro.calories` — `#0A84FF`
- Protein: radius `28px`, stroke width `4px`, color `colors.macro.protein` — `#30D158`
- Carbs: radius `28px`, stroke width `4px`, color `colors.macro.carbs` — `#5AC8FA`
- Fat: radius `28px`, stroke width `4px`, color `colors.macro.fat` — `#FF9F0A`

The Calories ring is deliberately larger. This is the subtle primary-macro signal — not a size hierarchy, but a visual weight that makes the calorie value read as the first and most important data point.

Ring track (background arc): the same macro color at 8% opacity. Generated as `macroColor + '20'` (hex suffix, not an rgba call). Track occupies the same path as the fill arc; the fill arc overlays it.

Arc properties: `strokeLinecap: round`, rotation: `-90deg` so the arc starts at the 12-o'clock position. The arc sweeps clockwise.

**Value text format:**
```
Calories: "${current}kcal"   ← unit suffix with no space
Protein:  "${current}g"
Carbs:    "${current}g"
Fat:      "${current}g"
```
Units are rendered as a nested Text element inside the value Text at a smaller size (11px, same color), not as separate sibling elements. This keeps the value and unit semantically linked for accessibility.

**Remaining text format:**
```
"${Math.max(0, target - current)}↓"
```
Never shows a negative number. When `current >= target`, shows `"0↓"`. When no target is set (target is 0 or null), this row is hidden — do not render a placeholder.

**Loading state:**
When `isLoading` is true, ring fill arcs are hidden, value text shows `"—"` in `colors.text.disabled`, label and remaining rows are unchanged. The glass card and atmospheric aurora render at full opacity — only the data is masked.

**Overflow state (macro exceeds target):**
Ring stays at 100% (full arc). A small `"!"` character appears immediately after the value text, in the same macro color, at 12px weight 600. No background, no additional space.

---

### Interaction Behavior

**No interaction.** This component is display-only. There is no press state, no hover state, no swipe behavior. It must not capture any touch events. `pointerEvents: 'box-none'` on the outer wrapper ensures the atmospheric ellipses and the card itself pass touches through to the scroll layer below.

**Ring animation on value change:**
When the `macros` prop changes (triggered by a save action), each ring's fill arc animates from its previous value to the new value. The animation must NOT restart from zero — it must animate from the current visual position.

Animation spec per ring:
- Duration: `motion.duration.ring` — `500ms`
- Easing: `motion.easing.out-cubic`
- Property: `strokeDashoffset`

Stagger between rings (Calories fires first):
- Calories: delay `0ms`
- Protein: delay `motion.delay.ring-stagger` — `60ms`
- Carbs: delay `120ms`
- Fat: delay `180ms`

Total cascade: the last ring's animation begins at 180ms and completes at 680ms. The stagger makes the update feel considered — each macro accounts for itself in sequence.

On first mount (when previous values are all zero), rings animate from `0` to the current value using the same timing. This is the only case where animation from zero is correct.

---

### States

```
STATE: loading
  Trigger:   isLoading prop is true
  Visual:    Ring fill arcs hidden; value text shows "—" in colors.text.disabled
             Glass card and aurora render at full opacity
  Exit:      isLoading becomes false → value text fades in over 150ms

STATE: rest (default)
  Trigger:   Component mounted with data; isLoading is false
  Visual:    All rings at their current fill level; values and labels visible
  Exit:      macros prop changes → animating state

STATE: animating
  Trigger:   macros prop changes value
  Visual:    Ring arcs animate from previous to new strokeDashoffset values
             Staggered: Calories → Protein → Carbs → Fat, 60ms between
  Exit:      All animations complete (~680ms) → rest state

STATE: overflow (per-macro)
  Trigger:   Any single macro's current value >= target value
  Visual:    That ring stays full (100% arc); "!" appended to value in macro color
             Other rings unaffected
  Note:      Multiple macros can be in overflow simultaneously
```

---

### Accessibility Requirements

- The component's accessible role is `"summary"` — it summarizes the day's nutrition status.
- `accessibilityLabel`: `"Daily progress. Calories: ${current} of ${target}. Protein: ${current}g of ${target}g. Carbs: ${current}g of ${target}g. Fat: ${current}g of ${target}g."`
- This full label is read as a single announcement — screen readers do not navigate into individual rings.
- Rings are not individually focusable; the card is a single accessibility node.
- Value text contrast: all macro colors (`#0A84FF`, `#30D158`, `#5AC8FA`, `#FF9F0A`) on `rgba(28,28,30,0.72)` glass background achieve minimum 3.0:1 contrast ratio (acceptable for large text at 18px/700). Do not reduce these colors.
- The atmospheric aurora layers must have `importantForAccessibility: 'no'` so they are never announced.

---

---

## 2. ANALYSISRESULTCARD

### Purpose

Displays the nutritional breakdown returned by the AI analysis engine after the user taps Analyze. Presents total macro values as editable fields and lists the individual food items identified in the entry. It is the secondary glass surface on the Home screen.

This component is the visual output of the analyze action. Its entrance must feel causally connected to the Analyze button that produced it.

---

### Props

```
result: {
  totalCalories: number     REQUIRED
  totalProtein:  number     REQUIRED
  totalCarbs:    number     REQUIRED
  totalFat:      number     REQUIRED
  items: FoodItem[]         REQUIRED   (see FoodItemCard §3 for FoodItem shape)
}

onMacroChange: (macro: 'calories'|'protein'|'carbs'|'fat', value: number) => void
  REQUIRED
  Called when the user edits any macro input field. Fires on every keystroke.
  The parent is responsible for clamping or validating values.

usedLocalFallback: boolean   OPTIONAL   default: false
  When true, displays a discreet banner indicating AI was unavailable and
  local estimation was used instead.
```

---

### Visual Behavior

**Glass surface:**
Level 2 (Floating) glass surface, secondary status (slightly less intense than DailyProgress). See `glass.analysis-result.*` in DESIGN_TOKENS.md §6.
- BlurView intensity: `24` — intentionally less than DailyProgress (`28`) to establish visual hierarchy
- Background: `colors.background.glass` — `rgba(28,28,30,0.72)`
- Border radius: `radius.md` — `16px`
- Top specular highlight: `rgba(255,255,255,0.14)` at `0.5px` — softer than DailyProgress
- Bottom shadow edge: `rgba(0,0,0,0.25)` at `0.5px`
- Margin horizontal: `spacing.4` — `16px`
- Margin top: `spacing.4` — `16px`
- Internal padding: `spacing.4` — `16px`

**Atmospheric layer:**
A single blue ellipse positioned behind the card. See `atmospheric.analysis-result.ellipse-1` in DESIGN_TOKENS.md §7:
- Color: `colors.glow.aurora.calories` — `rgba(10,132,255,0.025)`
- Dimensions: `120% × 130%` of the card, offset so it bleeds above and below
- Fixed blue regardless of which macro dominates the result — simplicity over reactivity
- `pointerEvents: none`

**Section title:**
`"Analysis Result"` — `typography.style.title` (20px/700), `colors.text.primary`

**Local fallback banner** (conditional — only when `usedLocalFallback` is true):
Rendered between the section title and the macro row. Format: `"⚠ Estimated locally · AI unavailable"`. Style: 12px/400, `colors.text.secondary`. No background, no border, no emphasis. This is low-urgency information — not styled as an error.

**Macro edit row:**
Four columns in a `flexDirection: row` with `justifyContent: space-between`. Each column contains:
- Label: macro name (`"Calories"`, `"Protein"`, `"Carbs"`, `"Fat"`), 12px/500, in the macro's color token
- Input: numeric text input, value pre-populated from `result.total[macro]`, `textAlign: center`
  - Background: `colors.background.elevated` — `#2C2C2E`
  - Border radius: `radius.sm` — `10px`
  - Text color: `colors.text.primary`
  - Font: 15px/400

**Divider:**
A single horizontal rule between the macro row and the food items section. Height `1px`, color `rgba(255,255,255,0.08)`, margin vertical `12px`.

**Food items section:**
Sub-heading `"Food Items"` — `typography.style.title` at 16px/600, `colors.text.primary`, margin bottom `8px`.

Below the sub-heading: a vertical list of `FoodItemCard` components (see §3), each in `translucent` mode, separated by `spacing.2` — `8px` gaps. FoodItemCards render simultaneously with the glass panel — no stagger animation between individual cards.

**Visual hierarchy inside the card (top to bottom):**
1. "Analysis Result" section title
2. Local fallback banner (conditional)
3. Macro edit row
4. Divider
5. "Food Items" sub-heading
6. FoodItemCard list

---

### Interaction Behavior

**Appearance:**
The card enters via a combined `opacity` and `translateY` animation triggered when the `result` prop first becomes non-null:
- `opacity`: `0 → 1`
- `translateY`: `+12px → 0` (card rises from slightly below)
- Duration: `motion.duration.card-appear` — `220ms`
- Easing: `motion.easing.out-cubic`
- Delay: `0ms` — starts immediately when result is ready

The card must not flash into existence (no opacity:1 before animation fires). The `opacity` Animated.Value must be initialized to `0`.

Origin direction: the card rises from BELOW the button row. A positive `translateY` starting value means the card begins lower than its final position. It does not drop from above; it does not slide from the side.

**Macro input interaction:**
Tapping a macro input focuses it and presents the numeric keypad. The scroll view scrolls to keep the focused input visible above the keyboard. Value updates fire `onMacroChange` on every change. No explicit confirm action — edits are live.

Only digits and a single decimal point are valid input. Values may not be negative. There is no minimum or maximum enforced by the component — the parent validates.

**Re-analysis (optional parent concern):**
When `result` prop changes to a new value while the card is already visible (e.g., user re-runs analysis), the card does not re-play its entrance animation. Values update in-place with no animation. FoodItemCards update simultaneously.

**Dismissal:**
The card is never dismissed by the user. It disappears when the parent unmounts it — typically after a successful save and form reset. No exit animation.

---

### States

```
STATE: hidden (default)
  Trigger:   result prop is null
  Visual:    Component is not rendered

STATE: entering
  Trigger:   result prop changes from null to a value
  Visual:    opacity 0→1, translateY +12→0, over 220ms
  Exit:      Animation completes → visible state

STATE: visible (rest)
  Trigger:   Entrance animation completes
  Visual:    Full card rendered; macro inputs editable; FoodItemCards visible

STATE: input-focused (per-field)
  Trigger:   User taps a macro input
  Visual:    That input's border color: colors.semantic.primary (#0A84FF)
             Numeric keyboard visible
             Scroll view shifted to keep input above keyboard
  Exit:      User dismisses keyboard or taps another input

STATE: local-fallback
  Trigger:   usedLocalFallback prop is true
  Visual:    Banner "⚠ Estimated locally · AI unavailable" appears between title and macro row
  Note:      Can coexist with any other state except hidden
```

---

### Accessibility Requirements

- `accessibilityRole: "none"` on the card container — it is a content grouping, not a control.
- Each macro input has an `accessibilityLabel`: `"${macroName} in ${unit}. Currently ${value}"` — e.g., `"Calories in kilocalories. Currently 88"`.
- `accessibilityHint` on each macro input: `"Double-tap to edit"`.
- Each `FoodItemCard` inside is independently accessible (see §3).
- The local fallback banner has `accessibilityLabel: "Estimated locally. AI was unavailable."` and `accessibilityRole: "alert"` so it is announced when it appears.
- The atmospheric layer behind the card: `importantForAccessibility: 'no'`.

---

---

## 3. FOODITEMCARD

### Purpose

Displays a single food item returned within an AI analysis result — its name, preparation details, portion information, and macro breakdown as colored chips. Appears only inside `AnalysisResultCard`.

Supports a `translucent` visual mode required for rendering inside the glass panel of `AnalysisResultCard`.

---

### Props

```
item: {
  name:         string    REQUIRED   e.g. "Chicken breast"
  portion:      string    REQUIRED   e.g. "1 piece · grilled · 55g"
  calories:     number    REQUIRED
  protein:      number    REQUIRED
  carbs:        number    REQUIRED
  fat:          number    REQUIRED
  cookingState: 'raw' | 'cooked'   REQUIRED
}

onCookingStateChange: (state: 'raw' | 'cooked') => void   REQUIRED
  Called when the user toggles between Raw and Cooked.
  The parent is responsible for recalculating macros.

translucent: boolean   OPTIONAL   default: false
  When true, the card background is rgba(255,255,255,0.05) — glass-compatible.
  When false, the card background is colors.background.surface (#1C1C1E).
  Always pass true when rendering inside AnalysisResultCard.
```

---

### Visual Behavior

**Card surface:**

*Default mode (translucent: false):*
- Background: `colors.background.surface` — `#1C1C1E`
- Border radius: `radius.sm` — `10px`
- Border: `1px`, `colors.border.subtle` — `rgba(255,255,255,0.08)`
- Padding: `spacing.3` — `12px`
- Elevation: Level 1

*Translucent mode (translucent: true):*
- Background: `rgba(255,255,255,0.05)` — permits the glass surface below to show through
- Border radius: `radius.sm` — `10px`
- Border: `1px`, `rgba(255,255,255,0.06)` — slightly more transparent than default
- Padding: `spacing.3` — `12px`
- The translucent mode creates a sense of internal depth within the glass panel — the card is lighter than the glass surface behind it

**Header row:**
`flexDirection: row`, `justifyContent: space-between`, `alignItems: center`
- Left: food name — `typography.style.body-emphasis` (15px/600), `colors.text.primary`
- Right: Raw/Cooked toggle (see below)

**Portion row:**
`item.portion` text — `typography.style.caption` (13px/500), `colors.text.secondary`
Margin top: `spacing.1` — `4px`

**Macro chip row:**
Four `MacroChip` components (see §10) in a `flexDirection: row` with `gap: spacing.2` (`8px`). Order: Calories → Protein → Carbs → Fat.
Margin top: `spacing.2` — `8px`

**Raw/Cooked toggle:**
A pair of small buttons that switch between preparation states. Only one can be active at a time.

Visual for each toggle state:
- Active:   background `colors.interactive.active-pill` `rgba(10,132,255,0.15)`, border `1px colors.semantic.primary` `#0A84FF`, text `colors.semantic.primary` `#0A84FF`, 11px/600, border-radius `radius.sm` `10px`
- Inactive: background transparent, border none, text `colors.text.secondary` `#98989D`, 11px/500

The two labels are `"Raw"` and `"Cooked"`, rendered side-by-side without a visible separator. The active one has the capsule behind it; the inactive one is plain text.

---

### Interaction Behavior

**Raw/Cooked toggle tap:**
Tapping the inactive toggle state switches cooking state. Visual transition is instant (no animation — the toggle is a small detail, instant response is appropriate). Calls `onCookingStateChange`.

No press animation on the toggle buttons — they are small enough that a scale animation would look jumpy.

**Macro values:**
Read-only within this component. Macro values update when the parent provides new `item` props (e.g., after cooking state recalculation). Values update instantly — no animation between old and new values.

**No card-level press state.**
The card itself is not tappable. There is no `onPress` prop and no press animation on the card surface.

---

### States

```
STATE: cooked (default when cookingState: 'cooked')
  Visual:   "Cooked" toggle is active (blue capsule); macros reflect cooked values

STATE: raw (when cookingState: 'raw')
  Visual:   "Raw" toggle is active (blue capsule); macros reflect raw values

STATE: toggling
  Trigger:   User taps inactive cooking state
  Duration:  Instant — no transition animation
  Exit:      New cooking state active immediately
```

---

### Accessibility Requirements

- `accessibilityRole: "none"` on the card container.
- `accessibilityLabel` on the card: `"${item.name}. ${item.portion}. ${item.calories} calories, ${item.protein}g protein, ${item.carbs}g carbs, ${item.fat}g fat."`
- Raw/Cooked toggle: each option has `accessibilityRole: "radio"` and `accessibilityState: { checked: isActive }`.
- Toggle group has `accessibilityLabel: "Cooking state"`.
- Minimum touch target on each toggle: `44px × 44px` (use padding to achieve this — the visible element can be smaller).
- `MacroChip` components inside this card: `importantForAccessibility: 'no'` — the card-level label covers their content.

---

---

## 4. FOODENTRY

### Purpose

A multiline text input that accepts a plain-language food description from the user. It is the primary interaction point on the Home screen and the Log Food modal. The user types what they ate; the AI interprets it.

---

### Props

```
value: string   REQUIRED
  The current input value. Controlled component — always reflects external state.

onChangeText: (text: string) => void   REQUIRED
  Called on every text change.

label: string   OPTIONAL   default: "What did you eat?"
  Label text displayed above the input.

hint: string   OPTIONAL   default: "Describe what you ate in plain language"
  Hint text displayed below the input.

autoFocus: boolean   OPTIONAL   default: false
  When true, the input is focused immediately on mount.
  Must be true when rendered inside the Log Food modal.

editable: boolean   OPTIONAL   default: true
  When false, the input is non-interactive (used during loading states).
  Visual appearance: unchanged, but unresponsive.
```

---

### Visual Behavior

**Label:**
Rendered above the input. `typography.style.body-emphasis` (15px/600), `colors.text.primary`. Margin bottom `spacing.1` — `4px`.

**Input field:**
- Mode: `outlined` (react-native-paper RNP input or equivalent)
- Background: `colors.background.surface` — `#1C1C1E`
- Border radius: `radius.sm` — `10px` (applied via `outlineStyle`)
- Border color (rest): `colors.border.default` — `rgba(84,84,88,0.65)`
- Border color (focused): `colors.semantic.primary` — `#0A84FF`
- Text color: `colors.text.primary` — `#FFFFFF`
- Placeholder color: `colors.text.disabled` — `#636366`
- Font: `typography.style.body` (15px/400)
- Padding left: `spacing.3` — `12px`
- Multiline: true
- Minimum height: 3 lines (approximately 72px at 15px line height with padding)
- Height: auto-grows with content up to approximately 8 lines before scrolling internally

**Hint text:**
Rendered below the input. 12px/400, `colors.text.secondary`. Margin top `spacing.1` — `4px`. Visible at rest; not a placeholder (it does not disappear when text is entered).

**Loading/disabled state:**
When `editable` is false, the input appears visually identical to its rest state. No visual dimming. The distinction is behavioral — no keyboard appears, no cursor blinks.

---

### Interaction Behavior

**Focus:**
Tapping the input presents the system keyboard. The input border transitions to `colors.semantic.primary` — `#0A84FF`. Duration: instant (no animation — direct response to tap).

**Text entry:**
Each character fires `onChangeText`. No debounce within the component — debouncing is the parent's responsibility if needed.

**Keyboard dismissal:**
The input dismisses the keyboard on component unmount or when the user swipes down (iOS: `keyboardDismissMode: "interactive"`). On Android, a `Pressable` overlay on non-input areas of the screen dismisses the keyboard — the component itself does not manage this.

**Auto-focus:**
When `autoFocus` is true, the keyboard appears immediately on mount without a user tap. This is the required behavior inside the Log Food modal where the keyboard should be ready when the modal opens.

**Unfocus:**
Tapping outside the input dismisses the keyboard and returns the input to its rest border color. Duration: instant.

---

### States

```
STATE: empty (default)
  Trigger:   value is empty string
  Visual:    Placeholder visible: colors.text.disabled (#636366)
             Border: colors.border.default
             Hint text visible below

STATE: filled
  Trigger:   value is a non-empty string
  Visual:    Placeholder hidden, user text visible in colors.text.primary
             Border: colors.border.default (same as empty — no "success" color)
             Hint text still visible below

STATE: focused
  Trigger:   User taps the input
  Visual:    Border color: colors.semantic.primary (#0A84FF)
             Keyboard visible
             Can be empty or filled simultaneously

STATE: focused-empty
  Combination of focused + empty. Placeholder still visible.

STATE: disabled
  Trigger:   editable prop is false
  Visual:    Identical to rest state — no visual indicator of disabled state
  Behavior:  Keyboard does not appear; text cannot be changed
```

---

### Accessibility Requirements

- `accessibilityLabel`: value of the `label` prop, or `"Food description"` if no label provided.
- `accessibilityHint`: value of the `hint` prop, or `"Describe what you ate in plain language"`.
- `accessibilityRole: "none"` — the underlying TextInput has its own implicit role.
- When `autoFocus` is true, screen readers must announce the label on focus without requiring user navigation.
- Minimum touch target: the entire input area including label should be tappable (the label tap focuses the input).
- Do not hide the hint text for accessibility — it provides context that helps users know what to type.

---

---

## 5. OILSLIDER

### Purpose

Lets the user specify how much oil or fat was used in the preparation of a meal, on a five-point labeled scale from "No oil" to "Very oily." This modifier adjusts the fat and calorie calculation for Indian cooking contexts where oil usage varies dramatically by dish.

---

### Props

```
value: number   REQUIRED
  Current slider position. Integer from 0 to 4.
  0 = No oil, 1 = Light, 2 = Normal, 3 = Oily, 4 = Very oily.

onChange: (value: number) => void   REQUIRED
  Called when the slider value changes. Fires during drag (not just on release).

label: string   OPTIONAL   default: "Oil Level"
  Label displayed in the header row.
```

---

### Visual Behavior

**Header row:**
`flexDirection: row`, `justifyContent: space-between`, `alignItems: center`.
- Left: the `label` prop value — `typography.style.body-emphasis` (15px/600), `colors.text.primary`
- Right: percentage display of the current value as a percentage of maximum:
  - 0 → `"0%"`, 1 → `"25%"`, 2 → `"50%"`, 3 → `"75%"`, 4 → `"100%"`
  - Style: 15px/700, `colors.macro.calories` — `#0A84FF`
  - The `%` symbol is part of the same text element

**Slider track:**
Standard horizontal slider spanning the full available width.
- Track: the inert portion of the track, in `colors.border.default`
- Fill: the active portion (left of thumb), in `colors.macro.calories` — `#0A84FF`
- Thumb: circular, filled `colors.macro.calories`, slightly larger than the track height
- The slider has 5 discrete positions (0–4). It snaps to integer values.

**Tick labels:**
Five text labels below the slider, one per position, evenly distributed to align with slider stops. Labels: `"No oil"`, `"Light"`, `"Normal"`, `"Oily"`, `"V.oily"`. Each label style:
- Active (matches current value): `typography.style.caption-small` (11px/600), `colors.macro.calories` — `#0A84FF`
- Inactive: `typography.style.caption-small` (11px/500), `colors.text.disabled` — `#636366`

Only the label for the currently selected position is in the active style.

---

### Interaction Behavior

**Drag:**
The user drags the thumb left or right. As the thumb crosses a discrete tick position, the corresponding tick label activates (color changes to `#0A84FF`, weight changes to 600). The percentage value in the header updates synchronously during drag.

**Snap:**
On release, the thumb snaps to the nearest integer position with a spring animation:
- Spring: `motion.spring.default` (damping 18, stiffness 200, mass 0.8)
- Duration: approximately 120ms

**Tap on track:**
Tapping anywhere on the track moves the thumb to the tapped position, snapping to the nearest tick.

**No press animation on the component level** — the thumb and track have their own native interaction behaviors.

---

### States

```
STATE: at-zero (value: 0 — No oil)
  Visual:   Fill area is zero-width; only thumb visible at left end
            "No oil" label active; header shows "0%"
            Appropriate for zero-fat dishes

STATE: at-normal (value: 2 — default state)
  Visual:   Fill covers half the track; "Normal" label active; header shows "50%"

STATE: at-max (value: 4 — Very oily)
  Visual:   Fill covers full track; "V.oily" label active; header shows "100%"
            Thumb at right end

STATE: dragging
  Trigger:   User initiates drag on thumb
  Visual:    Thumb enlarges slightly (native behavior — not specified here)
             Percentage and tick label update live during drag
  Exit:      User releases drag → spring-snap to nearest integer
```

---

### Accessibility Requirements

- `accessibilityRole: "adjustable"` on the slider.
- `accessibilityLabel`: `"Oil level. Currently ${label} at ${percentage}"`
  e.g., `"Oil level. Currently Normal at 50%"`
- `accessibilityValue: { min: 0, max: 4, now: value, text: tickLabels[value] }`
- `accessibilityActions: [{ name: 'increment' }, { name: 'decrement' }]`
- On increment action: increase value by 1, clamped at 4. Announce new value.
- On decrement action: decrease value by 1, clamped at 0. Announce new value.
- Announcement on value change: `"Oil level ${tickLabels[newValue]}"` — announced via `accessibilityLiveRegion: "polite"` on the percentage display.
- Minimum touch target on the thumb: `44px × 44px`.

---

---

## 6. FLOATINGTABBAR

### Purpose

The primary navigation component of the app. A floating glass pill that hovers above the screen floor, containing three tab items (Home, Entries, Settings). It is the Level 3 (Island) elevation element — the highest floating surface in the app.

This component replaces the native tab bar. It reads the current route and navigates programmatically.

---

### Props

```
activeTab: 'home' | 'entries' | 'settings'   REQUIRED
  The currently active tab. Determines which icon is filled, which label is blue,
  and which has the active indicator capsule behind it.

onTabPress: (tab: 'home' | 'entries' | 'settings') => void   REQUIRED
  Called when a tab item is pressed. The parent handles navigation.

insets: { bottom: number }   REQUIRED
  Safe area insets from useSafeAreaInsets(). Used to compute the island's
  bottom position: spacing.island.gap-bottom + insets.bottom.
```

---

### Visual Behavior

**Container:**
Absolutely positioned. Does not scroll. Does not participate in layout flow.
- Position: `absolute`, `bottom: 16 + insets.bottom`, `left: 24`, `right: 24`
- Height: `64px`
- z-index: `100` — above all screen content, below system modals

**Atmospheric layer:**
A horizontal ellipse positioned 8px below the island's bottom edge. See `atmospheric.island.ellipse-1` in DESIGN_TOKENS.md §7:
- Color: `colors.glow.island` — `rgba(10,132,255,0.02)`
- Height: `20px`
- Positioned `8px below` island bottom, `40px inset` from island left and right edges
- `pointerEvents: none`, `z-index: 99` (below island)

**Glass surface (BlurView):**
See `glass.island.*` in DESIGN_TOKENS.md §6:
- BlurView intensity: `36` — strongest in the app
- Background: `rgba(28,28,30,0.80)` — more opaque than content glass
- Border radius: `radius.lg` — `24px`
- Border: `1px rgba(255,255,255,0.10)` — all sides
- Top specular highlight: `rgba(255,255,255,0.22)` at `0.5px` — strongest in the app
- Bottom shadow edge: `rgba(0,0,0,0.50)` at `0.5px`
- `overflow: hidden`
- `flexDirection: row`, `alignItems: center`

**Tab items:**
Three items in a row, each `flex: 1`, aligned `center`. Touch area for each item: `(screenWidth − 48) / 3`, minimum `76px`. The actual touchable area fills the full tab item column — it is not limited to the icon and label size.

Each item layout (vertically stacked, centered):
1. Icon (Ionicons, `22px`)
2. Label text (`11px`)

**Active item:**
- Icon: filled Ionicons variant (`"home"`, `"list-sharp"`, `"settings"`)
- Icon color: `colors.macro.calories` — `#0A84FF`
- Label: `typography.style.caption-small` at 11px/600, `colors.macro.calories`
- Active indicator capsule behind the icon + label:
  - Background: `colors.interactive.active-pill` — `rgba(10,132,255,0.15)`
  - Border radius: `radius.active-pill` — `12px` (special value, not in the 3-radius system)
  - Padding: `16px` horizontal, `4px` vertical
  - The capsule visually groups the icon and label; its opacity is animated during tab transitions

**Inactive item:**
- Icon: outline Ionicons variant (`"home-outline"`, `"list-outline"`, `"settings-outline"`)
- Icon color: `colors.text.disabled` — `#636366`
- Label: `typography.style.caption-small` at 11px/500, `colors.text.disabled`
- No indicator capsule

**Icon names by tab:**
```
Home:     active: "home"         inactive: "home-outline"
Entries:  active: "list-sharp"   inactive: "list-outline"
Settings: active: "settings"     inactive: "settings-outline"
```

---

### Interaction Behavior

**Tab item press:**
Scale animation on the icon:
1. On press-in: icon scale `1.0 → 0.92`, duration `0ms` — immediate
2. On press-out: icon scale `0.92 → 1.0` via spring (`motion.spring.tab-icon`: damping 20, stiffness 300), total ~`180ms`
The scale animation applies to the icon and label together (the column content), not the entire tab item width.

`onTabPress` is called on press-up, not press-in — prevents accidental navigation during a drag that started on a tab item.

**Active indicator transition:**
When `activeTab` prop changes, the outgoing indicator capsule fades `opacity 1 → 0` over `120ms` simultaneously with the incoming capsule fading `opacity 0 → 1` over `120ms`. The fade starts when the prop changes, not when the animation frame fires.

The indicator does NOT slide between tabs. The cross-fade is the only transition. Sliding requires position tracking and is brittle.

**Entrance animation (once per app launch):**
On first mount only:
- `translateY`: `+40px → 0`
- `opacity`: `0 → 1`
- Duration: `motion.duration.island-entrance` — `400ms`
- Easing: `motion.easing.back-overshoot` — `Easing.out(Easing.back(1.2))`
- Delay: `motion.delay.island-entrance` — `200ms` after mount

This fires exactly once per process lifecycle. Subsequent mounts (if the island is unmounted for any reason) do not replay the entrance.

---

### States

```
STATE: entering (first app launch)
  Trigger:   First mount of the component
  Visual:    translateY from +40, opacity from 0, 400ms spring with 200ms delay
  Exit:      Animation completes → rest state

STATE: rest
  Visual:    Island visible at final position; active tab indicator at full opacity

STATE: transition (tab change in progress)
  Trigger:   activeTab prop changes
  Visual:    Outgoing indicator: opacity 1→0 over 120ms
             Incoming indicator: opacity 0→1 over 120ms
             Both fade simultaneously
  Exit:      Both fades complete → rest state with new active tab

STATE: item-pressed (per tab item)
  Trigger:   User's finger contacts a tab item
  Visual:    That item's icon+label scales to 0.92 immediately
  Exit:      User lifts finger → spring back to 1.0 via overshoot to 1.06

STATE: hidden (behind modal)
  Trigger:   A full-screen modal is presented
  Visual:    Island should not be visible — either unmounted or z-index below modal
  Exit:      Modal dismissed → island visible again
```

---

### Accessibility Requirements

- `accessibilityRole: "tabbar"` on the outer container.
- Each tab item: `accessibilityRole: "tab"`, `accessibilityState: { selected: isActive }`.
- Tab item `accessibilityLabel`: tab name — `"Home"`, `"Entries"`, `"Settings"`.
- When a tab becomes active: announce `"${tabName} tab, selected"` via `accessibilityLiveRegion: "polite"`.
- Minimum touch target: each tab item's pressable area must span the full `(screenWidth − 48) / 3` width and the full `64px` height of the island.
- `accessibilityLabel` on the active indicator capsule: none — it is a visual decoration, `importantForAccessibility: 'no'`.
- The atmospheric layer: `importantForAccessibility: 'no'`.
- On Android, the island must not overlap the system navigation bar — `insets.bottom` must be included in the bottom position calculation.

---

---

## 7. ENTRYCARD

### Purpose

Displays a single logged food entry in the Entries screen list — its time, macro summary, and food description. Acts as the tap target to open the Edit Entry modal.

This is a Level 1 (Raised) surface. It must NOT use BlurView — it is a content plane element, not a floating surface.

---

### Props

```
entry: {
  id:          string    REQUIRED   unique identifier
  time:        Date      REQUIRED   the time the entry was logged
  calories:    number    REQUIRED
  protein:     number    REQUIRED
  carbs:       number    REQUIRED
  fat:         number    REQUIRED
  foodText:    string    REQUIRED   the raw food description
}

onPress:      () => void   REQUIRED   opens Edit Entry modal
onLongPress:  () => void   REQUIRED   opens delete confirmation
```

---

### Visual Behavior

**Card surface:**
- Background: `colors.background.surface` — `#1C1C1E`
- Border radius: `radius.md` — `16px`
- Border: `1px`, `colors.border.subtle` — `rgba(255,255,255,0.08)`
- Padding: `spacing.card.entry-padding` — `14px`
- Margin bottom: `spacing.card.gap` — `8px`
- No shadow, no blur, no elevation effects
- `overflow: hidden`

**Row 1 — meta row:**
`flexDirection: row`, `justifyContent: space-between`, `alignItems: center`.

Left: time formatted as `"8:19 pm"` — `typography.style.caption` (13px/500), `colors.text.secondary`.

Right: macro summary in a `flexDirection: row` with `gap: spacing.2` (`8px`):
- Calories: `"${calories}kcal"` — 13px/700, `colors.macro.calories`
- Protein: `"${protein}g"` — 13px/600, `colors.macro.protein`
- Carbs: `"${carbs}g"` — 13px/600, `colors.macro.carbs`
- Fat: `"${fat}g"` — 13px/600, `colors.macro.fat`

No space between value and unit. Format is `"462kcal"` not `"462 kcal"`.

**Row 2 — food text:**
`entry.foodText` — `typography.style.body` (15px/400), `colors.text.primary`. Maximum 2 lines with trailing ellipsis if longer.

**Press state:**
A subtle opacity reduction to `0.85` during the press gesture. Duration: instant.

---

### Interaction Behavior

**Tap:**
Calls `onPress`. Press-in shows the press visual state (opacity 0.85). Press-up restores to full opacity and fires `onPress`. If the user drags more than ~10px before releasing, the press is cancelled (no `onPress` call).

**Long press:**
Calls `onLongPress` after the platform long-press threshold (~500ms on iOS, ~300ms on Android). During the long-press hold, the card maintains the press visual state (opacity 0.85). On release, `onLongPress` fires.

**No scale animation** — the card is content, not a button. The opacity reduction is sufficient feedback for a list item.

---

### States

```
STATE: rest (default)
  Visual:   Full opacity; surface color #1C1C1E

STATE: pressed
  Trigger:   User's finger contacts the card
  Visual:    opacity 0.85, instant
  Exit:      Finger lifts → rest; or drag exceeds threshold → cancelled

STATE: cancelled
  Trigger:   Drag exceeds threshold during press
  Visual:    Returns to rest opacity instantly
```

---

### Accessibility Requirements

- `accessibilityRole: "button"`.
- `accessibilityLabel`: `"${time}. ${calories} calories, ${protein}g protein, ${carbs}g carbs, ${fat}g fat. ${foodText}"`. If `foodText` is longer than 80 characters, truncate to 80 characters and append `"...more"`.
- `accessibilityHint`: `"Double-tap to edit. Long press to delete."`
- Minimum touch target: `44px` height. The card's `14px` padding makes the visual height approximately 74px for a single-line food description — well above minimum.

---

---

## 8. SETTINGSCARD

### Purpose

Groups related settings rows into a visually unified card. Contains inputs for each macro target value with their labels and unit annotations. A Level 1 (Raised) surface.

---

### Props

```
rows: Array<{
  label:    string   REQUIRED   e.g. "Calories"
  value:    number   REQUIRED   current target value
  unit:     string   REQUIRED   e.g. "kcal" or "g"
  onChange: (value: number) => void   REQUIRED
}>
  Each row creates one settings row inside the card with a label, an input, and a unit label.
```

---

### Visual Behavior

**Card container:**
- Background: `colors.background.surface` — `#1C1C1E`
- Border radius: `radius.md` — `16px`
- Border: `1px`, `colors.border.subtle` — `rgba(255,255,255,0.08)`
- Overflow: `hidden` — clips row dividers to card edges

**Row layout:**
Each row is `flexDirection: row`, `justifyContent: space-between`, `alignItems: center`, `paddingHorizontal: spacing.4` (16px), `paddingVertical: 14px`.

Within each row:
- Left: label — `typography.style.body` (15px/400), `colors.text.primary`
- Center (stretches): flexible spacer — pushes input and unit to right edge
- Right: input + unit in a `flexDirection: row`, `alignItems: center`, `gap: spacing.2` (8px)
  - Input: numeric, `textAlign: right`, background `colors.background.elevated` (#2C2C2E), border radius `radius.sm` (10px), `min-width: 80px`, `max-width: 110px`, text color `colors.text.primary`, 15px/400
  - Unit: `typography.style.caption` (13px/500), `colors.text.secondary`

**Dividers between rows:**
Height `1px`, color `colors.border.default` — `rgba(84,84,88,0.65)`, `marginLeft: 16px` (inset — iOS Settings pattern). The divider does not span to the left edge of the card.

There is no divider below the last row (the card's bottom border replaces it visually).

**About card variant:**
The card can also render static information rows (no input). The row structure is the same — label left, value right — but the right side is a plain Text element (`typography.style.caption` (13px/500), `colors.text.secondary`) rather than an input.

---

### Interaction Behavior

**Row input focus:**
Tapping an input focuses it and presents the numeric keypad. The input border color changes to `colors.semantic.primary` — `#0A84FF`. Calls `onChange` on every change.

**Row input unfocus:**
Tapping outside dismisses the keyboard. Input border returns to default.

**No card-level press state.** The card is not tappable as a whole.

---

### States

```
STATE: rest (default)
  Visual:   All inputs show their current values, default border color

STATE: row-focused (per-row)
  Trigger:   User taps a row's input
  Visual:    That input's border color: colors.semantic.primary (#0A84FF)
             Numeric keyboard visible
  Exit:      User dismisses keyboard → rest
```

---

### Accessibility Requirements

- `accessibilityRole: "none"` on the card container — it is a visual grouping, not a control.
- Each row's input: `accessibilityLabel` — `"${label} target. Currently ${value} ${unit}"`.
  e.g., `"Calories target. Currently 2400 kilocalories"`
- `accessibilityHint` on each input: `"Double-tap to edit"`
- Unit label: `importantForAccessibility: 'no'` — the input's label already includes the unit.
- Dividers: `importantForAccessibility: 'no'`

---

---

## 9. MODALHEADER

### Purpose

A glass header bar used at the top of all modals (Log Food, Edit Entry). Provides a consistent three-part layout: a cancel/back action on the left, a centered title, and an optional action on the right.

This is a Level 2 (Floating) glass surface within the modal, sitting above the modal's scrollable content.

---

### Props

```
title: string   REQUIRED
  The modal title, displayed centered. e.g. "Log Food", "Edit Entry".

onCancel: () => void   REQUIRED
  Called when the left action is tapped. Always labeled "Cancel".

rightAction: {
  label:   string      OPTIONAL   e.g. "Save"
  onPress: () => void  OPTIONAL
} | null   OPTIONAL   default: null
  When provided, renders a tappable label on the right side.
  When null, renders an empty spacer on the right to keep the title centered.

cancelLabel: string   OPTIONAL   default: "Cancel"
  The label for the left action. Override for non-standard dismiss labels if needed.
```

---

### Visual Behavior

**Glass surface:**
Level 2 glass, no rounding (full-width header strip at the top of a modal). See `glass.modal-header.*` in DESIGN_TOKENS.md §6.
- BlurView intensity: `28`
- Background: `colors.background.glass` — `rgba(28,28,30,0.72)`
- `borderRadius: 0` — flush with modal top edges
- Top specular highlight: `rgba(255,255,255,0.14)` at `0.5px`
- Bottom border: `1px`, `colors.border.subtle` — `rgba(255,255,255,0.08)`
- No atmospheric layer (see DESIGN_TOKENS.md §7)

**Padding:**
- Horizontal: `spacing.4` — `16px`
- Top: `safeAreaInsets.top + 8` on iOS, `spacing.4` (`16px`) on Android
- Bottom: `spacing.modal.header-padding-bottom` — `12px`

**Layout:**
`flexDirection: row`, `justifyContent: space-between`, `alignItems: center`.

Left slot: `"Cancel"` (or `cancelLabel`) — 13px/500, `colors.semantic.primary` — `#0A84FF`. Tappable, calls `onCancel`.

Center slot: `title` — `typography.style.heading` (17px/600), `colors.text.primary`, `flex: 1`, `textAlign: center`.

Right slot:
- If `rightAction` is provided: label text, 13px/600, `colors.semantic.primary` — `#0A84FF`. Tappable.
- If `rightAction` is null: empty `View` with `minWidth: 60px` as a balance spacer. This spacer ensures the title remains visually centered when only "Cancel" occupies the left.

The left cancel label and the right action label must have matching visual widths to center the title accurately. Use `minWidth: 60px` on both left and right slots.

---

### Interaction Behavior

**Cancel tap:**
Immediate call to `onCancel`. No animation within the component — the modal's dismiss animation is handled by the system.

**Right action tap:**
Immediate call to `rightAction.onPress`. Same visual press feedback as Cancel (opacity drop to 0.7, instant recovery — handled by `Pressable`'s default behavior).

**Minimum touch target:**
Both the left and right interactive elements must have a minimum touch target of `44px × 44px`. Use vertical padding to achieve this.

---

### States

```
STATE: rest (default)
  Visual:   Both left and right text labels at full opacity and default color

STATE: cancel-pressed
  Visual:   "Cancel" text at 0.7 opacity during press gesture
  Exit:     Finger lifts → full opacity + onCancel fires

STATE: action-pressed
  Visual:   Right action label at 0.7 opacity during press gesture
  Exit:     Finger lifts → full opacity + rightAction.onPress fires
```

---

### Accessibility Requirements

- `accessibilityRole: "header"` on the header container.
- Cancel button: `accessibilityRole: "button"`, `accessibilityLabel: "${cancelLabel}"`.
- Right action button (if present): `accessibilityRole: "button"`, `accessibilityLabel: "${rightAction.label}"`.
- Title: `accessibilityRole: "header"`, accessible to screen readers.
- Screen readers should announce the modal title when the modal opens — the ModalHeader is the first element in the accessibility order inside the modal.
- Minimum touch target enforced on both interactive slots.

---

---

## 10. MACROCHIP

### Purpose

A small colored badge displaying one macro nutrient's value and its unit label. Used inside `FoodItemCard` and `EntryCard` to present macro breakdowns in compact form.

---

### Props

```
macro: 'calories' | 'protein' | 'carbs' | 'fat'   REQUIRED
  Determines the color of all visual elements in the chip.

value: number   REQUIRED
  The numeric value to display.

unit: string   OPTIONAL
  The unit label displayed beside the value.
  Defaults per macro:
    calories → "kcal"
    protein  → "g"
    carbs    → "g"
    fat      → "g"
  Override only if the context requires a different unit (e.g., "mg" for sodium).

size: 'default' | 'compact'   OPTIONAL   default: 'default'
  'default': value 14px/700, label 11px/600
  'compact': value 13px/700, label 11px/600 (for use in entry card macro row)
```

---

### Visual Behavior

**Chip container:**
- Background: the macro's color at 8% opacity (e.g., for calories: `rgba(10,132,255,0.08)`)
- Border radius: `radius.sm` — `10px`
- Padding horizontal: `spacing.chip.padding-h` — `10px`
- Padding vertical: `spacing.chip.padding-v` — `5px`
- `flexDirection: row`, `alignItems: center`, `gap: 3px`

**Value text:**
- Size: `14px` (default) or `13px` (compact)
- Weight: `700`
- Color: the macro's full color token (e.g., `colors.macro.calories` — `#0A84FF`)

**Unit label text:**
- Size: `11px`
- Weight: `600`
- Color: the macro's color token at `0.80` opacity

**Color mapping:**
```
calories: background rgba(10,132,255,0.08),  text #0A84FF
protein:  background rgba(48,209,88,0.08),   text #30D158
carbs:    background rgba(90,200,250,0.08),  text #5AC8FA
fat:      background rgba(255,159,10,0.08),  text #FF9F0A
```

---

### Interaction Behavior

**None.** `MacroChip` is a display-only element. It has no press state, no interaction, no callback props.

---

### States

`MacroChip` has only one state: display. The `macro` and `value` props change its appearance, but there are no interaction states.

---

### Accessibility Requirements

- `MacroChip` must be individually accessible only when used in contexts where surrounding text does not already describe the values.
- When used inside `FoodItemCard`: `importantForAccessibility: 'no'` — the card-level label covers this content.
- When used standalone (not inside `FoodItemCard`): `accessibilityLabel: "${value} ${unit} ${macroName}"` — e.g., `"88 kcal calories"`.
- Contrast: all macro color text on their respective 8% opacity backgrounds. The contrast ratio may be below 4.5:1 for secondary chip labels (11px at 80% opacity). Acceptable because the chip is supplementary information always accompanied by higher-contrast text in surrounding context.

---

---

## 11. MEALCHIP

### Purpose

A selectable label representing a meal category (Breakfast, Lunch, Dinner, Snack). Appears in the Log Food modal as part of a single-select group. Exactly one chip is selected at a time within its group, or no chip is selected.

---

### Props

```
label: string   REQUIRED
  The chip text. e.g. "Breakfast", "Lunch", "Dinner", "Snack".

selected: boolean   REQUIRED
  Whether this chip is the currently selected meal.

onPress: () => void   REQUIRED
  Called when the chip is tapped.
  The parent manages which chip is selected — MealChip itself has no state.
```

---

### Visual Behavior

**Inactive state (selected: false):**
- Background: `colors.background.surface` — `#1C1C1E`
- Border: `1px`, `colors.border.default` — `rgba(84,84,88,0.65)`
- Border radius: `radius.sm` — `10px`
- Text: label string, 13px/500, `colors.text.secondary` — `#98989D`
- Padding: horizontal `spacing.3` (12px), vertical `spacing.2` (8px)

**Active state (selected: true):**
- Background: `colors.interactive.meal-chip-active-fill` — `rgba(10,132,255,0.15)`
- Border: `1px`, `colors.semantic.primary` — `#0A84FF`
- Border radius: `radius.sm` — `10px`
- Text: label string, 13px/600, `colors.semantic.primary` — `#0A84FF`
- Padding: same as inactive (chip does not resize on selection)

**Transition between states:** Instant. No animation on selection — the tap feedback is sufficient. The entire group of chips fits in one row (or wraps); the visual state change is immediate.

---

### Interaction Behavior

**Tap:**
If not selected: calls `onPress`. The parent selects this chip and deselects any previously selected chip in the group.

If already selected: behavior depends on the parent. The component always calls `onPress` regardless — it does not prevent re-selection of an already-active chip.

**Press animation:** None. The chip is small enough that a scale animation would feel heavy. The instant color change on selection is the feedback.

---

### States

```
STATE: inactive (default)
  Trigger:   selected prop is false
  Visual:    Surface color, border default, text secondary

STATE: active
  Trigger:   selected prop is true
  Visual:    Blue fill, blue border, blue text (weight 600)
  Transition: Instant (no animation)
```

---

### Accessibility Requirements

- `accessibilityRole: "radio"` — meal chips are a mutually exclusive selection group.
- `accessibilityState: { checked: selected }` on each chip.
- `accessibilityLabel`: the `label` prop value — e.g., `"Breakfast"`.
- The group container should have `accessibilityRole: "radiogroup"` and `accessibilityLabel: "Meal type"`.
- When a chip becomes selected: announce `"${label} selected"` via `accessibilityLiveRegion: "polite"` on the chip or the group container.
- Minimum touch target: `44px × 44px`. Use padding to achieve this — the visible chip can be smaller.

---

---

## 12. EMPTYSTATE

### Purpose

Displayed in place of content when a list or view has no items to show. Provides an icon, a title, and an optional call-to-action text that guides the user toward the action that will populate the view.

---

### Props

```
icon: string   REQUIRED
  Ionicons icon name to display. e.g. "restaurant-outline", "calendar-outline".

title: string   REQUIRED
  The primary empty-state message. e.g. "No entries yet."

cta: string   OPTIONAL   default: undefined
  A secondary guidance string below the title. e.g. "Tap + to log a meal."
  When undefined, only the icon and title are rendered.

paddingVertical: number   OPTIONAL   default: spacing.16 (64px)
  Controls the vertical breathing room around the empty state.
  Useful for fitting within different container heights.
```

---

### Visual Behavior

**Layout:**
`alignItems: center` vertical stack. The empty state is always centered horizontally and does not span the full screen height — it has top and bottom padding that gives it breathing room.

**Icon:**
Ionicons icon, `40px`, `colors.text.disabled` — `#636366`. No background, no border, no shadow.
Margin bottom: `spacing.3` — `12px`

**Title:**
`typography.style.body-emphasis` (15px/600), `colors.text.secondary` — `#98989D`.
`textAlign: center`. Max width: `240px` to prevent very long empty-state messages from spanning the full screen width.

**CTA text (optional):**
`typography.style.caption` (13px/500), `colors.text.disabled` — `#636366`.
`textAlign: center`. Margin top: `spacing.1` — `4px`.

**Background:** transparent — the component inherits the screen's `colors.background.base`.

**No button, no card, no border.** The EmptyState is intentionally quiet. It communicates availability rather than demanding action.

---

### Interaction Behavior

**None.** `EmptyState` is display-only. The CTA text is plain text — not a tappable link or button.

The parent is responsible for any interaction that responds to the empty state (e.g., the FAB on Entries screen, or the Analyze button on Home screen).

---

### States

`EmptyState` has one state: display. It either renders or does not. No interaction states.

The `icon`, `title`, and `cta` props configure which empty state is shown — the component has no internal state.

**Context-specific configurations:**

*Entries screen — no entries for selected day:*
- icon: `"restaurant-outline"`
- title: `"No entries for this day."`
- cta: `"Tap + to log a meal."`

*Home screen — no analysis result yet:*
- icon: `"create-outline"`
- title: `"No entries yet."`
- cta: `"Describe what you ate and tap Analyze."`

*Any screen — loading data:*
- Do not show EmptyState during loading. Use the loading state of the list (e.g., `isLoading` on DailyProgress, or a simple activity indicator). EmptyState appears only after loading is confirmed complete and no data exists.

---

### Accessibility Requirements

- `accessibilityRole: "text"` on the container — it is informational content, not a control.
- `accessibilityLabel`: `"${title}${cta ? ' ' + cta : ''}"` — concatenated as a single label so screen readers announce both in one pass.
- Icon: `importantForAccessibility: 'no'` — the icon is decorative; its meaning is conveyed by the title.
- The CTA text, if present, is included in the container's accessibility label — it does not need a separate `accessibilityLabel`.

---

---

## COMPONENT RELATIONSHIP MAP

How components nest and reference each other:

```
Home Screen
  └── DailyProgress
        └── [4 progress rings — internal, not a named component]
  └── FoodEntry
  └── OilSlider
  └── AnalysisResultCard
        └── MacroChip × 4  (one per macro, in macro edit row)
        └── FoodItemCard × N  (one per food item)
              └── MacroChip × 4
  └── EmptyState  (when no result)
  └── FloatingTabBar  (always visible, absolute positioned)

Entries Screen
  └── DayPickerPill × 7  (internal to Entries — not a named component)
  └── EntryCard × N
        └── MacroChip × 4  (in compact size mode)
  └── EmptyState  (when no entries for day)
  └── FloatingTabBar  (always visible)

Log Food Modal
  └── ModalHeader  (cancel + title + spacer)
  └── FoodEntry
  └── MealChip × 4  (Breakfast, Lunch, Dinner, Snack)
  └── OilSlider
  └── AnalysisResultCard  (appears after analysis)
        └── FoodItemCard × N
              └── MacroChip × 4

Edit Entry Modal
  └── ModalHeader  (cancel + title + Save action)
  └── FoodEntry  (pre-populated)
  └── OilSlider  (pre-set)
  └── [Macro grid inputs — internal to modal, not a named component]

Settings Screen
  └── SettingsCard  (Targets — with inputs)
  └── SettingsCard  (About — static values)
  └── FloatingTabBar  (always visible)
```

---

## SHARED BEHAVIORAL RULES

Rules that apply across all components in this document:

**Press state minimum duration:**
Any press state (opacity reduction, scale compression) must be visible for at least one animation frame (~16ms). A press-and-immediate-release must still show the press state.

**Disabled opacity:**
When a component is disabled (not interactive), its opacity is `motion.opacity.disabled` — `0.4`. Do not change color, do not gray out, do not add a visual filter. Opacity-only dimming is the only disabled treatment permitted.

**Touch targets:**
Every tappable element must have a minimum touch area of `44px × 44px`. Use padding to achieve this. Small visual elements (chips, toggle labels, icon buttons) are commonly below this size — invisible padding is the fix.

**Pointer events on decorative elements:**
Every atmospheric layer, every decorative overlay, every non-interactive visual element must have `pointerEvents: 'none'`. Non-interactive elements that intercept touches are a critical bug.

**State announcement:**
When a component changes state in a way that is meaningful to the user (macro values update, ring fills change, tab selection changes), the new state is announced via `accessibilityLiveRegion: "polite"` — never `"assertive"` unless it is an error state requiring immediate attention.

**No animation on disabled elements:**
When a component is disabled, pending animations do not play. If the component is re-enabled while an animation is pending, the animation fires immediately to the end state, not replayed from the beginning.
