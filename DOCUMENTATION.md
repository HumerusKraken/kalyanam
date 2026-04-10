# Kalyanam — Wedding Invitation Site: Technical Documentation

## Overview

Kalyanam is a single-page, mobile-first wedding invitation website for **Krishnendu & Murali Krishna's** wedding on **May 18, 2026**. It is built with vanilla HTML, CSS, and JavaScript — no frameworks or build tools — and designed to be hosted free on GitHub Pages.

---

## Project Structure

```
kalyanam/
├── index.html              # Single-page HTML structure
├── css/
│   └── style.css           # All styles (custom properties, sections, editor, responsive)
├── js/
│   ├── main.js             # Core features (countdown, animations, parallax, music, auto-contrast)
│   └── editor.js           # Visual editor (text editing, drag, image crop, CSS export)
└── assets/
    ├── images/
    │   ├── kathakali-motif.png    # Decorative Kerala art motif
    │   ├── hero-couple.jpg        # Hero section couple photo
    │   ├── krishnendu.jpg         # Bride individual photo
    │   ├── murali-krishna.jpg     # Groom individual photo
    │   ├── henna-hands.jpg        # Close-up henna hands photo
    │   └── garden-couple.jpg      # Closing section garden photo
    └── wedding-music.mp3          # Background music (user-provided)
```

---

## 1. Page Sections

### 1.1 Hero Section
**HTML:** `<section class="hero" id="hero">` — `index.html:17–41`
**CSS:** `.hero` block — `style.css:85–241`

A full-viewport opening section with layered elements:

- **Background photo**: Absolutely positioned (`hero__photo`) with `object-fit: cover` filling the viewport.
- **Dual green gradient overlays**: Top overlay (40% height, `rgba(45,80,22,0.85)` fading to transparent) and bottom overlay (50% height, `rgba(30,60,15,0.95)` fading to transparent). These give the Kerala foliage feel. — `style.css:119–140`
- **Kathakali motif**: Decorative PNG centered above the title — `index.html:21–23`
- **"KALYANAM" title**: Cinzel font, uppercase, white, responsive sizing via `clamp(2.2rem, 8vw, 3.5rem)` — `style.css:154–161`
- **Tagline**: Sacramento cursive font with per-letter auto-contrast coloring (see §4) — `style.css:164–176`
- **Couple names**: Staggered layout — bride ("Krishnendu") right-aligned with `padding-right: 5%`, groom ("Murali Krishna") left-aligned with `padding-left: 3%`, connected by a gold ampersand. Tangerine cursive, `font-size: clamp(3.2rem, 12vw, 5rem)` — `style.css:178–218`
- **Name entrance animation**: `@keyframes nameSlideIn` with staggered delays (0.2s, 0.5s, 0.7s) triggered when `.hero__names` becomes visible — `style.css:220–241`

### 1.2 Couple Bios Section
**HTML:** `<section class="bios" id="bios">` — `index.html:44–74`
**CSS:** `.bios` block — `style.css:246–303`

Two-row, two-column CSS Grid layout with alternating photo/text placement:

- **Row 1** (Bride): Left = cream background text panel, Right = photo
- **Row 2** (Groom): Left = photo, Right = dark olive (`#444`) text panel
- Grid: `grid-template-columns: 1fr 1fr`, `min-height: 50vw` — `style.css:252–254`
- Photos use `object-fit: cover` with `min-height: 280px` — `style.css:298–303`
- Each bio includes name (with italic nickname) and a short description in EB Garamond italic

### 1.3 Countdown Section
**HTML:** `<section class="countdown" id="countdown">` — `index.html:77–97`
**CSS:** `.countdown` block — `style.css:308–350`

Dark background (`--color-dark: #3d3d2e`) section with:

- Heading in Tangerine script: "Counting the days..."
- Four countdown units (Days, Hours, Minutes, Seconds) in a flex row
- Numbers in Cinzel display font, labels in Inter sans-serif
- Gold accent color for heading and labels

### 1.4 When & Where Section
**HTML:** `<section class="event" id="event">` — `index.html:100–144`
**CSS:** `.event` block — `style.css:355–439`

Two-column grid (cream text panel + henna hands photo):

- Three info items with inline SVG icons:
  - **Location**: Thiruvonam Auditorium, Thrikkakara, Kochi + "Go to maps" link (opens Google Maps)
  - **Date**: Monday, May 18th, 2026 + "Add to calendar" button (generates .ics download, see §3.2)
  - **Time**: 11:00 AM – 11:30 AM
- Buttons: pill-shaped (`border-radius: 20px`), dark border, hover fills with dark background — `style.css:409–429`

### 1.5 Closing Section
**HTML:** `<section class="closing" id="closing">` — `index.html:147–155`
**CSS:** `.closing` block — `style.css:444–463`

- Dark olive banner with gold Tangerine text: "Can't wait to see you there!"
- Full-width couple photo (garden setting) with `min-height: 80vh`

---

## 2. Design System

### 2.1 Color Palette
Defined as CSS custom properties in `:root` — `style.css:6–14`

