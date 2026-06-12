# DESIGN.md — TechyGuide Block Application Design System

> This file is the single source of truth for all visual design decisions.
> Claude Code reads this before implementing any UI component.
> Generated alongside Stitch designs — keep in sync when Stitch exports update.

---

## 1. Product Identity

**Product name:** TechyGuide Block Application
**Tagline:** Build hardware with blocks
**Audience:** Students, makers, educators learning to program ESP32/Arduino boards
**Personality:** Technical but friendly — like a knowledgeable teacher who makes
circuits fun. Confident, colourful, approachable. Not childish, not corporate.

**Two modes, one app:**
- **Board mode** — write Arduino/MicroPython code by dragging blocks, flash to ESP32
- **Stage mode** — Scratch-style sprite animation, controlled by the same blocks

---

## 2. Colour Palette

### Brand colours
```
Primary blue:       #4C97FF   — buttons, links, selected states, motion blocks
Dark navy:          #1E1E3F   — header background, code editor background
```

### Block category colours (fixed — must match block definitions exactly)
```
Motion:      #4C97FF   — blue
Looks:       #9966FF   — purple
Sound:       #CF63CF   — pink-purple
Events:      #FFBF00   — yellow
Control:     #FFAB19   — orange
Sensing:     #5CB1D6   — sky blue
Operators:   #59C059   — green
Variables:   #FF8C1A   — dark orange
ESP32:       #FF6680   — coral/pink-red
My Blocks:   #FF6680   — same as ESP32
```

### UI surface colours
```
Background (workspace):   #F9F9F9   — very light grey dot-grid canvas
Surface (panels):         #FFFFFF   — white panels, cards, toolbox
Surface alt:              #F5F5F5   — hovered sprite cards, tray background
Border default:           #E5E7EB   — dividers, card borders
Border focus:             #4C97FF   — focused inputs, selected cards
Text primary:             #1E1E2E   — headings, main content
Text secondary:           #575E75   — labels, metadata, placeholder
Text disabled:            #A0A0B0   — inactive states
Error:                    #FC2F2F   — delete buttons, stop button border
Success:                  #4CBF56   — green flag button border, success states
Warning:                  #FFAB19   — control blocks, caution states
```

### Code editor colours (Board mode)
```
Editor background:   #1A1A2E   — dark navy
Editor text:         #CDD6F4   — light lavender
Keyword:             #89B4FA   — blue keywords (void, int, return)
String:              #A6E3A1   — green strings
Comment:             #6C7086   — grey comments
Number:              #FAB387   — orange numbers
Function:            #89DCEB   — cyan function names
Line numbers:        #45475A   — muted grey
```

---

## 3. Typography

