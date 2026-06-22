# WIREFRAMES.md — JC Food Tracker
### Layout Specification & Design Critique v1.0

> Generated against DESIGN.md v1.0. All spacing uses the 4px base unit. All measurements reference a 390px-wide device (iPhone 14/15 standard). Tab bar island = 342px wide (390 − 48). Safe area bottom inset assumed at 34px (iOS notched device).

---

## TABLE OF CONTENTS

1. [Floating Tab Bar Island](#1-floating-tab-bar-island)
2. [Home Screen](#2-home-screen)
3. [Daily Progress Card](#3-daily-progress-card)
4. [Analysis Result Card](#4-analysis-result-card)
5. [Entries Screen](#5-entries-screen)
6. [Settings Screen](#6-settings-screen)
7. [Log Food Modal](#7-log-food-modal)
8. [Edit Entry Modal](#8-edit-entry-modal)
9. [Layout Conflict Register](#9-layout-conflict-register)
10. [Challenges to DESIGN.md](#10-challenges-to-designmd)

---

## LEGEND

```
┌─ ─ ─ ─┐   dashed border = glass / BlurView surface
│        │
└─ ─ ─ ─┘

┌────────┐   solid border = opaque surface (Level 1 card)
│        │
└────────┘

· · · · ·   dots = atmospheric glow layer (Level −1)

╭────────╮   rounded corners = pill / large-radius element (radius-lg 24px)

[ text ]     brackets = interactive element (button, input, tap target)

{ text }     braces = label / static text element

■ ≡ ⚙       filled icons (active tab state)
□ ☰ ⚙̊       outline icons (inactive tab state)

▓▓▓▓░░░░   progress ring fill (▓ = filled arc, ░ = track)

⬡           ring placeholder in compact ASCII contexts

══════      divider line (rgba(255,255,255,0.08))

~           approximate / variable-height region
```

---

## 1. FLOATING TAB BAR ISLAND

### 1a. Layout Diagram

Device is 390px wide. Island is 342px wide, 64px tall, positioned 16px above safe area floor (16 + 34px inset = 50px from physical bottom edge).

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← physical screen bottom
│◄──────────────── 390px ─────────────────────►│
│                                               │
│     [34px safe area inset — iOS]             │
│                                               │
│           ← 16px gap above insets →           │
│                                               │
│  · · · · · · · · · · · · · · · · · · · · ·  │  ← atmospheric glow
│  ·  rgba(10,132,255,0.02) — 8px below island ·│     elongated ellipse
│  · · · · · · · · · · · · · · · · · · · · ·  │     h≈24px, left:40 right:40
│                                               │
│  ◄──24px──►◄──────── 342px ────────►◄──24px─►│
│            ╭──────────────────────────────╮   │
│            │ ▓▓▓▓▓ top highlight edge ▓▓▓▓ │  │  ← rgba(255,255,255,0.22)
│            │                              │  │     borderTopWidth: 0.5
│            │  ╭──────────╮               │  │
│            │  │ ■  Home  │ ≡  Entries  ⚙ Settings │  ← 64px tall
│            │  ╰──────────╯               │  │     active pill: rgba(10,132,255,0.15)
│            │                              │  │     borderRadius: 12
│            │ ░░░░░ bottom shadow edge ░░░░│  │  ← rgba(0,0,0,0.50)
│            ╰──────────────────────────────╯   │     borderBottomWidth: 0.5
│                                               │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Active tab item anatomy (114px wide each):**
```
    ╭─────────────────────╮
    │  ■  [icon 22px]     │   ← Ionicons filled variant
    │  { Home }           │   ← 11px / 600 / #0A84FF
    ╰─────────────────────╯
      ↑ blue capsule pill
        rgba(10,132,255,0.15)
        borderRadius: 12
        paddingH: 16, paddingV: 4
```

**Inactive tab item (114px wide each):**
```
    □  [icon 22px]         ← Ionicons outline variant / #636366
    { Entries }            ← 11px / 500 / #636366
```

---

### 1b. Component Tree

```
TabBarIsland (position: absolute, bottom: 50px, left: 24, right: 24)
  │
  ├── AtmosphericLayer (position: absolute, bottom: −8px, left: 16, right: 16)
  │     height: 24, borderRadius: 9999
  │     backgroundColor: rgba(10,132,255,0.02)
  │     pointerEvents: 'none'
  │
  └── BlurView (intensity: 36, tint: "dark", borderRadius: 24)
        backgroundColor: rgba(28,28,30,0.80)
        borderTopColor: rgba(255,255,255,0.22)
        borderBottomColor: rgba(0,0,0,0.50)
        │
        ├── TabItem — Home (width: ~114px)
        │     ├── ActivePill (conditional, borderRadius: 12)
        │     │     backgroundColor: rgba(10,132,255,0.15)
        │     ├── Icon (Ionicons "home" or "home-outline", size: 22)
        │     └── Label (Text, 11px/600 active, 11px/500 inactive)
        │
        ├── TabItem — Entries (width: ~114px)
        │     ├── ActivePill (conditional)
        │     ├── Icon (Ionicons "list-sharp" or "list-outline")
        │     └── Label
        │
        └── TabItem — Settings (width: ~114px)
              ├── ActivePill (conditional)
              ├── Icon (Ionicons "settings" or "settings-outline")
              └── Label
```

---

### 1c. Visual Hierarchy Ranking

```
RANK  ELEMENT                     VISUAL WEIGHT    REASON
────  ──────────────────────────  ───────────────  ───────────────────────────────────
 1    Active tab label + icon     Highest          #0A84FF on dark glass — dominant
 2    Active indicator capsule    High             Blue pill behind active item
 3    Island glass surface        Medium-High      Blur + specular top edge catches eye
 4    Inactive icons              Medium           #636366 outline — visible but quiet
 5    Inactive labels             Low              #636366 11px — barely perceptible
 6    Bottom shadow edge          Very Low         rgba(0,0,0,0.50) — depth cue only
 7    Atmospheric glow            Subliminal       rgba(0.02) — should not be noticed
```

---

### 1d. Interaction Notes

```
TAP:         Icon compresses to scale(0.92) immediately (0ms), springs back 0.92→1.06→1.0
             (spring: damping 20, stiffness 300, ~180ms total)

TRANSITION:  Active pill cross-fades between tabs — outgoing fades 0→1 over 120ms,
             incoming fades 0→1 over 120ms. No sliding position animation.

LAUNCH:      Island enters from translateY(+40) → 0, opacity 0→1, 400ms,
             Easing.out(Easing.back(1.2)), delayed 200ms after content loads.
             Runs ONCE per app launch, not on tab switch.

CONTENT PAD: All screens must have paddingBottom: 96px (space-24) to prevent
             the island from occluding the last card. This is the primary
             overcrowding risk — see §9.
```

---

---

## 2. HOME SCREEN

### 2a. Layout Diagram

```
┌────────────────────────────────────────────────┐ ← 390px × full height
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← STATUS BAR (44px iOS)
│                                                │
│  ←────────────────── 390px ──────────────────→ │
│                                                │
│  [8px marginTop]                               │
│                                                │
│  ← 16px →                        ← 16px →     │
│  · · · · · · · · · · · · · · · · · · · · · ·  │  ← DailyProgress aurora (4 ellipses)
│  · · · · · · · · · · · · · · · · · · · · · ·  │     subliminal, bleeds above card top
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ TOP HIGHLIGHT ▓▓▓▓▓▓▓│  │  ← rgba(255,255,255,0.16)
│  │                                          │  │
│  │  { Today }              { Mon, 16 Jun }  │  │  ← 22px/700 | 13px/500 #98989D
│  │                                          │  │
│  │  [16px inner padding]                    │  │
│  │                                          │  │
│  │   ⬡CAL    ⬡PRO    ⬡CRB    ⬡FAT          │  │  ← rings (CAL: r32, others: r28)
│  │  {1202}  { 125}  { 103}  {  30}         │  │  ← 18px/700, macro colors
│  │  {Cal  } {Pro  } {Carb } {Fat }         │  │  ← 11px/500, #98989D
│  │  {798↓ } { 25↓ } {147↓ } { 35↓}        │  │  ← 11px/400, #636366
│  │                                          │  │
│  │ ░░░░░░░░░░░░░░░░ BOTTOM SHADOW ░░░░░░░░ │  │  ← rgba(0,0,0,0.30)
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │  ← glass card, borderRadius: 16
│  · · · · · · · · [aurora bleeds below] · · ·  │
│                                                │
│  [24px gap — space-6]                          │
│                                                │
│  ← 16px →                        ← 16px →     │
│  { What did you eat? }                         │  ← 15px/600, #FFFFFF, label
│  [4px gap]                                     │
│  ┌──────────────────────────────────────────┐  │
│  │                                          │  │  ← multiline TextInput
│  │  { 2 eggs and toast with butter... }     │  │     mode: "outlined", radius-sm: 10
│  │                                          │  │     backgroundColor: #1C1C1E
│  │  ~ 3 lines min height ~                  │  │     activeBorderColor: #0A84FF
│  │                                          │  │
│  └──────────────────────────────────────────┘  │
│  { Describe what you ate in plain language }   │  ← 12px hint, #636366 (below input)
│                                                │
│  [16px gap — space-4]                          │
│                                                │
│  { Oil Level }        { 100% }                 │  ← 15px/600 | 15px/700 #0A84FF
│  ━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━━━  │  ← slider track + thumb
│  {NoOil} {Light} {Normal} {Oily} {V.Oily}     │  ← 11px/500, tick labels
│                                                │
│  [20px gap — space-5]                          │
│                                                │
│  ← 16px →                        ← 16px →     │
│  ╭──────────────────────╮ ╭──────────────────╮ │  ← button row, gap: 12px
│  │     [  Analyze  ]    │ │  [ Save Entry ]  │ │  ← 50/50 split
│  │    (#0A84FF filled)  │ │  (outlined blue) │ │  ← both radius-lg: 24
│  ╰──────────────────────╯ ╰──────────────────╯ │     height: ~48px
│                                                │
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  ← [ANALYSIS RESULT appears here]
│                                                │     (see §4 for detail)
│  ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ │  ← [EMPTY STATE appears here]
│  { ○ }  { No entries yet. }                   │     when no result loaded
│  { Tap Analyze to log your first meal. }       │     icon + text + CTA
│                                                │
│  [96px bottom padding — clears island]         │  ← space-24
│                                                │
└────────────────────────────────────────────────┘
│ · · · · · · · · · · · · · · · · · · · · · · · │ ← island atmospheric glow
│     ╭──────────────────────────────────────╮   │ ← ISLAND (always visible)
│     │  ■ Home    ≡ Entries    ⚙ Settings  │   │
│     ╰──────────────────────────────────────╯   │
│ ←24px→                              ←24px→     │
│  [16px + 34px safe inset]                      │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Home screen — analysis active state (after Analyze tap):**
```
│  [Loading state — inside button row area]      │
│  ╭──────────────────────╮ ╭──────────────────╮ │
│  │   [⟳ Analyzing...]   │ │  [ Save Entry ]  │ │  ← spinner inside Analyze button
│  │  (button holds size) │ │  (disabled: 0.4) │ │     button does NOT resize
│  ╰──────────────────────╯ ╰──────────────────╯ │
│                                                │
│  · · · · · · · [blue atmospheric glow] · · ·  │  ← rises with card
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │  ← Analysis Result card
│  │  (opacity 0→1, translateY +12→0, 220ms) │  │     enters from below button row
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
```

**Home screen — after Save (confirmation state):**
```
│  ╭──────────────────────╮ ╭──────────────────╮ │
│  │    [✓  Saved]        │ │  [ Save Entry ]  │ │  ← label crossfades 150ms
│  │ (rgba(48,209,88,0.20)│ │                  │ │     bg transitions 300ms
│  │  border: #30D158)    │ │                  │ │     resets after 1200ms
│  ╰──────────────────────╯ ╰──────────────────╯ │
```

---

### 2b. Component Tree

```
SwipeableTabScreen (Home)
  │
  └── KeyboardAvoidingView
        behavior: Platform.OS === 'android' ? 'height' : 'padding'
        │
        └── ScrollView
              keyboardShouldPersistTaps: 'handled'
              keyboardDismissMode: 'interactive'
              │
              ├── DailyProgressWrapper (position: relative, marginH: 16, marginTop: 8)
              │     ├── AuroraLayer × 4 (position: absolute, pointerEvents: none)
              │     │     Ellipse 1 — blue:  top: −20, opacity: 0.025
              │     │     Ellipse 2 — green: top: −10, opacity: 0.02
              │     │     Ellipse 3 — cyan:  bottom: −15, opacity: 0.02
              │     │     Ellipse 4 — amber: bottom: −20, opacity: 0.02
              │     └── DailyProgressCard (glass — see §3)
              │
              ├── [Spacer 24px]
              │
              ├── FoodEntrySection (paddingH: 16)
              │     ├── Label "What did you eat?" (Text, 15px/600)
              │     ├── [Spacer 4px]
              │     ├── FoodEntry (TextInput, multiline, outlined, radius-sm: 10)
              │     └── HintText (Text, 12px, #636366)
              │
              ├── OilSlider (paddingH: 16, paddingTop: 16)
              │     ├── HeaderRow
              │     │     ├── Label "Oil Level" (Text, 15px/600)
              │     │     └── ValueDisplay (Text, 15px/700, #0A84FF)
              │     ├── Slider (track + thumb)
              │     └── TickRow (5 labels, 11px/500)
              │
              ├── ButtonRow (paddingH: 16, paddingTop: 20, flexDirection: row, gap: 12)
              │     ├── AnalyzeButton (Pressable, contained, #0A84FF, radius-lg: 24, flex: 1)
              │     │     └── [Text "Analyze" OR ActivityIndicator]
              │     └── SaveEntryButton (Pressable, outlined, radius-lg: 24, flex: 1)
              │           └── Text "Save Entry"
              │
              ├── [Conditional: LoadingState]
              │     └── ActivityIndicator + Text "Analyzing..."
              │
              ├── [Conditional: AnalysisResultCard] (see §4)
              │     — appears with translateY + opacity animation
              │
              ├── [Conditional: EmptyState]
              │     ├── Icon (Ionicons, ~40px, #636366)
              │     ├── Title (Text, 15px/600, #98989D)
              │     └── CTA (Text, 13px/400, #636366)
              │
              └── [Spacer 96px — paddingBottom, clears island]

TabBarIsland (absolute, above ScrollView, always visible — see §1)
```

---

### 2c. Visual Hierarchy Ranking

```
RANK  ELEMENT                       VISUAL WEIGHT    RATIONALE
────  ────────────────────────────  ───────────────  ──────────────────────────────────
 1    DailyProgress ring values     Highest          18px/700, macro colors, animated
 2    DailyProgress glass card      High             Glass surface — highest content plane
 3    Analyze button                High             #0A84FF fill, full-width, eye anchor
 4    Aurora glow behind Progress   Medium           Subliminal; creates spatial depth
 5    FoodEntry input               Medium           Full width, outlined focus state
 6    Analysis Result card          Medium           Secondary glass; blue glow
 7    Oil slider                    Medium-Low       Unique element, moderate weight
 8    Save Entry button             Low              Outlined — visually secondary to Analyze
 9    "What did you eat?" label     Low              15px/600 but no color emphasis
10    Oil level labels (ticks)      Very Low         11px, #636366
11    Hint text below input         Very Low         12px, #636366
12    Empty state                   Very Low         Gray text + icon on black
13    Island                        Persistent       Always visible, anchored — not ranked
```

---

### 2d. Interaction Notes

```
FOCUS:        Tapping FoodEntry opens keyboard; KeyboardAvoidingView adjusts layout
              On Android: behavior="height" lifts content (not padding)
              On iOS: behavior="padding" adds padding below (native feel)

ANALYZE TAP:  Button compresses to scale(0.97) in 80ms; spinner appears in place
              Result card rises from +12px below buttons over 220ms after response
              ScrollView scrolls to bottom to reveal result

SAVE TAP:     "Save Entry" text crossfades to "✓ Saved" over 150ms
              Button bg transitions to rgba(48,209,88,0.20), border: #30D158 over 300ms
              After 1200ms: button fades back to default
              DailyProgress rings animate to new values with 60ms stagger

SWIPE:        Pan gesture handles left/right swipe to adjacent tabs (Entries ←→ Home)
              Gesture conflicts resolved via RNGH — home tab content does not block swipe
```

---

---

## 3. DAILY PROGRESS CARD

### 3a. Layout Diagram

Card is 358px wide (390 − 32px horizontal margin). Height approximately 140px depending on ring radii.

```
                                                     ← aurora bleeds ABOVE card
  · · [rgba(10,132,255,0.025)] · · · · · · · · · ·  ← Ellipse 1 (blue): w=80%, h=80px, top=−20
    · · · [rgba(48,209,88,0.02)] · · · · · · · ·    ← Ellipse 2 (green): w=65%, h=60px, top=−10

  ← 16px →                              ← 16px →
  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐
  │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ TOP HIGHLIGHT ▓▓▓▓▓▓▓▓▓▓ │  ← rgba(255,255,255,0.16), 0.5px
  │                                               │     BlurView intensity: 28
  │  { Today }                  { Mon, 16 Jun }  │  ← 22px/700 #FFF | 13px/500 #98989D
  │                                               │
  │  [20px inner padding]                         │
  │                                               │
  │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
  │  │                                          │  │  ← four rings in a row
  │  │  ▓▓▓ CAL  ▓▓▓ PRO  ░░░ CRB  ░░░ FAT   │  │     (BlurView region for context)
  │  │  r=32,sw5  r=28,sw4  r=28,sw4  r=28,sw4│  │
  │  │                                          │  │
  │  │  {1202}    { 125}    { 103}    {  30}   │  │  ← 18px/700, per-macro colors
  │  │  {  kcal}  {    g}   {    g}   {    g}  │  │     (implied unit — challenge: see §10)
  │  │  { Cal  }  { Pro }   { Carb}   { Fat }  │  │  ← 11px/500, #98989D
  │  │  { 798↓ }  {  25↓}   { 147↓}   {  35↓} │  │  ← 11px/400, #636366, "X left"
  │  │                                          │  │
  │  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
  │                                               │
  │ ░░░░░░░░░░░░░░░░░░ BOTTOM SHADOW ░░░░░░░░░░░ │  ← rgba(0,0,0,0.30), 0.5px
  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
                                                     ← aurora bleeds BELOW card
  · · [rgba(90,200,250,0.02)] · · · · · · · · · ·  ← Ellipse 3 (cyan): bottom=−15
  · · · [rgba(255,159,10,0.02)] · · · · · · · · ·  ← Ellipse 4 (amber): bottom=−20
```

**Ring row detail — single ring anatomy (Calories):**
```
         ┌──────────────────────────┐
         │   ╔════════════════╗    │
         │   ║   ▓▓▓▓▓▓▓     ║    │  ← colored arc (fill: #0A84FF)
         │   ║  ▓       ░░   ║    │  ← track (fill: rgba(10,132,255,0.13))
         │   ║  ▓   r=32 ░   ║    │
         │   ║  ▓       ░░   ║    │  ← strokeWidth: 5, strokeLinecap: round
         │   ║   ▓▓▓▓▓▓▓     ║    │  ← rotation: −90° (starts top)
         │   ╚════════════════╝    │
         │                         │
         │       { 1202 }          │  ← 18px/700, #0A84FF, centered below ring
         │       { Cal   }         │  ← 11px/500, #98989D
         │       { 798↓  }         │  ← 11px/400, #636366
         └──────────────────────────┘
          ↑ ring column width ≈ 80px
```

---

### 3b. Component Tree

```
DailyProgressWrapper (position: relative, marginH: 16, marginTop: 8)
  │
  ├── AuroraEllipse_1 (position: absolute)
  │     width: '80%', height: 80, top: −20, left: '−5%'
  │     backgroundColor: rgba(10,132,255,0.025)
  │     borderRadius: 9999, pointerEvents: none
  │
  ├── AuroraEllipse_2 (position: absolute)
  │     width: '65%', height: 60, top: −10, right: '−5%'
  │     backgroundColor: rgba(48,209,88,0.02)
  │
  ├── AuroraEllipse_3 (position: absolute)
  │     width: '60%', height: 55, bottom: −15, left: '−5%'
  │     backgroundColor: rgba(90,200,250,0.02)
  │
  ├── AuroraEllipse_4 (position: absolute)
  │     width: '50%', height: 50, bottom: −20, right: 0
  │     backgroundColor: rgba(255,159,10,0.02)
  │
  └── BlurView (primary glass surface)
        intensity: 28, tint: "dark"
        backgroundColor: rgba(28,28,30,0.72)
        borderRadius: 16
        borderTopColor: rgba(255,255,255,0.16), borderTopWidth: 0.5
        borderBottomColor: rgba(0,0,0,0.30), borderBottomWidth: 0.5
        overflow: hidden, padding: 20
        │
        ├── HeaderRow (flexDirection: row, justifyContent: space-between)
        │     ├── TodayLabel (Text, 22px/700, #FFFFFF)
        │     └── DateLabel (Text, 13px/500, #98989D)
        │
        └── RingRow (flexDirection: row, justifyContent: space-around, marginTop: 16)
              │
              ├── RingColumn — Calories (alignItems: center)
              │     ├── SVGRing (radius: 32, strokeWidth: 5, color: #0A84FF)
              │     │     Animated.Value → strokeDashoffset
              │     │     animates from prev value on save
              │     ├── ValueText (18px/700, #0A84FF)
              │     ├── LabelText (11px/500, #98989D)
              │     └── RemainingText (11px/400, #636366)
              │
              ├── RingColumn — Protein (color: #30D158, ring radius: 28, sw: 4)
              ├── RingColumn — Carbs   (color: #5AC8FA, ring radius: 28, sw: 4)
              └── RingColumn — Fat     (color: #FF9F0A, ring radius: 28, sw: 4)
```

---

### 3c. Visual Hierarchy Ranking

```
RANK  ELEMENT                     VISUAL WEIGHT    RATIONALE
────  ──────────────────────────  ───────────────  ─────────────────────────────────
 1    Calorie value (1202)        Highest          18px/700, #0A84FF — dominant
 2    Protein/Carbs/Fat values    High             18px/700, macro colors
 3    Calories ring arc           High             r=32 (larger), colored fill
 4    "Today" heading             Medium-High      22px/700 — title of card
 5    Other ring arcs             Medium           r=28, colored fill
 6    Macro labels (Cal/Pro…)     Low              11px/500, #98989D
 7    Remaining budget labels     Very Low         11px/400, #636366
 8    Date string                 Very Low         13px/500, #98989D — peripheral info
 9    Aurora glow                 Subliminal       Total opacity ~0.02–0.025
```

---

### 3d. Interaction Notes

```
DISPLAY ONLY:  Card is not tappable. No press state.

RING ANIMATION (on every Save):
  Each ring: strokeDashoffset animates from current → new
  Duration: 500ms per ring, Easing.out(Easing.cubic)
  Stagger: Calories → Protein → Carbs → Fat, 60ms between each
  Total cascade: ~680ms for all four rings
  CRITICAL: Ring animates from current value, NOT from zero on re-mount

OVERFLOW:      When a macro hits 100%, ring completes and value stays at color
               When a macro exceeds 100%, a small "!" appears next to value text
               Ring stays at 100% — does not wrap or overflow

MOUNT:         On first mount, rings animate from 0 → current value
```

---

---

## 4. ANALYSIS RESULT CARD

### 4a. Layout Diagram

Card appears below the button row after Analyze completes. Rises from +12px below with 220ms animation.

```
[Button row above — for spatial reference]
╭────────────────────────╮ ╭──────────────────╮
│      [ Analyze ]       │ │  [ Save Entry ]  │
╰────────────────────────╯ ╰──────────────────╯

[16px gap after buttons]

← atmosphere appears as card rises →

· · · · · · · · · · · · · · · · · · · · · · ·  ← AtmosphericLayer:
· rgba(10,132,255,0.025) — wider + taller than card ·    position: absolute
· · · · · · · · · · · · · · · · · · · · · · ·      width: '120%', left: '−10%'
                                                     height: '130%', top: '−15%'
← 16px →                              ← 16px →
┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐  ← glass BlurView
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ TOP HIGHLIGHT ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │    intensity: 24
│                                               │    borderRadius: 16
│  { Analysis Result }              ← 20px/700 │    padding: 16
│                                               │
│  [16px gap]                                   │
│                                               │
│  { Calories }  { Protein }  { Carbs }  { Fat}│  ← 12px, macro colors, labels
│                                               │
│  ┌──────────┐ ┌──────────┐ ┌────────┐ ┌────┐│  ← editable TextInputs
│  │  [ 88 ] │ │ [ 17.1 ] │ │ [  0 ] │ │[1.7]│     backgroundColor: #2C2C2E
│  └──────────┘ └──────────┘ └────────┘ └────┘│     borderRadius: 10 (radius-sm)
│                                               │     textAlign: center
│  ══════════════════════════════════════════  │  ← divider rgba(255,255,255,0.08)
│                                               │
│  { Food Items }                   ← 16px/600 │
│                                               │
│  [8px gap]                                    │
│                                               │
│  ┌───────────────────────────────────────┐   │  ← FoodItemCard (translucent)
│  │ { Chicken breast }        [Cooked]  │   │     backgroundColor: rgba(255,255,255,0.05)
│  │ { 1 piece · grilled · 55g }         │   │     borderRadius: 12 [NOTE: see §10]
│  │                                      │   │     borderColor: rgba(255,255,255,0.06)
│  │ ┌──────┐ ┌────┐ ┌────┐ ┌────┐       │   │
│  │ │88 Cal│ │17P │ │ 0C │ │ 2F │       │   │  ← macro chips inside card
│  │ └──────┘ └────┘ └────┘ └────┘       │   │     radius-sm: 10
│  └───────────────────────────────────────┘   │
│                                               │
│  [+ additional FoodItemCards if multiple]     │
│  [gap: 8px between cards]                     │
│                                               │
│ ░░░░░░░░░░░░░░░░░░ BOTTOM SHADOW ░░░░░░░░░░░ │  ← rgba(0,0,0,0.25)
└ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘
· · · · · · [blue glow bleeds below] · · · · ·
```

**FoodItemCard anatomy (translucent, inside glass panel):**
```
┌──────────────────────────────────────────────────┐
│ { Chicken breast }                  [  Cooked  ] │  ← food name 15px/600 | toggle chip
│ { 1 piece · grilled · 55g }                      │  ← 13px/400, #98989D
│                                                   │
│ ┌──────────┐  ┌──────┐  ┌──────┐  ┌──────┐      │
│ │ 88  kcal │  │ 17g P│  │  0g C│  │  2g F│      │  ← macro chips
│ └──────────┘  └──────┘  └──────┘  └──────┘      │  ← backgroundColor: color+'15'
└──────────────────────────────────────────────────┘    borderRadius: 10
```

---

### 4b. Component Tree

```
AnalysisResultWrapper (position: relative, marginH: 16, marginTop: 16)
  Animated.View (opacity: 0→1, translateY: 12→0, 220ms, Easing.out.cubic)
  │
  ├── AtmosphericLayer (position: absolute)
  │     width: '120%', height: '130%', left: '−10%', top: '−15%'
  │     backgroundColor: rgba(10,132,255,0.025)
  │     borderRadius: 9999, pointerEvents: none
  │
  └── BlurView (secondary glass)
        intensity: 24, tint: "dark"
        backgroundColor: rgba(28,28,30,0.72)
        borderRadius: 16
        borderTopColor: rgba(255,255,255,0.14)
        borderBottomColor: rgba(0,0,0,0.25)
        overflow: hidden, padding: 16
        │
        ├── SectionHeader "Analysis Result" (Text, 20px/700)
        │
        ├── [Spacer 16px]
        │
        ├── MacroEditRow (flexDirection: row, gap: 8)
        │     ├── MacroEditColumn — Calories
        │     │     ├── Label (Text, 12px, #0A84FF)
        │     │     └── TextInput (numeric, radius-sm: 10, bg: #2C2C2E)
        │     ├── MacroEditColumn — Protein
        │     ├── MacroEditColumn — Carbs
        │     └── MacroEditColumn — Fat
        │
        ├── Divider (height: 1, rgba(255,255,255,0.08), marginV: 12)
        │
        ├── SectionHeader "Food Items" (Text, 16px/600)
        │
        ├── [Spacer 8px]
        │
        └── FoodItemList (gap: 8)
              └── FoodItemCard × N (translucent surface)
                    backgroundColor: rgba(255,255,255,0.05)
                    borderRadius: 12 [← see §10 challenge]
                    borderColor: rgba(255,255,255,0.06)
                    │
                    ├── HeaderRow
                    │     ├── FoodName (Text, 15px/600)
                    │     └── RawCookedToggle (chip, radius-sm: 10)
                    ├── PortionText (Text, 13px/400, #98989D)
                    └── MacroChipRow (gap: 8)
                          └── MacroChip × 4 (radius-sm: 10)
```

---

### 4c. Visual Hierarchy Ranking

```
RANK  ELEMENT                     VISUAL WEIGHT    RATIONALE
────  ──────────────────────────  ───────────────  ────────────────────────────────
 1    Glass card surface          Highest          BlurView — second glass plane on screen
 2    "Analysis Result" heading   High             20px/700 — clear entry into section
 3    Macro edit inputs           High             Editable; draws eye as interactive
 4    Calorie value input         High             First macro — implied priority
 5    Food name in item card      Medium           15px/600 — main description
 6    "Food Items" subheading     Medium           16px/600 — clear subsection break
 7    Macro chips (colored)       Medium           Color-coded but small (13–14px)
 8    Portion text                Low              13px/400, #98989D
 9    Divider                     Very Low         rgba 0.08 — structural, not focal
10    Atmospheric glow            Subliminal       rgba 0.025 single ellipse
```

---

### 4d. Interaction Notes

```
APPEARANCE:     Triggered by Analyze button response
                Animated: opacity 0→1, translateY +12→0, 220ms, Easing.out(cubic)
                Delay: 0ms after result ready — starts immediately
                Card rises from BELOW the button row (not from top, not from edge)

MACRO EDITING:  Tapping any macro input focuses it + shows numeric keypad
                ScrollView scrolls to keep input visible above keyboard
                No explicit "confirm" for inline edit — value updates on change

FOOD ITEMS:     Multiple FoodItemCard elements when AI returns plural items
                Cards appear simultaneously with the glass panel (no stagger)
                Raw/Cooked toggle is per-item — tapping recalculates that item's macros

STATE RESET:    After Save Entry is confirmed, AnalysisResultCard unmounts
                and EmptyState re-mounts (or DailyProgress update is the signal)

ERROR BANNER:   If Gemini fails and local fallback used, small banner above card:
                { ⚠ Estimated locally · AI unavailable }
                13px/400, #98989D — not styled as an error (low urgency)
```

---

---

## 5. ENTRIES SCREEN

### 5a. Layout Diagram

```
┌────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← STATUS BAR
│                                                │
│  · · · · · · · · [day picker glow] · · · · ·  │ ← day picker atmospheric layer
│                                                │
│  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐ │ ← DAY PICKER (glass, sticky)
│  │ ▓▓▓▓▓▓▓▓▓▓▓▓ TOP HIGHLIGHT ▓▓▓▓▓▓▓▓▓▓▓▓ │ │   BlurView, intensity: 28
│  │                                            │ │
│  │ [Mon] [Tue] [Wed] [Thu] ╔[Fri]╗ [Sat][Sun]│ │ ← day pills, paddingV: 10
│  │                         ╚═════╝            │ │   [Fri] = active: #0A84FF bg
│  │                                            │ │   [Mon–Thu] = inactive: rgba(255,255,255,0.08)
│  │ ░░░░░░░░░░░░ BOTTOM BORDER ░░░░░░░░░░░░░  │ │   today (if different from active):
│  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘ │   border: 1px #0A84FF, bg: rgba(255,255,255,0.08)
│                                                │   pills: radius-sm: 10, paddingH: 20
│  [8px gap]                                     │
│                                                │
│  [Optional: date sub-header when not today]    │
│  { 14 June 2025 }  ← 13px/600 uppercase #98989D│
│                                                │
│  ← 16px →                        ← 16px →     │
│  ┌──────────────────────────────────────────┐  │
│  │ { 8:19 pm }     {462kcal} {76g} {8g} {12g}│ │ ← LOG CARD (Level 1 surface)
│  │                                          │  │   bg: #1C1C1E, radius-md: 16
│  │ { 1 eggs, 4 piece boiled chicken,        │  │   borderColor: rgba(255,255,255,0.08)
│  │   0.25 rice cake }                       │  │   padding: 14, marginBottom: 8
│  └──────────────────────────────────────────┘  │   NOT a BlurView (performance fix)
│                                                │
│  [8px gap]                                     │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ { 3:43 pm }    {619kcal} {43g} {81g} {30g}│ │ ← LOG CARD 2
│  │                                          │  │
│  │ { 1.5 cups rice, 0.5 cup daal,           │  │
│  │   1 roti with butter }                   │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [8px gap]                                     │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ { 1:05 pm }    {340kcal} {28g} {22g} {18g}│ │ ← LOG CARD 3
│  │ { 2 rotis with sabzi, 1 cup curd }       │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [~ more cards scroll below ~]                 │
│                                                │
│                                    ╭────────╮  │  ← FAB
│                                    │   +    │  │    bg: #0A84FF, r: 24 (radius-lg)
│                                    ╰────────╯  │    56×56px
│                                                │    shadow: #0A84FF glow
│  [96px bottom padding — clears island + FAB]   │    bottom: 16 + island height
│                                                │    right: 24 (aligned to island edge)
└────────────────────────────────────────────────┘
│ · · · · · · [island atmospheric glow] · · · · │
│     ╭──────────────────────────────────────╮   │
│     │  □ Home    ■ Entries    ⚙ Settings   │   │ ← island, Entries active
│     ╰──────────────────────────────────────╯   │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Entry card detail — macro label row:**
```
┌─────────────────────────────────────────────────────┐
│ { 8:19 pm }          {462kcal}  {76g}  {8g}  {12g} │
│  13px/500 #98989D    13px/700   600    600    600    │
│                      #0A84FF    #30D158 #5AC8FA #FF9F0A
│                                                     │
│ { 1 eggs, 4 piece boiled chicken, 0.25 rice cake }  │
│   15px/400 #FFFFFF, max 2 lines, ellipsis          │
└─────────────────────────────────────────────────────┘
```

**Empty state (no entries for selected day):**
```
│                                                │
│             ╭──────────────────╮              │
│             │    {  icon  }    │              │  ← Ionicons ~40px, #636366
│             │                  │              │
│             │ { No entries for │              │  ← 15px/600, #98989D
│             │   this day. }    │              │
│             │                  │              │
│             │ { Tap + to log   │              │  ← 13px/400, #636366
│             │   a meal. }      │              │
│             ╰──────────────────╯              │
│                                                │
│  [64px vertical padding — space-16 each side] │
```

---

### 5b. Component Tree

```
SwipeableTabScreen (Entries)
  │
  └── View (flex: 1)
        │
        ├── DayPickerWrapper (position: relative)
        │     ├── DayPickerAtmosphericLayer (position: absolute)
        │     │     backgroundColor: rgba(255,255,255,0.015)
        │     │     borderRadius: 9999
        │     └── DayPickerGlass (BlurView)
        │           intensity: 28, tint: "dark"
        │           paddingV: 10
        │           borderBottomColor: rgba(255,255,255,0.08)
        │           │
        │           └── ScrollView (horizontal, showsHorizontalScrollIndicator: false)
        │                 └── DayPill × 7 (Mon–Sun)
        │                       Active: bg #0A84FF, text #FFF, radius: 10
        │                       Inactive: bg rgba(255,255,255,0.08), text #98989D
        │                       Today+Inactive: border 1px #0A84FF
        │                       paddingH: 20, paddingV: 8
        │
        ├── [Conditional: DateSubHeader — when selected ≠ today]
        │     Text, 13px/600 uppercase, #98989D, paddingH: 16, paddingTop: 12
        │
        ├── ScrollView (flex: 1, paddingH: 16, paddingTop: 8)
        │     │
        │     ├── [Conditional: EntryCards list]
        │     │     └── LogCard × N (View — NOT BlurView)
        │     │           backgroundColor: #1C1C1E
        │     │           borderRadius: 16 (radius-md)
        │     │           borderColor: rgba(255,255,255,0.08)
        │     │           padding: 14, marginBottom: 8
        │     │           Pressable (tap → Edit modal, long-press → delete confirm)
        │     │           │
        │     │           ├── MetaRow (flexDirection: row, justifyContent: space-between)
        │     │           │     ├── TimeText (13px/500, #98989D)
        │     │           │     └── MacroRow (flexDirection: row, gap: 8)
        │     │           │           ├── Text "462kcal" (13px/700, #0A84FF)
        │     │           │           ├── Text "76g"    (13px/600, #30D158)
        │     │           │           ├── Text "8g"     (13px/600, #5AC8FA)
        │     │           │           └── Text "12g"    (13px/600, #FF9F0A)
        │     │           └── FoodText (15px/400, #FFF, numberOfLines: 2)
        │     │
        │     ├── [Conditional: EmptyState]
        │     │     ├── Icon (Ionicons, 40px, #636366)
        │     │     ├── Title (15px/600, #98989D)
        │     │     └── CTA (13px/400, #636366)
        │     │
        │     └── [Spacer 96px — paddingBottom]
        │
        ├── FAB (position: absolute, right: 24, bottom: 16 + 64 + 16 + insets.bottom)
        │     Pressable → opens Log Food Modal
        │     backgroundColor: #0A84FF, borderRadius: 24, size: 56×56
        │     shadow: color #0A84FF, elevation: 8
        │     └── Icon (Ionicons "plus", white, 24px)
        │
        ├── LogFoodModal (see §7)
        └── EditEntryModal (see §8)

TabBarIsland (absolute, see §1 — Entries tab active)
```

---

### 5c. Visual Hierarchy Ranking

```
RANK  ELEMENT                     VISUAL WEIGHT    RATIONALE
────  ──────────────────────────  ───────────────  ───────────────────────────────────
 1    FAB (+)                     Highest          Blue + shadow — only floating element
 2    Active day pill             High             #0A84FF filled — date context
 3    Day picker glass            High             BlurView — top of content hierarchy
 4    Calorie value per card      Medium-High      13px/700 #0A84FF — first macro read
 5    Food text per card          Medium           15px/400 #FFF — main content
 6    Timestamp per card          Low              13px/500 #98989D — secondary
 7    Protein/carbs/fat values    Low              13px/600 macro colors — detail
 8    Inactive day pills          Very Low         #98989D on dark chip
 9    Today indicator border      Very Low         1px #0A84FF border — subtle
10    Island (Entries active)     Persistent       Always visible, anchored
```

---

### 5d. Interaction Notes

```
DAY PILL TAP:     Instantly loads entries for that date — no animation on pill itself
                  (instant color change — tap feedback sufficient per DESIGN.md §11)
                  Date sub-header appears/disappears instantly when selected ≠ today

CARD TAP:         Opens Edit Entry Modal (animationType: "slide" from bottom)

CARD LONG-PRESS:  Delete confirmation (current behavior — keep; not redesigned here)

FAB TAP:          Opens Log Food Modal (animationType: "slide" from bottom)
                  Modal origin: rises from FAB position — bottom-sheet feel

SCROLL:           Day picker is NOT ScrollView-sticky (it sits in a View before the list)
                  DESIGN.md describes it as "sticky-style at top" but uses View layout,
                  not a true stickyHeader — content scrolls beneath it correctly

OVERCROWDING:     With 5+ entries and 96px bottom pad + island: last card is fully
                  visible. FAB at bottom: 16 + 64 + 16 = 96px above screen floor
                  This exactly equals the 96px bottom padding — snug but not occluded.
                  See §9 for conflict notes.
```

---

---

## 6. SETTINGS SCREEN

### 6a. Layout Diagram

```
┌────────────────────────────────────────────────┐
│ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← STATUS BAR
│                                                │
│  ← 16px →                        ← 16px →     │
│                                                │
│  [24px top padding — replaces removed title]   │
│                                                │  ← PAGE TITLE REMOVED
│                                                │     ("Settings" tab bar label = sufficient)
│  { DAILY NUTRITION TARGETS }                   │  ← 13px/500, UPPERCASE, letter-spacing: 0.5
│                                                │     marginBottom: 8
│  { Changes take effect immediately. }          │  ← 13px/400, #98989D
│                                                │
│  [8px gap]                                     │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ { Calories }            [ 2400 ]  {kcal} │  │ ← settings row
│  ├──────────────────────────────────────────┤  │   paddingH: 16, paddingV: 14
│  │ { Protein  }            [  150 ]  {g   } │  │   divider: 1px, rgba(84,84,88,0.65)
│  ├──────────────────────────────────────────┤  │   marginLeft: 16 (iOS inset pattern)
│  │ { Carbs    }            [  330 ]  {g   } │  │   input: bg #2C2C2E, radius-sm: 10
│  ├──────────────────────────────────────────┤  │   minWidth: 80, maxWidth: 110
│  │ { Fat      }            [   70 ]  {g   } │  │   textAlign: right
│  └──────────────────────────────────────────┘  │   card: bg #1C1C1E, radius-md: 16
│                                                │
│  [20px gap — space-5]                          │
│                                                │
│  ╭──────────────────────────────────────────╮  │
│  │           [ Save Settings ]              │  │  ← contained button
│  ╰──────────────────────────────────────────╯  │    #0A84FF fill, radius-lg: 24
│                                                │    15px/600, ~48px height
│  [24px gap — space-6]                          │
│                                                │
│  { ABOUT }                                     │  ← 13px/500, UPPERCASE, letter-spacing: 0.5
│                                                │     marginBottom: 8
│  [8px gap]                                     │
│                                                │
│  ┌──────────────────────────────────────────┐  │
│  │ { App }                          { JC  } │  │  ← about row
│  ├──────────────────────────────────────────┤  │
│  │ { Data }          { Stored on this device│  │  ← right text: 13px/400, #98989D
│  ├──────────────────────────────────────────┤  │
│  │ { Analysis }    { AI + Local data        │  │
│  └──────────────────────────────────────────┘  │
│                                                │
│  [~ remaining scroll space ~]                  │
│                                                │
│  [96px bottom padding — clears island]         │
│                                                │
└────────────────────────────────────────────────┘
│ · · · · · · [island atmospheric glow] · · · · │
│     ╭──────────────────────────────────────╮   │
│     │  □ Home    □ Entries    ■ Settings   │   │  ← Settings active
│     ╰──────────────────────────────────────╯   │
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**Settings row — input detail:**
```
┌─────────────────────────────────────────────────────┐
│ { Calories }                      ┌──────┐  {kcal}  │
│  15px/400 #FFFFFF                 │ 2400 │          │
│                                   └──────┘          │
│                                    80–110px          │
│                                    bg: #2C2C2E       │
│                                    textAlign: right  │
└─────────────────────────────────────────────────────┘
                                     ↑ radius-sm: 10
```

---

### 6b. Component Tree

```
SwipeableTabScreen (Settings)
  │
  └── ScrollView (paddingH: 16, paddingTop: 24)
        │
        ├── SectionLabel "DAILY NUTRITION TARGETS"
        │     (Text, 13px/500, uppercase, letter-spacing: 0.5, marginBottom: 8)
        │
        ├── HintText "Changes take effect immediately."
        │     (Text, 13px/400, #98989D, marginBottom: 8)
        │
        ├── TargetsCard (View)
        │     backgroundColor: #1C1C1E, borderRadius: 16
        │     borderColor: rgba(255,255,255,0.08)
        │     │
        │     ├── SettingsRow — Calories
        │     │     ├── Label (Text, 15px/400, #FFF)
        │     │     ├── TextInput (numeric, bg: #2C2C2E, textAlign: right)
        │     │     │     minWidth: 80, maxWidth: 110, borderRadius: 10
        │     │     └── UnitLabel (Text, 13px/400, #98989D, "kcal")
        │     │
        │     ├── RowDivider (height: 1, rgba(84,84,88,0.65), marginLeft: 16)
        │     ├── SettingsRow — Protein  (unit: "g")
        │     ├── RowDivider
        │     ├── SettingsRow — Carbs    (unit: "g")
        │     ├── RowDivider
        │     └── SettingsRow — Fat      (unit: "g")
        │
        ├── [Spacer 20px]
        │
        ├── SaveSettingsButton (Pressable, contained, #0A84FF, radius-lg: 24)
        │     → Shows RNP Snackbar on success (not Alert.alert)
        │
        ├── [Spacer 24px]
        │
        ├── SectionLabel "ABOUT"
        │     (Text, 13px/500, uppercase, marginBottom: 8)
        │
        ├── AboutCard (View)
        │     backgroundColor: #1C1C1E, borderRadius: 16
        │     │
        │     ├── AboutRow — App    (right value: "JC")
        │     ├── RowDivider
        │     ├── AboutRow — Data   (right: "Stored on this device")
        │     ├── RowDivider
        │     └── AboutRow — Analysis (right: "AI + Local data")
        │
        └── [Spacer 96px — paddingBottom]

TabBarIsland (absolute, Settings active — see §1)
```

---

### 6c. Visual Hierarchy Ranking

```
RANK  ELEMENT                     VISUAL WEIGHT    RATIONALE
────  ──────────────────────────  ───────────────  ────────────────────────────────
 1    Save Settings button        Highest          #0A84FF filled — only CTA on screen
 2    Input fields (4 targets)    High             Interactive; user attention needed
 3    Input values (numbers)      Medium-High      Right-aligned, #2C2C2E background
 4    "DAILY NUTRITION TARGETS"   Medium           Uppercase + letter-spacing
 5    Row labels (Calories, etc.) Medium           15px/400 white — readable
 6    Unit labels (kcal, g)       Low              13px/400 #98989D
 7    Hint text                   Low              13px/400 #98989D
 8    "ABOUT" section label       Very Low         Secondary section
 9    About row values            Very Low         Static info, gray
10    Island (Settings active)    Persistent
```

---

### 6d. Interaction Notes

```
INPUT FOCUS:   Tapping input focuses it; numeric keypad appears
               ScrollView should scroll to keep focused input above keyboard
               KeyboardAvoidingView: same platform-specific fix as Home screen

SAVE TAP:      RNP Snackbar appears: "Settings saved" (not Alert.alert)
               Snackbar duration: ~2000ms, dismissible
               No animation on form — values stay populated after save

NO PAGE TITLE: "Settings" text appears only in the island label.
               The 28px page title from the current app is removed.
               First text on page is the "DAILY NUTRITION TARGETS" section label.
               ~48px of vertical space is recovered.
```

---

---

## 7. LOG FOOD MODAL

### 7a. Layout Diagram

Modal is a bottom sheet / full-screen modal that slides up from the FAB.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← screen top
╔══════════════════════════════════════════════╗
║  ░░░░░░░░░░ MODAL HEADER (glass) ░░░░░░░░░░ ║  ← BlurView, intensity: 28
║  ▓▓▓▓▓▓▓▓▓▓ TOP HIGHLIGHT ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║  ← rgba(255,255,255,0.14+)
║                                              ║
║  [Cancel]        { Log Food }       [      ] ║  ← three-part header layout
║   13px #0A84FF   17px/600 #FFF     (empty   ║     left: Cancel text button
║                                    View      ║     center: modal title
║                                    ~60px)    ║     right: empty View (balance)
║                                              ║
╠══════════════════════════════════════════════╣
║  ░░░░░░░░░░░ MODAL CONTENT (bg-base) ░░░░░░ ║  ← backgroundColor: #0C0C0E
║                                              ║
║  [16px horizontal padding]                   ║
║                                              ║
║  { What did you eat? }                       ║  ← 15px/600, auto-focus on open
║  [4px gap]                                   ║
║  ┌──────────────────────────────────────┐    ║
║  │                                      │    ║  ← TextInput, multiline
║  │  { 2 rotis, sabzi, rice... }         │    ║     mode: outlined, radius-sm: 10
║  │                                      │    ║     auto-focused on modal open
║  └──────────────────────────────────────┘    ║
║                                              ║
║  [12px gap]                                  ║
║                                              ║
║  { Meal }                                    ║  ← 13px/500 uppercase label
║  [Breakfast] [Lunch] [Dinner] [Snack]        ║  ← meal chips, radius-sm: 10
║   inactive: #1C1C1E border    active: #0A84FF║     gap: 8px
║                                              ║
║  [12px gap]                                  ║
║                                              ║
║  { Time }                                    ║  ← 15px/600 label
║  ┌──────────────────────────────────────┐    ║
║  │ { 08:19 PM }                         │    ║  ← time input, radius-sm: 10
║  └──────────────────────────────────────┘    ║
║                                              ║
║  [16px gap]                                  ║
║                                              ║
║  { Oil Level }        { 100% }               ║  ← 15px/600 | 15px/700 #0A84FF
║  ━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━   ║
║  {NoOil}{Light}{Normal}{Oily}{V.Oily}        ║  ← 11px/500 ticks
║                                              ║
║  [20px gap]                                  ║
║                                              ║
║  ╭──────────────────────────────────────╮    ║  ← Analyze button
║  │            [ Analyze ]               │    ║    #0A84FF, full-width, radius-lg: 24
║  ╰──────────────────────────────────────╯    ║    enabled only when food text non-empty
║                                              ║
║  [16px gap]                                  ║
║                                              ║
║  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┐   ║
║  │ [Analysis Result card — same as §4]  │   ║  ← secondary glass card
║  └ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ─ ┘   ║    inside modal scroll area
║                                              ║
║  [16px gap]                                  ║
║                                              ║
║  ╭──────────────────────────────────────╮    ║  ← Save Entry button
║  │          [ Save Entry ]              │    ║    appears after analysis result
║  ╰──────────────────────────────────────╯    ║    same #0A84FF, radius-lg: 24
║                                              ║
║  [48px bottom padding — space-12]            ║
║                                              ║
╚══════════════════════════════════════════════╝
```

**Three-part header anatomy:**
```
╔══════════════════════════════════════════════════════╗
║  padH: 16                                            ║
║  padTop: safeArea.top + 8 (iOS) or 16 (Android)      ║
║  padBottom: 12                                        ║
║  flexDirection: row, justifyContent: space-between    ║
║                                                       ║
║  [Cancel]          { Log Food }          [          ] ║
║  ← text button      17px/600 #FFF         View       ║
║    13px #0A84FF     textAlign: center     ~60px wide  ║
║    touchable        flex: 1               (balance)   ║
╚══════════════════════════════════════════════════════╝
```

---

### 7b. Component Tree

```
Modal (animationType: "slide", presentationStyle: "pageSheet")
  │
  └── KeyboardAvoidingView
        │
        └── View (flex: 1, bg: #0C0C0E)
              │
              ├── ModalHeader (BlurView, intensity: 28)
              │     borderTopColor: rgba(255,255,255,0.14+)
              │     flexDirection: row, justifyContent: space-between
              │     │
              │     ├── CancelButton (Text/Pressable, 13px, #0A84FF)
              │     │     → dismisses modal, no save
              │     ├── TitleText "Log Food" (Text, 17px/600, flex: 1, textAlign: center)
              │     └── BalancerView (View, width: ~60px)
              │
              └── ScrollView (flex: 1, padding: 16)
                    auto-focus FoodEntry on modal mount
                    │
                    ├── FoodEntryLabel "What did you eat?" (15px/600)
                    ├── [Spacer 4px]
                    ├── FoodEntry (TextInput, multiline, outlined, autoFocus: true)
                    │
                    ├── [Spacer 12px]
                    │
                    ├── MealLabel "MEAL" (13px/500, uppercase)
                    ├── MealChipRow (flexDirection: row, gap: 8, flexWrap: wrap)
                    │     └── MealChip × 4 (Breakfast/Lunch/Dinner/Snack)
                    │           inactive: bg #1C1C1E, border rgba(84,84,88,0.65)
                    │           active: bg #0A84FF15, border #0A84FF, text #0A84FF
                    │           radius-sm: 10
                    │
                    ├── [Spacer 12px]
                    │
                    ├── TimeLabel "TIME" (15px/600)
                    ├── TimeInput (TextInput, outlined, radius-sm: 10)
                    │
                    ├── [Spacer 16px]
                    │
                    ├── OilSlider (same as Home screen)
                    │
                    ├── [Spacer 20px]
                    │
                    ├── AnalyzeButton (Pressable, contained, #0A84FF, radius-lg: 24)
                    │     disabled when FoodEntry is empty (opacity: 0.4)
                    │     loading: spinner inside, button holds size
                    │
                    ├── [Spacer 16px]
                    │
                    ├── [Conditional: AnalysisResultCard — see §4]
                    │     same animation: opacity + translateY
                    │
                    ├── [Spacer 16px]
                    │
                    ├── [Conditional: SaveEntryButton]
                    │     Appears after analysis result, same #0A84FF full-width
                    │     → saves entry, dismisses modal, refreshes entries list
                    │
                    └── [Spacer 48px — paddingBottom]
```

---

### 7c. Visual Hierarchy Ranking

```
RANK  ELEMENT                     VISUAL WEIGHT    RATIONALE
────  ──────────────────────────  ───────────────  ──────────────────────────────────
 1    Analyze button              Highest          #0A84FF fill, full-width — CTA
 2    FoodEntry input             High             Auto-focused, primary input
 3    Modal header (glass)        High             Glass surface — structural anchor
 4    "Log Food" modal title      Medium-High      17px/600, centered, identity
 5    Analysis Result card        Medium           Secondary glass; appears after analyze
 6    Save Entry button           Medium           Below result — completion action
 7    OilSlider                   Medium-Low       Unique modifier — contextual
 8    Meal chips                  Low              Optional context, small radius-sm
 9    Time input                  Low              Optional; pre-filled
10    Cancel button               Very Low         Escape hatch — light text
11    Hint text                   Very Low         Instructional only
```

---

### 7d. Interaction Notes

```
AUTO-FOCUS:     FoodEntry TextInput auto-focuses when modal opens
                Keyboard appears immediately (avoids double-tap)

ANALYZE ENABLE: Analyze button is disabled (opacity: 0.4) when food text is empty
                Enabled as soon as any text is entered

RESULT SCROLL:  After analysis result appears, modal ScrollView scrolls to bottom
                to reveal result card and Save Entry button above keyboard

SAVE + DISMISS: Tapping Save Entry:
                1. Saves entry to DB
                2. Dismisses modal (system slide-down animation)
                3. Refreshes Entries screen list for selected day

CANCEL:         Dismisses without saving — no confirmation needed
                (food text is lost — acceptable for new entry modal)

KEYBOARD:       KeyboardAvoidingView inside modal handles keyboard intrusion
                behavior: Platform-specific (same fix as Home screen)
```

---

---

## 8. EDIT ENTRY MODAL

### 8a. Layout Diagram

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  ← screen top
╔══════════════════════════════════════════════╗
║  ░░░░░░░░░░ MODAL HEADER (glass) ░░░░░░░░░░ ║
║  ▓▓▓▓▓▓▓▓▓▓▓▓ TOP HIGHLIGHT ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ ║
║                                              ║
║  [Cancel]       { Edit Entry }      [Save]   ║  ← three-part header
║   13px #0A84FF   17px/600 #FFF   13px #0A84FF║     both Cancel + Save are tappable
║                                              ║     Save: textColor #0A84FF, fontWeight 600
╠══════════════════════════════════════════════╣
║  ░░░░░░░░░░░ MODAL CONTENT (bg-base) ░░░░░░ ║
║                                              ║
║  [16px horizontal padding]                   ║
║                                              ║
║  { Food Description }                        ║  ← 15px/600 label
║  ┌──────────────────────────────────────┐    ║
║  │  { 2 roti, sabzi, rice }             │    ║  ← TextInput, multiline
║  │  [pre-populated from saved entry]    │    ║     mode: outlined, radius-sm: 10
║  └──────────────────────────────────────┘    ║
║                                              ║
║  ╭──────────────────────────────────────╮    ║
║  │         [ Re-analyze ]               │    ║  ← outlined button (#0A84FF)
║  ╰──────────────────────────────────────╯    ║    re-runs AI on edited text
║                                              ║
║  [12px gap]                                  ║
║                                              ║
║  { Date }              { Time }              ║  ← 15px/600 labels, side by side
║  ┌───────────────┐  ┌───────────────┐        ║
║  │ { 14 Jun 2025}│  │ { 08:19 PM   }│        ║  ← date + time inputs
║  └───────────────┘  └───────────────┘        ║    radius-sm: 10
║                                              ║
║  ══════════════════════════════════════      ║  ← divider rgba(255,255,255,0.08)
║                                              ║
║  { Oil Level }        { 100% }               ║  ← 15px/600 | 15px/700 #0A84FF
║  ━━━━━━━━━━━━━━━━●━━━━━━━━━━━━━━━━━━━━━━━   ║    (pre-set to saved oil level)
║  {NoOil}{Light}{Normal}{Oily}{V.Oily}        ║
║                                              ║
║  ══════════════════════════════════════      ║  ← divider
║                                              ║
║  { MACROS }                                  ║  ← 13px/500 uppercase label
║                                              ║
║  ┌───────────────────┐  ┌───────────────────┐║
║  │ { Calories  }     │  │ { Protein  }      │║  ← 2×2 macro input grid
║  │  ┌───────────┐    │  │  ┌───────────┐   │║     each: label above, input below
║  │  │  [  88  ] │    │  │  │ [ 17.1  ] │   │║     backgroundColor: #2C2C2E
║  │  └───────────┘    │  │  └───────────┘   │║     radius-sm: 10
║  │  { kcal }         │  │  { g }            │║
║  └───────────────────┘  └───────────────────┘║
║  ┌───────────────────┐  ┌───────────────────┐║
║  │ { Carbs    }      │  │ { Fat      }      │║
║  │  ┌───────────┐    │  │  ┌───────────┐   │║
║  │  │  [   0  ] │    │  │  │  [ 1.7  ] │   │║
║  │  └───────────┘    │  │  └───────────┘   │║
║  │  { g }            │  │  { g }            │║
║  └───────────────────┘  └───────────────────┘║
║                                              ║
║  [32px gap — space-8]                        ║
║                                              ║
║  { Delete Entry }                            ║  ← RNP Button mode="text"
║   15px/600, #FF453A                          ║    textColor: #FF453A
║   full width, paddingV: 16                   ║    NO border, transparent bg
║   large touch target                         ║    NOT at screen bottom — center scroll
║                                              ║
║  [48px bottom padding — space-12]            ║
║                                              ║
╚══════════════════════════════════════════════╝
```

**Edit Entry header — contrast with Log Food header:**
```
LOG FOOD:    [Cancel]     { Log Food }     [         ]
                                           ↑ empty View (centering balance)

EDIT ENTRY:  [Cancel]     { Edit Entry }   [Save]
                                           ↑ active Save button (textColor #0A84FF)

Both use IDENTICAL header structure. Right slot: empty View vs. Save button.
Width of right slot ≈ 60px in both cases — keeps title centered.
```

**Macro input grid (2×2):**
```
┌──────────────────────┐   ┌──────────────────────┐
│  { Calories }        │   │  { Protein }          │
│  ┌────────────────┐  │   │  ┌────────────────┐   │
│  │     [ 88 ]     │  │   │  │   [ 17.1 ]     │   │
│  └────────────────┘  │   │  └────────────────┘   │
│  { kcal }            │   │  { g }                │
└──────────────────────┘   └──────────────────────┘
┌──────────────────────┐   ┌──────────────────────┐
│  { Carbs }           │   │  { Fat }              │
│  ┌────────────────┐  │   │  ┌────────────────┐   │
│  │     [ 0 ]      │  │   │  │   [ 1.7 ]      │   │
│  └────────────────┘  │   │  └────────────────┘   │
│  { g }               │   │  { g }                │
└──────────────────────┘   └──────────────────────┘
                gap: 12px between columns
                gap: 12px between rows
```

---

### 8b. Component Tree

```
Modal (animationType: "slide", presentationStyle: "pageSheet")
  │
  └── KeyboardAvoidingView
        │
        └── View (flex: 1, bg: #0C0C0E)
              │
              ├── ModalHeader (BlurView, intensity: 28 — identical structure to §7)
              │     flexDirection: row, justifyContent: space-between
              │     │
              │     ├── CancelButton (Text/Pressable, 13px, #0A84FF)
              │     │     → dismisses without saving
              │     ├── TitleText "Edit Entry" (Text, 17px/600, flex: 1, textAlign: center)
              │     └── SaveButton (Text/Pressable, 13px/600, #0A84FF)
              │           → saves changes (same behavior as form Save button)
              │
              └── ScrollView (flex: 1, padding: 16)
                    │
                    ├── FoodDescLabel "FOOD DESCRIPTION" (13px/500, uppercase)
                    ├── FoodDescInput (TextInput, multiline, outlined, radius-sm: 10)
                    │     pre-populated with saved food text
                    │
                    ├── [Spacer 12px]
                    │
                    ├── ReanalyzeButton (outlined, #0A84FF, radius-lg: 24)
                    │     → re-runs AI analysis on edited food text
                    │     → replaces macro values in MacroGrid below
                    │
                    ├── [Spacer 12px]
                    │
                    ├── DateTimeRow (flexDirection: row, gap: 12)
                    │     ├── DateLabel + DateInput (flex: 1, radius-sm: 10)
                    │     └── TimeLabel + TimeInput (flex: 1, radius-sm: 10)
                    │
                    ├── Divider (height: 1, rgba(255,255,255,0.08), marginV: 16)
                    │
                    ├── OilSlider (pre-set to saved value)
                    │
                    ├── Divider
                    │
                    ├── MacrosLabel "MACROS" (13px/500, uppercase, marginBottom: 8)
                    │
                    ├── MacroGrid (flexDirection: row, flexWrap: wrap, gap: 12)
                    │     └── MacroInputCell × 4
                    │           ├── MacroLabel (Text, 12px, macro color)
                    │           ├── TextInput (numeric, bg: #2C2C2E, radius-sm: 10)
                    │           │     pre-populated with saved macro values
                    │           └── UnitLabel (Text, 12px, #636366)
                    │
                    ├── [Spacer 32px]
                    │
                    ├── DeleteEntryButton (RNP Button mode="text", textColor: #FF453A)
                    │     → delete confirmation → removes entry → dismisses modal
                    │     NOT a plain Text in TouchableOpacity
                    │
                    └── [Spacer 48px]
```

---

### 8c. Visual Hierarchy Ranking

```
RANK  ELEMENT                     VISUAL WEIGHT    RATIONALE
────  ──────────────────────────  ───────────────  ──────────────────────────────────
 1    Modal header Save button    Highest          #0A84FF — expected primary action
 2    Food description input      High             Pre-populated; first content seen
 3    Modal header (glass)        High             Structural glass anchor
 4    Macro inputs (4 fields)     High             Pre-populated values — key data
 5    Re-analyze button           Medium           Outlined blue — clearly secondary
 6    "Edit Entry" modal title    Medium           17px/600 — identity
 7    OilSlider                   Medium-Low       Modifier — contextual
 8    Date/time inputs            Low              Administrative; rarely changed
 9    "MACROS" section label      Low              13px uppercase — organizational
10    Delete Entry                Low (deliberate) Red text, no fill — destructive but quiet
11    Cancel button               Very Low         Escape hatch
```

---

### 8d. Interaction Notes

```
SAVE — TWO PATHS:
  1. "Save" in header (top-right) — identical behavior to form save
  2. (There is no separate Save button in the form scroll area for Edit Entry,
     unlike Log Food which has a Save Entry button after the result card)
  BOTH must call the same save handler.

RE-ANALYZE:
  Tapping Re-analyze re-runs AI on the edited food description text.
  Macro fields update with new values. Oil slider setting is preserved.
  Visual: Re-analyze button shows spinner (holds size, same pattern as Analyze).

OIL SLIDER:
  Changing oil slider auto-recalculates macros (existing behavior — keep).
  The recalculation updates the MacroGrid inputs in real-time.

DELETE:
  RNP Button mode="text" — no border, no background, red text.
  Confirmation required before deletion (existing behavior — keep, typically Alert).
  After confirmed deletion: modal dismisses, entry removed from list.

CANCEL:
  Dismisses without saving — but for Edit Entry (not new), user may expect
  a confirmation if they've made changes. Current behavior: dismiss directly.
  (This is a UX gap not addressed in DESIGN.md — see §10.)

MACRO INPUTS:
  Pre-populated on modal open with current saved values (existing behavior — keep).
  textAlign: center or right (matches Settings input pattern).
```

---

---

## 9. LAYOUT CONFLICT REGISTER

This section identifies spatial conflicts, overcrowding risks, and layering ambiguities across all screens.

---

### CONFLICT 1 — FAB occludes last entry card (Entries screen)
**Severity: HIGH**

```
CURRENT (unfixed):
  FAB bottom: 16px always
  Last log card partially hidden behind FAB

DESIGN.md FIX:
  FAB bottom: 16 + 64 (island height) + 16 (gap) + insets.bottom
  = 16 + 64 + 16 + 34 = 130px from screen floor

  ScrollView paddingBottom: 96px (space-24)
  96px bottom pad vs 130px FAB offset = FAB STILL overlaps last card by 34px

ACTUAL CONFLICT:
  The FAB sits at 130px from floor but the scroll content only clears 96px.
  A card at the very bottom of the list can be partially hidden by the FAB.

RESOLUTION:
  ScrollView paddingBottom should be: FAB bottom + FAB size + 16px gap
  = 130px + 56px + 16px = 202px  ← safe clearance
  OR: FAB should sit at the same level as the island bottom (left: 24 matches)
      and content padding should be 96px + FAB height = 152px minimum.

  DESIGN.md specifies both 96px padding AND the FAB position formula — they
  are not reconciled. The wireframe recommends: paddingBottom = 160px on Entries.
```

---

### CONFLICT 2 — Analysis Result card + BlurView budget
**Severity: MEDIUM**

```
DESIGN.md §23 states:
  "Maximum 3 BlurView components visible simultaneously:
   DailyProgress + Analysis Result + Day picker OR island"

ON HOME SCREEN after analysis:
  - DailyProgress (BlurView)          = 1
  - Analysis Result card (BlurView)   = 2
  - Tab bar island (BlurView)         = 3
  Total: 3 — within budget ✓

ON ENTRIES SCREEN:
  - Day picker (BlurView)             = 1
  - Tab bar island (BlurView)         = 2
  Total: 2 — within budget ✓

ON LOG FOOD MODAL (open from Entries, after analysis):
  - Modal header (BlurView)           = 1
  - Analysis Result inside modal (BlurView) = 2
  - Tab bar island (still rendered behind modal on Android?)  = 3?
  Total: potentially 3 — marginal ✓ but requires tab bar to NOT render behind modal

POTENTIAL VIOLATION:
  If the tab bar island is not unmounted when the modal opens (common on Android
  where modals are transparent windows over the main view), all three BlurViews
  could render simultaneously with the modal header. This needs verification.
  Recommendation: Ensure island is not rendered while a modal is active.
```

---

### CONFLICT 3 — Atmospheric layers bleed across section boundaries
**Severity: LOW**

```
SITUATION:
  DailyProgress aurora ellipses have negative top/bottom positions:
    Ellipse 1: top: −20  (bleeds above card into status bar region)
    Ellipse 4: bottom: −20 (bleeds below card into FoodEntry label area)

  These are pointerEvents: 'none' so no tap interception.
  Visual effect: subtle glow behind the glass card's corners.

RISK:
  On smaller screens (SE, 375px or smaller), aurora bleed above card
  overlaps with the status bar area and may appear to "contaminate" the
  system UI region visually (on iOS, this is usually transparent anyway).

RESOLUTION:
  No code change needed — overflow on parent wrapper clips the aurora
  if overflow: 'hidden' is set. But DESIGN.md does not specify overflow
  on the DailyProgressWrapper. Without overflow: 'hidden', the aurora
  intentionally bleeds. This is by design — confirm it is intentional
  and document it as "atmospheric bleed — expected."
```

---

### CONFLICT 4 — Home screen crowding when Analysis Result is long
**Severity: MEDIUM**

```
SITUATION:
  Home screen scroll content can become very long when a complex meal is analyzed:
    DailyProgress: ~140px
    Gap: 24px
    FoodEntry label + input: ~100px
    OilSlider: ~80px
    Button row: ~48px
    Analysis Result card (3+ food items): 200–350px
    Bottom pad: 96px
    ─────────────────
    Total: ~700–900px on a 844px-tall screen (iPhone 14)

  The content just barely fits with scrolling — no visual conflict, but the
  scroll depth is significant. After analysis, the user must scroll down ~350px
  to reach the Save Entry button.

  DESIGN.md handles this with: "ScrollView scrolls to end after analysis result
  appears" — so the view auto-scrolls to reveal result.

RISK:
  If auto-scroll does not fire, the user sees the result appearing but cannot
  see the Save button. They must scroll manually — friction.

RECOMMENDATION:
  Auto-scroll behavior (handleFocusInput / scrollToEnd) must be verified on
  Android where keyboard behavior and scroll insets differ from iOS.
  Target: Save Entry button is fully visible above keyboard after scroll.
```

---

### CONFLICT 5 — Edit Entry modal: Save in header vs. no Save button in scroll area
**Severity: LOW**

```
SITUATION:
  Log Food modal has: Analyze → Result card → Save Entry button (in scroll area)
  Edit Entry modal has: Save (header only) — no Save button in scroll area

  For users editing macro values in the 2×2 grid near the bottom of the modal,
  the Save action is ~600px above (in the header). They must scroll back up
  to tap it, or use the header Save while in the middle of macro editing.

RECOMMENDATION:
  Add a "Save Changes" button at the bottom of the Edit Entry scroll area,
  above the Delete button. This mirrors the Log Food pattern where the
  primary action is reachable at the bottom of the content. The header Save
  remains as a secondary fast-access save for users who have made only
  text/time edits near the top.

  This conflicts with DESIGN.md's "three-part header" standardization but
  adds a necessary bottom-anchor CTA for a long-scroll modal.
```

---

### CONFLICT 6 — Island bottom inset on Android
**Severity: LOW**

```
SITUATION:
  Island bottom: 16 + insets.bottom
  On iOS: insets.bottom = 34px (safe area for notched devices)
  On Android (gesture nav): insets.bottom = 0 or varies

  If insets.bottom = 0 on Android: island sits only 16px above screen floor,
  which may overlap with the gesture navigation bar (especially on 3-button nav mode).

DESIGN.md mentions: "Android brightness compensation — reduce all glows by 30%"
but does not address the inset variation for the island position.

RECOMMENDATION:
  Use react-native-safe-area-context useSafeAreaInsets() always.
  Set minimum bottom inset: Math.max(insets.bottom, 16) to prevent island
  from touching the screen floor on Android with no gesture inset.
```

---

---

## 10. CHALLENGES TO DESIGN.MD

The following are direct challenges to decisions in DESIGN.md, with reasoning and alternative proposals.

---

### CHALLENGE 1 — Ring values need units at the ring level, not just "remaining" labels
**Section challenged: §13, §12 Progress Rings**

**DESIGN.md says:** Ring values display `1202`, `125`, `103`, `30` with labels below (`Cal`, `Pro`, `Crb`, `Fat`). Units are implied by label.

**The problem:** The home screen already has a unit problem on log cards (which DESIGN.md fixes). The same problem exists on the rings. `125` under `Pro` — is that grams? Ounces? The target audience includes new users who may not immediately associate `Pro` with `grams`. The label fix on log cards (`76g`, not `76`) is the right approach and should be consistent.

**Proposed fix:**
```
BEFORE:  { 1202 }   { 125 }   { 103 }   {  30 }
         { Cal  }   { Pro }   { Crb  }   { Fat }

AFTER:   {1202kcal}  {125g}   {103g}   {30g}
          (keep macro colors, values dominant)
          (unit suffix: 11px, same color, same weight — not a separate text element)
```

This does not require a new text element — the value Text can be `"${value}${unit}"` with the unit rendered at a smaller fontSize within a single `Text` element using nested `<Text>` with different styles (React Native supports this).

The visual hierarchy impact is minimal because the unit suffix is small relative to the value. The clarity benefit is significant for new users.

---

### CHALLENGE 2 — FoodItemCard borderRadius: 12 violates the three-radius system
**Section challenged: §15, §9**

**DESIGN.md says:** FoodItemCards inside the Analysis Result card use `borderRadius: 12`.

**The problem:** The three-radius system is explicitly `10 / 16 / 24`. `borderRadius: 12` is not in the system. The design rationale for three values is to eliminate the perception of "each component designed in isolation." A 12px radius on FoodItemCards inside a 16px-radius glass card immediately re-introduces the inconsistency the spec is trying to eliminate.

**Proposed fix:** Use `radius-sm: 10` for FoodItemCards (same as all chips and inputs). The interior cards are contextually similar to chips — they are contained, small-radius elements inside a larger surface. `10px` inside a `16px` container maintains a visible nesting depth without introducing a fourth radius value.

```
DESIGN.md: borderRadius: 12
PROPOSED:  borderRadius: 10  (radius-sm — consistent with system)
```

If the intent was to make FoodItemCards feel like "cards within a card" (medium radius inside a medium-radius container), the correct choice is still `radius-sm: 10` — using `radius-md: 16` for items inside a `16px` panel would make them feel the same depth as the panel itself.

---

### CHALLENGE 3 — The Analyze / Save Entry 50/50 button split may misrepresent priority
**Section challenged: §14 Home Screen, §12 Buttons**

**DESIGN.md says:** Buttons are "50/50 row, Analyze (contained) left, Save Entry (outlined) right."

**The problem:** When the user has not yet analyzed, Save Entry is meaningless (there is no result to save). The 50/50 split gives Save Entry equal spatial prominence to Analyze even when it should be invisible or unavailable. The outlined button at 50% width is still large and draws attention.

**DESIGN.md already half-addresses this** by noting "disabled: opacity 0.4" — but a grayed-out 50% button still claims visual real estate.

**Proposed alternative — progressive disclosure:**
```
STATE 1 (no analysis):
  ╭─────────────────────────────────────────────╮
  │                [ Analyze ]                  │  ← full-width contained, #0A84FF
  ╰─────────────────────────────────────────────╯
  (Save Entry is not shown at all — not disabled, absent)

STATE 2 (analysis result present):
  ╭──────────────────────╮ ╭──────────────────╮
  │     [ Analyze ]      │ │  [ Save Entry ]  │  ← 50/50 appears
  ╰──────────────────────╯ ╰──────────────────╯
  (Save Entry animates in from opacity 0 after result appears)
```

This is consistent with **§11b Motion Continuity** — the Save Entry button emerging alongside the Analysis Result card is a visual signal: "a result exists, now you can save it." It reinforces the analyze → review → save chain better than a permanently visible disabled button.

**Impact:** Minor animation addition (Save Entry button fades in with the result card). Reduces visual noise before analysis. More aligned with the spec's own motion continuity philosophy.

---

### CHALLENGE 4 — The Log Food modal duplicates the entire Home screen interaction chain
**Section challenged: §20 Log Food Modal, §14 Home Screen**

**DESIGN.md says:** Log Food modal contains: food input → meal chips → time → oil slider → Analyze → Analysis Result → Save Entry.

**The problem:** This is structurally identical to the Home screen, but inside a modal. The user now has two separate surfaces where they can perform the exact same food logging action. This creates:

1. **Confusion about which surface to use.** A new user opening the app sees Home screen with an Analyze button. They also see an Entries tab with a FAB that opens a modal with the same Analyze button. Which is canonical?
2. **State management duplication.** Two separate instances of the food entry + analysis flow require two separate state machines, two sets of validation, two instances of the oil slider state.
3. **Design debt.** If the Home screen logging flow changes (e.g., oil slider position, label text), the modal must be kept in sync.

**Proposal:** The Log Food modal should be a **shortcut to the Home screen**, not a parallel flow.

Option A: FAB on Entries navigates to Home tab (via router.push('/')) and auto-focuses the FoodEntry input. No modal. No duplication. The bottom bar island makes this navigation fast. Result: logging always happens on Home.

Option B: If modal is kept for UX reasons (logging without leaving Entries), the modal should be minimal — food text only, with "Analyze and Save" as a single action. No oil slider in modal (use the last-used oil level). No meal chip picker in modal. Analysis result is shown inline. This reduces the modal to ~3 components rather than a full Home clone.

**This is a material challenge to the current design.** The decision to maintain two parallel logging surfaces should be deliberate, not inherited.

---

### CHALLENGE 5 — The "glass is spatial, not decorative" rule is enforced inconsistently for the Modal header
**Section challenged: §6, §4, §20**

**DESIGN.md says:** "Glass is spatial, not decorative — used only on floating surfaces that sit above scrollable content." It lists exactly four glass elements: Tab bar island, DailyProgress, Analysis Result, Day picker.

**But:** Both modals use a glass (BlurView) header. This is a fifth and sixth glass surface. The modal header does float above the modal's scrollable content — so the rule is technically satisfied. But it means the total BlurView count is higher than the four named elements suggest, and the budget concern in §23 (max 3 simultaneous) becomes a four-way constraint when both a modal AND the island are on screen.

**Resolution:** DESIGN.md should explicitly add "Modal headers" to the glass surface list, with their own atmospheric layer specification (currently absent — modal headers have no atmospheric layer). Without an atmospheric layer, the modal header is glass-without-depth — exactly what the spec says to avoid: "A glass surface without its atmospheric layer is incomplete."

**Proposed addition to DESIGN.md:**
```
Glass surface 5/6: Modal headers (Log Food, Edit Entry)
  Atmospheric layer: none required — modal header sits above an opaque bg-base
  content area, not above content that benefits from perceived separation.
  Exception acknowledged: the blur on the modal header is functional (hides
  content scrolling behind it) without needing atmospheric depth reinforcement.
```

---

### CHALLENGE 6 — Day pill `radius-sm: 10` vs. current `20px` — the change may feel too sharp
**Section challenged: §9, §21**

**DESIGN.md says:** Day pills change from `borderRadius: 20` to `radius-sm: 10`.

**The concern:** A day pill at 20px radius on a short pill (paddingH: 20, paddingV: 8 → roughly 60×34px) is fully rounded — it reads as a lozenge/capsule. At 10px radius, it becomes a rounded rectangle — a visually distinct shape that may feel less premium and less touch-friendly. On a 34px-tall pill, `10px` radius only rounds each corner by ~29% of the height vs. `17px` (full rounding).

**The rationale** for changing day pills from 20px to 10px is radius system consolidation. This is valid. But the visual result is a noticeably sharper pill.

**Alternative:** Use `radius-md: 16` for day pills. The day picker is a collection of small cards, not chips. At 34px height, 16px radius gives ~47% rounding — closer to the pill feel the current 20px provides, while being within the three-value radius system.

```
Current:   borderRadius: 20  (lozenge)
DESIGN.md: borderRadius: 10  (rounded rectangle — too sharp for a pill element)
Proposed:  borderRadius: 16  (radius-md — within system, closer to current feel)
```

---

### CHALLENGE 7 — Cancel confirmation missing on Edit Entry modal
**Section challenged: §20 Edit Entry Modal**

**DESIGN.md says:** Tapping Cancel dismisses the Edit Entry modal without saving.

**The problem:** The Edit Entry modal pre-populates all fields with saved values. If a user edits the food text, adjusts macros, changes oil level, and then accidentally taps Cancel — all changes are lost silently. Unlike Log Food (where Cancel discards a new, unsaved entry — a low-stakes loss), Edit Entry Cancel discards meaningful edits to existing data.

**Proposed addition:** If any field value has changed from the initial pre-populated value, show a confirmation on Cancel:
```
{ Discard changes? }
  Your edits to this entry will be lost.
  [Discard]    [Keep Editing]
```

This is a standard iOS/Android pattern. It is a small UX addition that prevents data loss on accidental Cancel taps. It should be added to DESIGN.md's Edit Entry interaction specification.

---

### CHALLENGE 8 — The aurora glow opacity values may be invisible on OLED vs LCD
**Section challenged: §4 Visual Identity, §6 Glass Strategy**

**DESIGN.md says:** Atmospheric ellipses use opacity `0.02` to `0.025` and specifies: "If the glow is identifiable without looking, reduce its opacity by 50%."

**The concern:** At `0.02` opacity, the glow is a white/colored area at 2% alpha over `#0C0C0E`. On OLED screens (iPhone 14 Pro, Pixel 8) this should be just barely perceptible. On LCD screens (many mid-range Androids), ambient light and LCD bloom may make the glow completely invisible at these opacity levels.

**The aurora then serves no purpose on LCD.**

**Proposed calibration table:**
```
OLED:  use specified opacity (0.02–0.025) — nearly invisible, as intended
LCD:   multiply by 2.5 (0.05–0.06) — slightly more visible to compensate for
       screen black level difference
Android: DESIGN.md §22 already mentions "reduce all glows by 30% on Android
         if blur renders at full intensity" — this should be conditional on
         screen type, not OS (many Android phones are OLED)
```

**Better rule:** Detect screen type or use a threshold based on device pixel ratio as a proxy. This is a §3 (Priority 3) item but should be acknowledged as a gap in the current spec.

---

*End of WIREFRAMES.md*

---

## SUMMARY TABLE — Issues by Priority

| # | Issue | Type | Severity | Section |
|---|-------|------|----------|---------|
| C1 | FAB / paddingBottom mismatch on Entries | Conflict | HIGH | §9 |
| C2 | BlurView budget risk with modal + island | Conflict | MEDIUM | §9 |
| C3 | Aurora bleed without overflow: hidden spec | Conflict | LOW | §9 |
| C4 | Home scroll depth after long analysis result | Conflict | MEDIUM | §9 |
| C5 | Edit Entry: Save only in header, not bottom | Conflict | LOW | §9 |
| C6 | Island bottom inset on Android | Conflict | LOW | §9 |
| D1 | Ring values lack unit suffix | Design challenge | HIGH | §10 |
| D2 | FoodItemCard borderRadius: 12 violates 3-radius rule | Design challenge | MEDIUM | §10 |
| D3 | Save Entry 50/50 split misrepresents state | Design challenge | MEDIUM | §10 |
| D4 | Log Food modal duplicates Home screen flow | Design challenge | HIGH | §10 |
| D5 | Modal headers not in glass surface list; no atmospheric layer | Design challenge | MEDIUM | §10 |
| D6 | Day pill 10px radius may feel too sharp | Design challenge | LOW | §10 |
| D7 | Cancel confirmation absent on Edit Entry | Design challenge | MEDIUM | §10 |
| D8 | Aurora opacity invisible on LCD screens | Design challenge | LOW | §10 |