| Variable | Value | Usage |
|---|---|---|
| `--color-dark` | `#3d3d2e` | Countdown bg, music/editor buttons |
| `--color-dark-alt` | `#444444` | Groom bio bg, icon color |
| `--color-cream` | `#e1dedb` | Bride bio bg, event details bg |
| `--color-gold` | `#c6b580` | Accents, labels, editor UI |
| `--color-text-dark` | `#282828` | Body text on light bg |
| `--color-text-light` | `#ffffff` | Text on dark bg |
| `--color-green-deep` | `#2d5016` | Hero overlay base |

### 2.2 Typography
Custom properties — `style.css:17–21`

| Variable | Font Stack | Usage |
|---|---|---|
| `--font-display` | `'Cinzel', serif` | "KALYANAM" title, countdown numbers |
| `--font-script` | `'Tangerine', cursive` | Couple names, section headings |
| `--font-sacramento` | `'Sacramento', cursive` | Hero tagline |
| `--font-body` | `'EB Garamond', Georgia, serif` | Bio text, event details |
| `--font-sans` | `'Inter', sans-serif` | Countdown labels, buttons, editor UI |

All loaded via Google Fonts — `index.html:11`

### 2.3 Easing Functions
`style.css:23–24`

| Variable | Value | Usage |
|---|---|---|
| `--ease-smooth` | `cubic-bezier(0.25, 0.46, 0.45, 0.94)` | Most transitions |
| `--ease-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful entrance effects |

### 2.4 Responsive Design

- **Mobile-first** (375px base width)
- **Desktop cap**: `@media (min-width: 768px)` restricts `body` to `max-width: 480px` centered with `box-shadow` for a card-like appearance — `style.css:468–475`
- **Very small screens** (`max-width: 340px`): Grids collapse to single column — `style.css:478–490`
- Font sizes use `clamp()` throughout for fluid scaling

---

## 3. Core JavaScript Features

All core features are in `js/main.js`, initialized via `DOMContentLoaded` — `main.js:269–277`

### 3.1 Scroll Animations
**Function:** `initScrollAnimations()` — `main.js:6–22`

Uses the **Intersection Observer API** to trigger CSS entrance animations:

- **Target**: All elements with class `.animate-on-scroll`
- **Observer config**: `threshold: 0.15`, `rootMargin: '0px 0px -40px 0px'`
- **Behavior**: When an element enters the viewport (15% visible), adds class `.is-visible` and stops observing
- **CSS effect**: Elements transition from `opacity: 0; transform: translateY(30px)` to `opacity: 1; transform: translateY(0)` over 0.8s — `style.css:66–80`
- **Stagger**: nth-child delays (0.1s, 0.2s, 0.3s) for sequential children — `style.css:78–80`

### 3.2 Countdown Timer
**Function:** `initCountdown()` — `main.js:25–59`

Live countdown to May 18, 2026, 11:00 AM IST (`+05:30`):

- Updates four DOM elements (`#cd-days`, `#cd-hours`, `#cd-minutes`, `#cd-seconds`) every 1000ms via `setInterval`
- Hours, minutes, seconds are zero-padded with `String.padStart(2, '0')`
- When the date passes, displays all zeros

### 3.3 Add to Calendar (.ics Download)
**Function:** `initCalendar()` — `main.js:62–96`

Generates and downloads an iCalendar file on button click:

- **Button**: `#add-to-calendar` — `index.html:125`
- **ICS content**: VCALENDAR with VEVENT containing:
  - Start: `20260518T053000Z` (11:00 AM IST in UTC)
  - End: `20260518T060000Z` (11:30 AM IST in UTC)
  - Summary, description, location (with escaped commas)
  - VALARM reminder: 1 day before (`TRIGGER:-P1D`)
- **Download mechanism**: Creates a `Blob` with `text/calendar` MIME type, generates an object URL, programmatically clicks a download link, then cleans up — `main.js:86–94`

### 3.4 Parallax Effect
**Function:** `initParallax()` — `main.js:99–118`

Subtle vertical parallax on the hero background photo:

- **Target**: `.hero__photo` element
- **Effect**: `translateY(scrollY * 0.3)` — image scrolls at 30% of page scroll speed
- **Performance**: Throttled via `requestAnimationFrame` with a `ticking` flag
- **Accessibility**: Skips entirely if `prefers-reduced-motion: reduce` is set — `main.js:101`
- **Boundary**: Only applies while `scrollY < window.innerHeight` (hero visible)

### 3.5 Background Music Toggle
**Function:** `initMusic()` — `main.js:121–140`

Toggle button for optional background audio:

- **Elements**: `#music-toggle` button, `#bg-music` audio element — `index.html:186–199`
- **Behavior**: Starts paused (`.is-paused` class). Click toggles play/pause
- **Visual states**:
  - Paused: Crossed-out music icon (SVG with strike line)
  - Playing: Active music icon + CSS `pulse-ring` animation (gold ring radiating outward) — `style.css:531–539`