### Font stack
```css
font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
```
**Inter** is the primary font. Load from Google Fonts:
```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

### Code font
```css
font-family: 'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace;
```
Load from Google Fonts:
```html
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
```

### Type scale
```
Header logo:       18px / 700 / #FFFFFF
Nav buttons:       13px / 600 / #FFFFFF or #1E1E3F
Category labels:   9px  / 700 / block colour (below category circles)
Block text:        12px / 500 / #FFFFFF
Palette heading:   11px / 700 / #575E75 / UPPERCASE / 0.06em tracking
Panel label:       10px / 700 / #575E75 / UPPERCASE / 0.04em tracking
Panel value:       12px / 400 / #1E1E2E
Sprite card name:  10px / 500 / #575E75
Tray title:        11px / 700 / #1E1E2E
Tray subtitle:     10px / 400 / #575E75
Code editor:       13px / 400 / monospace
```

---

## 4. Spacing & Sizing

### Layout dimensions
```
Header height:          48px
Category sidebar width: 60px
Block palette width:    210px
Stage panel width:      480px
Stage canvas:           480 × 360px (4:3 ratio, scales to fit)
```

### Component sizing
```
Category circle:        40px diameter
Category active ring:   2.5px white border + 2px gap
Block pill height:      28px
Block pill radius:      4px
Block gap:              4px
Card border radius:     8px
Card border:            2px solid
Input border radius:    4px
Input padding:          3px 6px
Button border radius:   6px (rectangular) / 50% (circular FAB)
FAB size:               36px (add sprite) / 28px (add backdrop)
Sprite card width:      80px
Sprite card img:        52 × 52px
Backdrop preview:       80 × 60px
```

### Spacing scale (use these values, not arbitrary numbers)
```
2px   — icon internal padding
4px   — tight gaps (block list, pill gaps)
6px   — compact padding (stage controls)
8px   — default gap (sprite tray padding)
10px  — panel content padding
12px  — standard padding
16px  — section separation
20px  — modal content padding
24px  — large section gap
```

---

## 5. Shadows & Depth

```
Card default:     none (border only)
Card hover:       0 1px 4px rgba(0,0,0,0.12)
Card selected:    0 0 0 2px #4C97FF, 0 4px 12px rgba(76,151,255,0.2)
FAB:              0 3px 10px rgba(76,151,255,0.45)
FAB hover:        0 4px 14px rgba(76,151,255,0.55)
Header:           0 2px 8px rgba(0,0,0,0.25)
Modal:            0 20px 60px rgba(0,0,0,0.3)
Stage panel:      -2px 0 12px rgba(0,0,0,0.06)
Code panel:       inset 0 0 0 1px rgba(255,255,255,0.05)
```

---

## 6. Layout Architecture

### Stage mode (3-column layout)
```
┌────────────────────────────────────────────────────────┐
│  HEADER (48px) — logo | Board Stage tabs | Connect Upload│
├──────┬──────────┬──────────────────────┬───────────────┤
│ Cat  │  Block   │                      │               │
│ Side │  Palette │   Blockly Workspace  │  Stage Panel  │
│ bar  │  210px   │   (flex, fills rest) │  480px        │
│ 60px │          │                      │               │
│      │          │                      │               │
└──────┴──────────┴──────────────────────┴───────────────┘
```

### Stage panel breakdown (top to bottom)
```
┌─────────────────────────────┐
│ Stage controls    (44px)    │  ▶ ⏹ + layout toggle
├─────────────────────────────┤
│ Canvas 4:3 ratio            │  PixiJS stage
│                             │
├─────────────────────────────┤
│ Sprite props bar  (70px)    │  Name/X/Y / Show/Size/Direction
├────────────────────┬────────┤
│ Sprite tray        │ Stage  │  Cards + FAB | Backdrop thumb
│ (flex)             │ (100px)│
└────────────────────┴────────┘
```

### Board mode (2-column layout)
```
┌───────────────────────────────────────────────────────┐
│  HEADER — same as stage mode                          │
├──────┬──────────┬──────────────┬──────────────────────┤
│ Cat  │  Block   │              │  Code Panel           │
│ Side │  Palette │  Blockly     │  (dark, ~40% width)   │
│ bar  │  210px   │  Workspace   │  .ino tabs            │
│      │          │              │  Serial monitor       │
└──────┴──────────┴──────────────┴──────────────────────┘
```

---

## 7. Component Patterns

### Category circle button
```
State: default   → circle coloured, no border
State: hover     → scale(1.1), box-shadow 0 2px 8px rgba(0,0,0,0.2)
State: active    → white 2.5px border + outer glow
Transition:      transform 0.12s, box-shadow 0.12s
```

### Block pill
```
Background:     category colour (e.g. #4C97FF for Motion)
Text:           #FFFFFF, 12px, weight 500
Height:         28px, full palette width - 24px margin
Radius:         4px
Value fields:   white rounded inset rectangles (4px radius, padding 2px 6px)
Hover:          brightness(1.08)
Drag cursor:    grab
```

### Sprite card
```
Size:           80px wide, auto height
Image area:     52×52px, object-fit: contain, bg #F9F9F9
Name:           10px, #575E75, truncated
Border:         2px solid #E5E7EB (default) / #4C97FF (selected)
Hover:          border-color #aaa, shadow 0 1px 4px rgba(0,0,0,0.12)
Selected:       blue border + glow shadow
Delete badge:   16px red circle top-right, hidden until hover
Transition:     border-color 0.12s, box-shadow 0.12s
```

### Modal overlay
```
Background:     rgba(0,0,0,0.45) with backdrop-filter: blur(2px)
Card:           white, 780×560px max, radius 16px
Animation:      opacity 0→1 + scale 0.96→1, 200ms ease
Close button:   32px rounded square, #F3F4F6 background
```

### Input field
```
Border:         1px solid #d9d9d9
Radius:         4px
Padding:        3px 6px
Focus:          border-color #4C97FF (no outline)
Font:           Inter 12px
Background:     #FFFFFF
```

### Primary button (header Upload)
```
Background:     #4C97FF
Text:           #FFFFFF, 12px, weight 600
Padding:        5px 14px
Radius:         6px
Hover:          background #3b82f6
```

### Outlined button (header Connect)
```
Background:     transparent
Border:         1.5px solid rgba(255,255,255,0.35)
Text:           #FFFFFF
Hover:          background rgba(255,255,255,0.15)
```

---

## 8. Icons

Use **Lucide Icons** throughout. No icon fonts — SVG only.
```html
<!-- Install via npm: -->
npm install lucide

<!-- Or use CDN for direct HTML: -->
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>
```

Icon size conventions:
```
Header icons:         20px
Stage control icons:  18px
Panel label icons:    14px
FAB icons:            20px (add sprite), 14px (add backdrop)
Card delete:          10px
Modal close:          14px
```

Key icons to use:
```
Play:         lucide-play (green flag button)
Square:       lucide-square (stop button)
Eye:          lucide-eye (show sprite)
EyeOff:       lucide-eye-off (hide sprite)
Plus:         lucide-plus (add sprite/backdrop FAB)
X:            lucide-x (close modal, delete card)
Image:        lucide-image (backdrop button)
Upload:       lucide-upload (upload button)
Wifi:         lucide-wifi (connect button)
Download:     lucide-download (download .ino)
ChevronRight: lucide-chevron-right (expand category)
```

---

## 9. Animations & Transitions

```
Button hover:       transform + background, 0.12–0.15s ease
Card hover:         border-color + shadow, 0.12s ease
Modal open:         opacity + scale, 0.2s ease-out
Modal close:        opacity, 0.15s ease-in
FAB hover:          scale(1.1), 0.15s ease
Category active:    border appears, 0.1s ease
Block drag:         cursor: grab → grabbing, opacity 0.85
Sprite select:      border flash, 0.1s
```

No decorative animations. Every animation serves a purpose (feedback, state change).

---

## 10. Design References

These existing products share aspects of the TechyGuide aesthetic:
```
Scratch 3.0:    https://scratch.mit.edu/projects/editor/
  → Block layout, category circles, sprite tray, stage panel structure

VS Code:        https://code.visualstudio.com/
  → Dark code editor, tab system, status bar, monospace typography

Arduino IDE 2:  https://docs.arduino.cc/software/ide-v2/
  → Board/port selector pattern, serial monitor panel, upload flow

Linear:         https://linear.app/
  → Clean SaaS UI, sidebar navigation, keyboard-first feel

Figma:          https://figma.com/
  → Panel layouts, property inspectors, zoom controls
```

**Do not copy** any UI from these — use them as inspiration for proportions,
interaction patterns, and information hierarchy only.

---

## 11. What NOT to Do

```
❌ No gradients in the UI (only in backdrops the user chooses)
❌ No rounded corners larger than 8px on panels/cards
❌ No shadows heavier than specified above
❌ No custom scroll bars (use scrollbar-width: none for category sidebar)
❌ No animation over 300ms
❌ No emojis in UI chrome (only in block text like "when 🟢 clicked")
❌ No images in the app UI — all icons must be SVG
❌ No Scratch trademark assets (cat logo, Scratch wordmark, Scratch CDN sprites)
❌ No hardcoded pixel widths on the workspace column — it must flex
❌ No `!important` except for Blockly SVG override
```

---

## 12. Stitch → Claude Code Handoff Instructions

When Stitch generates a design and exports via MCP:

1. **Claude Code reads this DESIGN.md first** — all token values here override
   anything Stitch generates if they conflict
2. **Stitch HTML is the layout reference** — structure and component positioning
3. **Stitch CSS is the starting point** — colours, spacing, typography from here
4. **Do not use Stitch's generated class names** — replace with semantic names
   matching the project's existing CSS conventions (kebab-case)
5. **Ignore Stitch placeholder images** — the app uses its own sprite/backdrop system
6. **Wire Stitch components to existing JS** — `SpritePanel.js`, `StageRenderer.js`,
   `scratchToolbox.js` etc. remain the logic layer; Stitch provides only the HTML/CSS shell