- **Positioning**: Fixed bottom-right corner, 44px circle with backdrop blur — `style.css:496–529`

### 3.6 Per-Letter Auto-Contrast
**Function:** `initAutoContrast()` — `main.js:143–266`

The most complex feature — dynamically colors each letter of the hero tagline based on the background behind it:

#### Setup (`main.js:143–174`)
1. Finds the `[data-autocontrast]` element (the tagline)
2. Wraps every character in `<span class="ac-letter">` elements
3. Creates an off-screen canvas at the hero image's natural resolution
4. Draws the hero image onto the canvas for pixel sampling

#### Overlay Blending (`getOverlayAlpha(yRatio)` — `main.js:179–198`)
Simulates the CSS gradient overlays in code to match what the user sees:
- **Top overlay** (y = 0–40%): `rgba(45,80,22)` at alpha `0.85 * (1 - t²)` (quadratic fade-out)
- **Bottom overlay** (y = 50–100%): `rgba(30,60,15)` at alpha `0.95 * t²` (quadratic fade-in)
- Returns the dominant overlay color and alpha at any vertical position

#### Per-Letter Color Calculation (`updateLetters()` — `main.js:200–245`)
For each `<span>` letter:
1. Maps the letter's screen center coordinates to canvas pixel coordinates relative to the hero section
2. Samples the image pixel at that position using `ctx.getImageData()`
3. Alpha-blends the pixel with the CSS overlay color: `blended = img * (1 - alpha) + overlay * alpha`
4. Computes **relative luminance**: `L = (0.299*R + 0.587*G + 0.114*B) / 255`
5. Assigns color based on luminance thresholds:
   - `L > 0.55` → dark text (`#1a1a1a`)
   - `L > 0.40` → gold text (`#c6b580`)
   - `L ≤ 0.40` → white text (`#ffffff`)

#### Live Updates (`main.js:248–266`)
- Scheduled via `requestAnimationFrame` on `scroll` and `resize` events (passive listeners)
- An `IntersectionObserver` on `.hero` triggers recalculation when the hero is in view
- The color transitions smoothly thanks to `transition: color 0.3s ease` on `.ac-letter` — `style.css:173–176`

---

## 4. Visual Editor

A self-contained editing tool for fine-tuning the design directly in the browser, implemented as an IIFE in `js/editor.js`.

### 4.1 Architecture
**File:** `js/editor.js` — self-initializing IIFE (543 lines)

Key state variables:
- `active` — editor on/off toggle
- `selected` — currently selected text element
- `changes` — `Map<Element, {prop: value}>` storing all modifications for CSS export
- `autoContrastEls` — `Set` of elements with auto-contrast enabled
- `dragState` / `imgDragState` — drag operation state

### 4.2 Activating the Editor
**Toggle button**: Gear icon, fixed bottom-left — `index.html:158–162`, `style.css:546–573`

- Clicking toggles `body.ed-active` class
- **On activate**: Adds image crop handles, prepares hero canvas for contrast sampling — `editor.js:69–80`
- **On deactivate**: Deselects all, hides toolbar, removes image handles

### 4.3 Text Selection & Editing
**Selector**: `TEXT_SELECTOR` constant — `editor.js:27–34`

Matches all editable text elements:
```
.hero__title, .hero__tagline, .hero__name, .hero__ampersand,
.bios__name, .bios__desc,
.countdown__heading, .countdown__number, .countdown__label,
.event__heading, .event__venue, .event__date, .event__time,
.closing__text, .ac-letter
```

**Click behavior** (`editor.js:83–96`):
- Uses event delegation on `document` with capture phase
- Clicks on text elements call `selectElement()` — `editor.js:98–146`
- Clicks elsewhere call `deselectAll()`

**`selectElement(el)`** — `editor.js:98–146`:
1. Adds `.ed-selected` class (dashed gold outline) — `style.css:576–579`
2. Reads computed styles into toolbar: font family, font size, color, bold/italic state
3. Matches current font against the `FONTS` dropdown array
4. Positions toolbar near the element (above by default, below if no room)
5. Shows/hides auto-contrast checkbox based on whether element is in hero section

### 4.4 Toolbar Controls
**HTML:** `<div class="ed-toolbar">` — `index.html:165–178`
**CSS:** `.ed-toolbar` block — `style.css:599–714`

| Control | Element | Handler | Effect |
|---|---|---|---|
| Font family | `<select id="ed-font">` | `change` — `editor.js:166–169` | Sets `el.style.fontFamily` |
| Font size | `<input type="number" id="ed-size">` | `input` — `editor.js:171–174` | Sets `el.style.fontSize` in px |
| Text color | `<input type="color" id="ed-color">` | `input` — `editor.js:176–182` | Sets `el.style.color`, disables auto-contrast |
| Bold | `<button id="ed-bold">` | `click` — `editor.js:184–189` | Toggles `fontWeight` between 400/700 |
| Italic | `<button id="ed-italic">` | `click` — `editor.js:191–197` | Toggles `fontStyle` between normal/italic |
| Auto-contrast | `<input type="checkbox" id="ed-autocolor">` | `change` — `editor.js:203–209` | Adds/removes element from `autoContrastEls` set |
| Drag | `<input type="checkbox" id="ed-draggable">` | `change` — `editor.js:267–282` | Enables drag-to-reposition mode |
| Copy All CSS | `<button id="ed-copy-all">` | `click` — `editor.js:512–534` | Exports all changes as CSS to clipboard |

Available fonts in the dropdown — `editor.js:14–24`:
Tangerine, Great Vibes, Sacramento, Cinzel, EB Garamond, Inter, Georgia, Arial, Times New Roman

### 4.5 Auto-Contrast (Editor Version)
**Function:** `updateAutoContrast(el)` — `editor.js:231–264`

A simpler version of the main auto-contrast for arbitrary hero text:
- Samples a 20×20 pixel area at the element's center on the hero canvas
- Averages RGB values across all sampled pixels
- Computes luminance and picks `#1a1a1a` (light bg) or `#ffffff` (dark bg) at threshold 0.45
- Updates in real-time during drag operations — `editor.js:330–332`

### 4.6 Drag-to-Reposition
**Enabled by**: "Drag" checkbox in toolbar — `editor.js:267–282`

When enabled:
1. Element gets `.ed-drag-enabled` class (changes cursor to grab) — `style.css:582–584`
2. Element is converted to `position: absolute` with calculated `left`/`top` from its current position
3. Parent element gets `position: relative` if it was `static`

**Drag handling** — `editor.js:284–356`:
- Supports both mouse and touch events
- `mousedown`/`touchstart` → `startTextDrag()`: records start position
- `mousemove`/`touchmove` → `moveTextDrag()`: updates `left`/`top` by delta
- `mouseup`/`touchend` → `endAllDrags()`: records final position in changes map
- During drag, auto-contrast updates if enabled for that element

### 4.7 Tagline Resize
**Function:** `addTaglineResize(tagline)` — `editor.js:362–400`
**CSS:** `.ed-tagline-resize` — `style.css:716–751`

When the tagline (`.hero__tagline`) is selected:
- Adds a resize handle on the right edge (east handle)
- Dragging horizontally changes `maxWidth` and `width` of the tagline element
- Minimum width: 120px
- Visual: gold gradient bar on the right edge + ↔ arrow indicator — `style.css:730–751`

### 4.8 Image Crop Handles
**Function:** `addImageHandles()` — `editor.js:410–446`
**CSS:** `.ed-img-handle` — `style.css:753–804`

Adds drag handles to the top and bottom edges of every image with a `data-ed-img` attribute:

**Images with handles** (identified by `data-ed-img` value):
- `krishnendu` — Bride photo
- `murali` — Groom photo
- `henna` — Henna hands photo
- `garden` — Closing garden photo

**Crop behavior** (`moveImgDrag()` — `editor.js:468–487`):
- **Bottom handle drag**: Changes `img.style.height` directly (grow = drag down, shrink = drag up)
- **Top handle drag**: Changes height AND shifts `object-position` vertically to show a different part of the image
- `img.style.minHeight = '0'` is set so the page layout can actually shrink — the surrounding content reflows naturally
- Minimum height: 80px

**Visual**: Gold gradient bars at top/bottom edges with a centered pill-shaped indicator — `style.css:791–804`

### 4.9 CSS Export
**Function:** Copy All CSS button handler — `editor.js:512–534`

Exports all recorded changes as valid CSS:

1. **Recording**: Every property change calls `record(el, prop, value)` — `editor.js:490–493` — storing in the `changes` Map
2. **Selector generation**: `getSelector(el)` — `editor.js:495–509` — builds a CSS selector from the element's class names (filtering out editor-specific classes like `ed-*`, `animate-on-scroll`, `is-visible`). Falls back to `tag:nth-child(n)` if no usable classes
3. **Output format**: CSS with comment header, ready to paste into `style.css`
4. **Copy**: Uses `navigator.clipboard.writeText()`, shows "Copied!" feedback for 2s

---

## 5. Animations Summary

| Animation | Trigger | CSS/JS | Duration |
|---|---|---|---|
| Scroll fade-in + slide-up | Element enters viewport (15%) | CSS transition + JS (IntersectionObserver) | 0.8s |
| Staggered children delay | Sequential `.animate-on-scroll` | CSS `transition-delay` | +0.1s/+0.2s/+0.3s |
| Name slide-in | `.hero__names.is-visible` | CSS `@keyframes nameSlideIn` | 0.8–1s (staggered 0.2s/0.5s/0.7s) |
| Hero parallax | Page scroll | JS `requestAnimationFrame` | Continuous |
| Per-letter color transition | Scroll/resize | CSS `transition: color 0.3s` | 0.3s |
| Music button pulse | Audio playing | CSS `@keyframes pulse-ring` | 2s infinite |
| Button hover fill | Mouse hover | CSS `transition: all 0.3s` | 0.3s |
| Editor toolbar appearance | Element selected | `hidden` attribute toggle | Instant |

---

## 6. Accessibility & Performance

### Accessibility
- **Reduced motion**: Parallax is disabled when `prefers-reduced-motion: reduce` is set — `main.js:101`
- **Semantic HTML**: Proper `section`, `h1`/`h2`, `p` elements
- **Alt text**: All images have descriptive alt attributes
- **ARIA labels**: Editor toggle and music toggle have `aria-label` attributes
- **Loading**: Hero image uses `loading="eager"`, all others use `loading="lazy"`

### Performance
- **No framework overhead**: Pure vanilla JS, no build step
- **Lazy loading**: All below-fold images use `loading="lazy"` — `index.html:56,63,141,154`
- **requestAnimationFrame**: Used for parallax and auto-contrast updates (no layout thrashing)
- **Passive event listeners**: Scroll and resize listeners marked `{ passive: true }` — `main.js:257–258`
- **Canvas optimization**: `willReadFrequently: true` hint for frequent `getImageData` calls — `main.js:162`, `editor.js:217`
- **Observer-based activation**: Auto-contrast only recalculates when hero is in viewport — `main.js:260–265`

---

## 7. Local Development

### Preview Server
Configured in `.claude/launch.json`:
```json
{
  "runtimeExecutable": "python3",
  "runtimeArgs": ["-m", "http.server", "8080", "-d", "kalyanam"],
  "port": 8080
}
```

Start manually:
```bash
cd /Users/murali/Project/JobFinder
python3 -m http.server 8080 -d kalyanam
```
Then visit `http://localhost:8080`

### Replacing Images
Place your images in `kalyanam/assets/images/` with these exact filenames:
- `kathakali-motif.png` — decorative motif (recommended: transparent PNG)
- `hero-couple.jpg` — hero background (recommended: ≥1080px wide)
- `krishnendu.jpg` — bride photo
- `murali-krishna.jpg` — groom photo
- `henna-hands.jpg` — henna/hands close-up
- `garden-couple.jpg` — closing section photo

### Adding Music
Place an MP3 file at `kalyanam/assets/wedding-music.mp3`. The music player will automatically pick it up.

---

## 8. Deployment (GitHub Pages)

```bash
cd /Users/murali/Project/JobFinder/kalyanam
git init
git add .
git commit -m "Initial commit: Kalyanam wedding invitation"
git remote add origin https://github.com/<username>/<repo>.git
git push -u origin main
```

Then in the GitHub repo: **Settings → Pages → Source: Deploy from branch → Branch: main → Folder: / (root) → Save**.

The site will be live at `https://<username>.github.io/<repo>/`.

---

## 9. File Quick Reference

| Feature | File | Function/Section | Line |
|---|---|---|---|
| Scroll animations | `main.js` | `initScrollAnimations()` | 6 |
| Countdown timer | `main.js` | `initCountdown()` | 25 |
| Calendar download | `main.js` | `initCalendar()` | 62 |
| Parallax | `main.js` | `initParallax()` | 99 |
| Music toggle | `main.js` | `initMusic()` | 121 |
| Per-letter auto-contrast | `main.js` | `initAutoContrast()` | 143 |
| Editor toggle | `editor.js` | Toggle listener | 69 |
| Text selection | `editor.js` | `selectElement()` | 98 |
| Font/size/color controls | `editor.js` | Toolbar handlers | 166–199 |
| Auto-contrast (editor) | `editor.js` | `updateAutoContrast()` | 231 |
| Drag-to-reposition | `editor.js` | Drag handlers | 267–356 |
| Tagline resize | `editor.js` | `addTaglineResize()` | 362 |
| Image crop | `editor.js` | `addImageHandles()` | 410 |
| CSS export | `editor.js` | Copy All CSS handler | 512 |
| CSS custom properties | `style.css` | `:root` | 6 |
| Hero styles | `style.css` | `.hero` block | 85 |
| Name animation | `style.css` | `@keyframes nameSlideIn` | 220 |
| Music button pulse | `style.css` | `@keyframes pulse-ring` | 531 |
| Editor UI styles | `style.css` | Visual Editor section | 544 |
| Responsive breakpoints | `style.css` | `@media` queries | 468 |

---

## 10. Design Intent vs. Implementation — Traceability

This section documents the original intent behind every feature as expressed through prompts and the plan, maps each intent to the code that implements it, and flags any areas where the intent may not be fully realized. This exists so that anyone reviewing the code can verify completeness and correctness.

---

### 10.1 Project Goal

**Intent**: Murali has a wedding invitation on Readymag (free account, locked to smartphone resolution). The goal was to recreate it as a standalone static site that looks identical to the original but with improvements — better animations, more interactivity, faster performance — and host it for free on GitHub Pages.

**What this means for the code**: The entire site is plain HTML/CSS/JS with zero framework dependencies. There is no build step, no npm, no bundler. You can open `index.html` directly or serve it from any static host. The plan explicitly chose this stack to eliminate Readymag's framework overhead and keep hosting free.

**Status**: Implemented. The site is a self-contained static project. GitHub Pages deployment is documented but not yet executed — the user needs to create the repo and push.

---

### 10.2 Faithful Recreation from Screenshots

**Intent**: The Readymag site could not be source-copied (it renders via JavaScript and returns empty HTML via fetch). The recreation was done entirely from screenshots the user shared. The plan documents the exact layout derived from those screenshots — section order, text content, color values, photo placement, font choices.

**What this means for the code**: All text content (names, bios, venue details, tagline) was transcribed from screenshots. Colors like `#E1DEDB` (cream), `#444444` (dark olive), `#C6B580` (gold) were sampled from the screenshots. The 2-column alternating grid layout (text left/photo right, then photo left/text right) mirrors the Readymag original.

**Status**: Implemented. However, the plan initially specified **Great Vibes** for names and **EB Garamond italic** for the tagline. The user corrected these after comparing with the original:

| Element | Plan said | User corrected to | Code uses |
|---|---|---|---|
| Couple names | Great Vibes | **Tangerine** | `--font-script: 'Tangerine'` — `style.css:18` |
| Tagline | EB Garamond italic | **Sacramento** | `--font-sacramento: 'Sacramento'` — `style.css:19` |

These corrections are applied in the code. The plan file itself was not updated and still says Great Vibes — so the **plan is stale on font choices; the code is correct**.

---

### 10.3 Name Placement — Staggered on Green Foliage

**Intent**: The user explicitly said: *"the names are placed on the green foliage on the bottom. staggered."* In the original Readymag site, "Krishnendu" is right-aligned and "Murali Krishna" is left-aligned, both sitting over the green gradient at the bottom of the hero photo. They are not centered.

**What this means for the code**:
- `.hero__names` is `position: absolute; bottom: 2%` — pinned to the bottom of the hero — `style.css:179–185`
- `.hero__name--bride` has `text-align: right; padding-right: 5%` — `style.css:196–199`
- `.hero__name--groom` has `text-align: left; padding-left: 3%` — `style.css:213–217`
- The ampersand sits between them, slightly off-center: `padding-right: 15%` — `style.css:203–211`

**Status**: Implemented. The initial implementation had names centered; the user corrected this and the staggered layout was applied.

---

### 10.4 Per-Letter Dynamic Auto-Contrast

**Intent (evolved across two prompts)**:

1. First prompt: *"I changed the color of the letters based on the background. So the complete writing has a combination of colors."* — The user wanted the tagline text to have different colors for different parts, matching what they had manually done on Readymag.

2. Second prompt (refinement): *"rather than adding the contrast for the text for the whole text box, could we rather make it for individual letters. and also it should be dynamic live on the webpage, since the whole text moves."* — The user explicitly wanted **per-letter** granularity (not per-word or per-textbox) and **live** updates (not static).

**What this means for the code**:
- Each character is wrapped in its own `<span class="ac-letter">` — `main.js:148–158`
- A hidden canvas holds the hero image at full resolution for pixel sampling — `main.js:160–174`
- The overlay blending function (`getOverlayAlpha`) replicates the CSS gradients mathematically so the sampled color accounts for what the user actually sees, not just the raw photo — `main.js:179–198`
- `updateLetters()` runs per-letter: maps each span's screen position to canvas coordinates, samples, blends, computes luminance, picks a contrasting color — `main.js:200–245`
- Updates fire on scroll and resize via `requestAnimationFrame`, so as parallax moves the photo behind the text, letter colors update live — `main.js:248–258`
- An `IntersectionObserver` on `.hero` avoids unnecessary work when the hero is off-screen — `main.js:260–265`

**Three-tier color logic** — `main.js:236–244`:
- Luminance > 0.55 (bright background): dark text `#1a1a1a`
- Luminance 0.40–0.55 (mid-range): gold text `#c6b580`
- Luminance < 0.40 (dark background): white text `#ffffff`

**Intent gap to watch for**: The gold mid-range tier (`#c6b580`) was a design decision made during implementation to avoid jarring black-to-white transitions. The user's original prompt only implied "a combination of colors" — the gold tier is an aesthetic interpolation. If you find that letters in the mid-range look odd on a specific hero photo, adjusting the thresholds (0.55 and 0.40) or the mid-range color may be needed.

**Status**: Fully implemented. The "live" requirement is met — letters recolor as the page scrolls and the parallax shifts the background.

---

### 10.5 Visual Editor — Generalized Text Editing

**Intent (evolved across two prompts)**:

1. First prompt: *"Would it be possible for me to have more finegrained control over the placement of the names? and the colors? Maybe moving them physically?"* — Originally requested just for the hero names.

2. Second prompt (generalization): *"Could you generalize the visual editor to all texts. So that we are able to select any text and make modifications. Also to the font, listing the available fonts."* — Expanded to every text element on the page.

**What this means for the code**:
- `TEXT_SELECTOR` matches all text elements across all five sections — `editor.js:27–34`
- Click-to-select with event delegation — `editor.js:83–96`
- Floating toolbar reads the element's current computed style and populates controls — `editor.js:98–146`
- Nine font options in the dropdown (all Google Fonts already loaded plus system fallbacks) — `editor.js:14–24`

**Status**: Implemented. Every visible text element is selectable and editable.

---

### 10.6 Drag-to-Reposition

**Intent**: *"moving them physically"* — the user wanted to drag text elements to new positions for fine-tuning layout.

**What this means for the code**:
- Opt-in via "Drag" checkbox per element — `editor.js:267–282`
- Converts element to `position: absolute` relative to its parent — `editor.js:271–281`
- Mouse and touch drag handlers — `editor.js:284–333`
- During drag, if auto-contrast is on, the letter color updates live as it moves over different backgrounds — `editor.js:330–332`

**Intent gap to watch for**: Converting to `position: absolute` takes the element out of normal flow. If you drag a large block of text (like the tagline), it will overlap other content rather than pushing it down. This is by design for fine-tuning, but it means dragged elements can end up in unexpected visual states. The "Copy All CSS" export captures the final position so it can be made permanent.

**Status**: Implemented.

---

### 10.7 Tagline Resizable Text Box

**Intent**: *"for the text under Kalyanam in the first page, can it be made such that we can make the text box larger or smaller"* — The tagline wraps across multiple lines; the user wanted control over how wide the text box is (affecting line breaks and overall shape).

**What this means for the code**:
- When the tagline (`.hero__tagline`) is selected, a resize handle appears on the right edge — `editor.js:362–400`
- Dragging horizontally changes `maxWidth` and `width` — `editor.js:390–394`
- The tagline's default `max-width: 340px` (`style.css:168`) constrains it; the resize handle overrides this
- Minimum width is clamped to 120px — `editor.js:392`

**Status**: Implemented. Only the horizontal (east) resize handle was added. There is no south (vertical) resize handle because the tagline's height is determined by its content wrapping — changing width implicitly changes height.

---

### 10.8 Image Crop by Dragging Edges

**Intent (evolved across two prompts)**:

1. First prompt: *"I would like to adjust the height of the images by trimming the top or bottom. Could you also make this possible by maybe giving the ability to drag the top and bottom of each page or image."*

2. Second prompt (page shrink requirement): *"for the image resizing the page size should also shrink according to changing the image size. This should be the case for all images."*

**What this means for the code**:
- Handles appear on all images tagged with `data-ed-img` — `editor.js:410–446`
- **Bottom handle**: Changes `img.style.height` directly (not the container), growing or shrinking the rendered area — `editor.js:475–479`
- **Top handle**: Changes height AND shifts `object-position` so the visible portion of the image changes (effectively "trimming from the top") — `editor.js:481–486`
- **Page shrink**: `img.style.minHeight = '0'` is set explicitly to override CSS `min-height` values, allowing the image to shrink smaller than its default — `editor.js:479`. The surrounding layout (CSS Grid cells, following sections) reflows naturally around the new image height.
- Applied to all four content images: krishnendu, murali-krishna, henna-hands, garden-couple — `index.html:56,63,141,154`

**Intent gap to watch for**: The hero photo (`hero-couple.jpg`) does NOT have a `data-ed-img` attribute and is not croppable via the editor. This is intentional — the hero photo is full-viewport and its height is controlled by the viewport itself (`min-height: 100vh`). If you wanted the hero photo to also be croppable, a `data-ed-img="hero"` attribute would need to be added to `index.html:31`, and the crop logic would need to account for the viewport-height constraint.

**Status**: Implemented for all content images. The page-shrink behavior works because the image height is changed directly (not clipped via overflow), so CSS Grid rows recalculate.

---

### 10.9 CSS Export Workflow

**Intent**: Implicit in the editor design — the visual editor is a tuning tool, not a CMS. Changes are made visually, then exported as CSS to be pasted into `style.css` for permanence.

**What this means for the code**:
- Every property change calls `record(el, prop, value)` — `editor.js:490–493`
- "Copy All CSS" generates a CSS string with selectors derived from class names — `editor.js:512–534`
- Selector generation filters out editor-internal classes (`ed-*`, `animate-on-scroll`, `is-visible`) — `editor.js:497–499`

**Intent gap to watch for**: The generated selectors use class names (e.g., `.hero__name--bride`), which works well for BEM-style classes. However, for `.ac-letter` spans (individual letters), the selector will be `.ac-letter` which matches ALL letters — you cannot export per-letter colors via "Copy All CSS" since they all share the same class. The live auto-contrast system in `main.js` handles per-letter colors at runtime; exporting them as static CSS would require unique selectors (e.g., `.ac-letter:nth-child(n)`) which is not currently implemented.

**Status**: Implemented, with the per-letter limitation noted above.

---

### 10.10 Improvements Over Readymag

The plan listed three categories of improvements. Here is the status of each:

#### Animations (Plan §Improvements #1)

| Planned | Status | Code |
|---|---|---|
| Fade-in + slide-up on scroll | Implemented | `main.js:6–22`, `style.css:66–80` |
| Smooth parallax on hero image | Implemented | `main.js:99–118` |
| Name text entrance animation | Implemented | `style.css:220–241` (staggered `@keyframes nameSlideIn`) |
| Subtle hover effects on buttons | Implemented | `style.css:424–428` (event buttons darken on hover) |

#### Interactivity (Plan §Improvements #2)

| Planned | Status | Code |
|---|---|---|
| Live countdown timer | Implemented | `main.js:25–59` |
| .ics calendar download | Implemented | `main.js:62–96` |
| Google Maps link | Implemented | `index.html:112` (`<a href="https://maps.google.com/...">`) |
| Background music toggle | Implemented | `main.js:121–140`, `index.html:186–199` |

#### Performance (Plan §Improvements #3)

| Planned | Status | Code |
|---|---|---|
| No framework overhead | Implemented | Zero dependencies, vanilla JS |
| Lazy-loaded images | Implemented | `loading="lazy"` on 4 of 5 images |
| Optimized images | **Not yet done** | Images are 3–6 MB each (originals). See §10.13 |
| Fast load on mobile | Partially — blocked by image sizes | See §10.13 |

---

### 10.11 Scroll-Snap

**Intent**: The plan mentioned *"scroll-snap (optional)"* under the tech stack.

**Status**: **Not implemented**. CSS `scroll-snap` was considered but not added. The sections flow continuously with smooth scrolling instead. If desired, it could be added to `html` with `scroll-snap-type: y mandatory` and each `section` with `scroll-snap-align: start`.

---

### 10.12 GitHub Pages Deployment

**Intent**: Host the site for free on GitHub Pages.

**Status**: **Not yet done**. The code is ready for deployment — it's a static site that works from the root directory. The deployment steps are documented in §8 above. The user needs to create a GitHub repo and push.

---

### 10.13 Image Optimization

**Intent**: The plan mentions *"Optimized placeholder images (user swaps originals later)"* and *"Fast load on mobile networks."*

**Status**: **Not optimized**. The current images are full-resolution originals:
- `hero-couple.jpg` — 3.9 MB
- `krishnendu.jpg` — 6 MB
- `murali-krishna.jpg` — 6 MB
- `henna-hands.jpg` — 3.4 MB
- `garden-couple.jpg` — 4.9 MB
- `kathakali-motif.png` — 1.3 MB

**Total: ~25 MB** — far too heavy for mobile networks. Before deploying to GitHub Pages, these should be:
1. Resized to a maximum width of 1080px (the site caps at 480px CSS, so even 1080px is generous)
2. Compressed to JPEG quality 80–85 (target: 100–300 KB per image)
3. Optionally converted to WebP with JPEG fallback for further savings
4. The motif PNG could be converted to SVG if a vector version exists

This would reduce total payload from ~25 MB to ~1–2 MB.

---

### 10.14 Music File

**Intent**: The user confirmed wanting background music after being asked. The plan lists it as *"Optional: background music toggle"*.

**Status**: The player code is fully implemented (`main.js:121–140`, `index.html:186–199`). However, the **actual music file** (`assets/wedding-music.mp3`) needs to be provided by the user. The player will silently fail (no error) if the file is missing — the toggle button will appear but clicking it won't produce sound.

---

### 10.15 Auto-Contrast in the Editor vs. in Main

There are **two separate auto-contrast systems** and this is intentional:

1. **`main.js` — `initAutoContrast()`**: The live per-letter system for the tagline. Always active. Wraps every character in `<span>`, samples per-pixel, blends with overlays, uses 3-tier color logic (dark/gold/white). This is the production feature visible to wedding guests.

2. **`editor.js` — `updateAutoContrast()`**: A simpler per-element system used in the visual editor. Opt-in via checkbox. Samples a 20×20 pixel area at the element's center (not per-letter), uses 2-tier color logic (dark/white at threshold 0.45), does NOT blend with CSS overlays. This is a convenience tool for the site author.

The editor version is simpler because it needs to work on any arbitrary text element (not just the tagline), and per-letter wrapping of arbitrary elements during editing would be complex and disruptive.

---

### 10.16 Summary: What Is and Isn't Done

| Item | Status |
|---|---|
| Faithful layout recreation from Readymag | Done |
| Font corrections (Tangerine, Sacramento) | Done |
| Staggered name placement | Done |
| Per-letter live auto-contrast | Done |
| Scroll animations | Done |
| Countdown timer | Done |
| .ics calendar download | Done |
| Google Maps link | Done |
| Parallax | Done |
| Background music player | Done (needs MP3 file) |
| Visual editor (all text) | Done |
| Drag-to-reposition | Done |
| Tagline resize | Done |
| Image crop handles | Done |
| CSS export | Done |
| Name entrance animation | Done |
| Responsive/mobile-first | Done |
| Desktop card cap at 480px | Done |
| Image optimization | **Not done** |
| GitHub Pages deployment | **Not done** |
| Scroll-snap | **Not implemented** (was optional) |
| Music file provided | **Awaiting user** |
