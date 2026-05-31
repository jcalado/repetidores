---
name: Repetidores
description: Visual system for the Portuguese ham radio directory. Calm Console — soft elevation, azulejo accent, modern restraint.
colors:
  azulejo-50:  "#f1f4f8"
  azulejo-100: "#dde6f0"
  azulejo-200: "#b8cce0"
  azulejo-300: "#84a4c7"
  azulejo-400: "#4d7eb0"
  azulejo-500: "#1d65a8"
  azulejo-600: "#0e5594"
  azulejo-700: "#0a467f"
  azulejo-800: "#07375f"
  azulejo-900: "#052741"
  azulejo-950: "#061826"
  ink-light:           "oklch(0.16 0.012 250)"
  paper-light:         "oklch(0.99 0.005 250)"
  rule-light:          "oklch(0.92 0.008 250)"
  muted-fg-light:      "oklch(0.56 0.012 250)"
  surface-soft-light:  "oklch(0.97 0.006 250)"
  ink-dark:            "oklch(0.985 0.005 250)"
  paper-dark:          "oklch(0.16 0.012 250)"
  surface-dark:        "oklch(0.21 0.014 250)"
  surface-soft-dark:   "oklch(0.27 0.016 250)"
  muted-fg-dark:       "oklch(0.71 0.012 250)"
  success:             "oklch(0.55 0.13 145)"
  warning:             "oklch(0.72 0.13 75)"
  destructive:         "oklch(0.577 0.245 27.325)"
  destructive-dark:    "oklch(0.704 0.191 22.216)"
typography:
  display:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.875rem, 3.2vw, 2.5rem)"
    fontWeight: 600
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.005em"
  title:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.35
    letterSpacing: "normal"
  body:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.55
    letterSpacing: "normal"
  label:
    fontFamily: "var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.04em"
  mono:
    fontFamily: "var(--font-geist-mono), ui-monospace, SFMono-Regular, monospace"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0"
rounded:
  sm: "0.25rem"
  md: "0.5rem"
  lg: "0.625rem"
  xl: "0.875rem"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "40px"
components:
  button-primary:
    backgroundColor: "{colors.ink-light}"
    textColor: "{colors.paper-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body}"
    height: "36px"
  button-primary-hover:
    backgroundColor: "{colors.azulejo-700}"
    textColor: "{colors.paper-light}"
  button-outline:
    backgroundColor: "{colors.paper-light}"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body}"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "8px 16px"
    typography: "{typography.body}"
  input:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    rounded: "{rounded.md}"
    padding: "4px 12px"
    height: "36px"
    typography: "{typography.body}"
  badge:
    backgroundColor: "{colors.azulejo-100}"
    textColor: "{colors.azulejo-700}"
    rounded: "{rounded.sm}"
    padding: "2px 8px"
    typography: "{typography.label}"
  callsign:
    backgroundColor: "transparent"
    textColor: "{colors.ink-light}"
    typography: "{typography.mono}"
---

# Design System: Repetidores

## 1. Overview

**Creative North Star: "Calm Console"**

Repetidores is a contemporary tool for a community that values precision. The system reads as 2026 software, not 2008 directory: soft elevation, rounded surfaces, a single confident accent, generous interaction motion. But every modern convention is held in restraint by the trust mission. Soft shadows replace hairlines. Pill-shaped controls replace stamped badges. Gradient accents are permitted, sparingly, on a single noun in a headline or on the brand wordmark. Nowhere else.

Azulejo blue (#1d65a8) is the single voice of state, named for the cobalt-tin glaze of Portuguese tile work. It carries active route, focus ring, link hover, primary CTA, the upvote signal, and live-event indicators. Neutrals share the azulejo hue family at imperceptible chroma so the page reads as one material instead of accent-on-grey. The system explicitly rejects QRZ.com's 2005 gradients, ANACOM-portal greys, crypto neon, generic indistinguishable Linear clones, hero-metric SaaS templates, and any consumer-app gamification. There are no mascots, no streaks, no confetti, no glass-on-everything.

**Key Characteristics:**
- Monospace for every callsign, frequency, locator, and timestamp. Always. (The Callsign Rule survives every redesign.)
- Soft elevation (1px border + low-spread shadow) defines surfaces. Cards are first-class.
- Rounded corners are the dominant geometry: `rounded-xl` cards, `rounded-lg` inputs, `rounded-full` badges and nav pills.
- Azulejo as the single accent (≤15% of screen), used freely on interactive elements but never as decoration.
- Neutrals carry chroma 0.005–0.016 at hue 250. No pure achromatic OKLCH anywhere.
- Light and dark ship at parity; neither is the default.
- Controlled glass on the sticky Header and floating overlays only. Never on body content.
- Motion is purposeful: hover lifts, focus rings, soft transitions. No spring physics. No cursor-follow. No scroll-driven parallax.

## 2. Colors

A disciplined palette: faintly cool neutrals share the brand hue family; Azulejo is the single voice of state.

### Primary
- **Azulejo 500** (#1d65a8): The brand accent. Used for primary links, focused input rings, the upvote signal, selected map markers, and the primary CTA fill. The only saturated colour on most screens.
- **Azulejo 600** (#0e5594): Hover and pressed state for primary CTAs in light mode; link hover.
- **Azulejo 400** (#4d7eb0): Link and accent colour in dark mode (lifted L for AA contrast on dark Paper).
- **Azulejo 100** (#dde6f0): Muted accent surface in light mode. Tints badges, selected list rows, hover backgrounds, the icon backplate on tool cards.

### Neutral (Light)
- **Paper** (oklch(0.99 0.005 250)): Card, popover, app background. Faintly cool; never pure white.
- **Ink** (oklch(0.16 0.012 250)): Body text, primary button background, headings. Faintly cool; never pure black.
- **Muted Foreground** (oklch(0.56 0.012 250)): Secondary text, table column labels, timestamps.
- **Rule** (oklch(0.92 0.008 250)): Soft 1px borders on cards, inputs, and dividers. Paired with the elevation shadow; not the sole hierarchy carrier.
- **Surface Soft** (oklch(0.97 0.006 250)): Hover row, ghost button hover, subtle separators.

### Neutral (Dark)
- **Paper** (oklch(0.16 0.012 250)): App background.
- **Surface** (oklch(0.21 0.014 250)): Card, popover, sidebar.
- **Surface Soft** (oklch(0.27 0.016 250)): Hover, muted backgrounds.
- **Ink** (oklch(0.985 0.005 250)): Primary text.
- **Muted Foreground** (oklch(0.71 0.012 250)): Secondary text.
- Borders use `oklch(1 0 0 / 10%)`, inputs use `oklch(1 0 0 / 15%)`, both as alpha overlays.

### Semantic
- **Success** (oklch(0.55 0.13 145)): Repeater verified-recent, vote-up confirmed, successful submission. ~107° hue from Azulejo, never confused.
- **Warning** (oklch(0.72 0.13 75)): Repeater unverified > 30 days, stale data, "review needed."
- **Destructive (Light)** (oklch(0.577 0.245 27.325)): Vote-down, delete, error states. Hue 27 vs Azulejo's hue 252: 225° apart, completely separated. Destructive is for danger signals only; Azulejo carries everything else interactive.
- **Destructive (Dark)** (oklch(0.704 0.191 22.216)): Same role in dark mode, lifted in lightness to hold contrast.

### Named Rules

**The Single Voice Rule.** Azulejo is the only saturated chroma on most screens. If a second saturated colour appears, it must signal distinct state: Success (verified), Warning (stale), Destructive (delete/error), or genuine data viz. Decoration never qualifies as state.

> **Sanctioned exception — Tool Grid (`src/app/page.tsx` `ToolsRow`)**: the landing's quick-access grid is permitted a per-tile pastel **icon backplate** rotated across 5 hues (azulejo 252, cyan 200, sage 145, buttercup 75, lilac 320). Chroma is capped at **≤ 0.050** on the backplate fill and **≤ 0.130** on the icon glyph (L ≈ 0.92 / 0.45 light, 0.26 / 0.78 dark). The exception applies *only* to the 36px icon swatch inside each tile — not the tile background, not the label colour, not the hover state, not any other surface anywhere on the site. The justification is category identity for a small, dense affordance: each tile is a distinct semantic destination and the hue rotation accelerates scanning. Treat any extension of this pattern to another surface as a bug.

> **Sanctioned exception — Mode Taxonomy (`src/lib/mode-colors.ts`)**: repeater **modulation** is categorical identity, so the seven modes carry a fixed hue each — FM blue, DMR purple, D-STAR cyan, C4FM rose, TETRA amber, EchoLink emerald, AllStar orange. This single palette is shared by three surfaces: the table "Modos" badges (`MODE_BADGE_COLORS`), the `/repetidores` quick-filter tiles, and the mobile filter chips (`MODE_TILE_COLORS`), so an operator recognises a mode by its colour at a glance. Rules: the hue assignment is **fixed and identical across every surface** (always source from `lib/mode-colors`, never re-key inline); the palette is **capped at the seven real modes** (`Digipeater` and any unknown mode fall back to the muted neutral, not a new hue); the colour appears only as a soft tint at rest (badge fill, tile icon/dot) and a solid fill when a tile is selected; `Todos`/“all” affordances stay azulejo, not a mode hue. The justification is the same as the Tool Grid: dense categorical recognition. Decorative per-*anything-else* colour (per-event-type, per-protocol-block, per-category) is still a bug; this exception covers the mode taxonomy only.

**The Tinted Neutral Rule.** Every neutral carries chroma 0.005 to 0.016 at hue 250. Pure achromatic OKLCH (chroma 0) is forbidden anywhere. The cool tint must be barely perceptible in isolation but reliably present so the page reads as a single material instead of accent-on-grey.

**The Controlled Gradient Rule.** Exactly one gradient placement is permitted across the entire site: a single noun in the hero headline (the highlighted word, e.g. "repetidores" in "O diretório português de repetidores, eventos e ferramentas"). No gradients on the wordmark, body text, card backgrounds, full headlines, page backgrounds, buttons, or icons. Every other gradient is a bug.

**The Soft Elevation Rule.** Cards earn their hierarchy through 1px Rule border + low-spread shadow (`shadow-sm` / `shadow-md`), not borders alone. The shadow is part of the affordance; removing it makes the card look broken.

## 3. Typography

**Display / Body Font:** Geist Sans (Vercel), via `next/font/google` as `var(--font-geist-sans)`. Fallback: `ui-sans-serif, system-ui, sans-serif`.
**Mono Font:** Geist Mono, via `var(--font-geist-mono)`. Fallback: `ui-monospace, SFMono-Regular, monospace`.

**Character:** Geist Sans is geometric without being cold; Geist Mono is dense without being terminal-coded. Together they read as a contemporary technical pairing that matches the calm-precise voice of PRODUCT.md. No editorial serif, no condensed display face: the system does not perform.

### Hierarchy
- **Display** (600, `clamp(1.875rem, 3.2vw, 2.5rem)`, line-height 1.1, tracking -0.01em): Page hero titles only. One per page.
- **Headline** (600, 1.5rem, line-height 1.2): Section heads inside a page; collection titles.
- **Title** (600, 1.125rem, line-height 1.35): Card and panel titles, table titles.
- **Body** (400, 0.875rem, line-height 1.55): Default running text. Max line length **65–75ch**; never wider.
- **Label** (500, 0.75rem, tracking 0.04em): Table column heads, filter chip labels, timestamps. Sentence case in Portuguese, never SCREAMING UPPERCASE.
- **Mono** (500, 0.875rem, tracking 0): Every callsign, frequency, CTCSS tone, QTH locator, timestamp, vote count.

### Named Rules
**The Callsign Rule.** Every callsign, frequency, locator, tone, and absolute timestamp renders in Geist Mono. There are no exceptions. A callsign in proportional type is a bug.

**The No-All-Caps Rule.** Labels use sentence case. Portuguese reads poorly in uppercase; ham operators read worse. Uppercase is reserved for two-letter ITU band codes (VHF, UHF) and statutory acronyms (ANACOM, CTCSS).

## 4. Elevation

Soft elevation is the system's signature. Every card sits on a 1px Rule border *and* a low-spread shadow; together they read as "lifted from the page." The shadow is part of the affordance.

### Shadow Vocabulary
- **rest** (`box-shadow: 0 1px 2px oklch(0.20 0.012 250 / 0.06), 0 4px 12px oklch(0.20 0.012 250 / 0.04)`): All cards, tool tiles, content panels at rest. Subtle but present.
- **hover** (`box-shadow: 0 1px 2px oklch(0.20 0.012 250 / 0.08), 0 8px 24px oklch(0.20 0.012 250 / 0.08)`): Interactive cards on hover, paired with a 2px upward translate. Total motion duration ≤150ms, ease-out.
- **floating** (`box-shadow: 0 12px 32px -8px oklch(0.20 0.012 250 / 0.20)`): Dropdowns, popovers, command palette, map overlays. Real elevation.

Shadows use the cool ink hue (oklch 0.20 / 0.012 / 250) at low alpha, never pure black. They tint into the same hue family as the page, which is why they read as integrated lift rather than drop-shadow droppings.

### Glassmorphism Policy
Two and only two surfaces are permitted `backdrop-blur`:
1. The sticky **Header** (pill nav with subtle blur over the scrolled content beneath).
2. The **CommandPalette** and **Popover** overlays.

Body content (cards, sections, hero) is solid Paper or solid Surface. Glass on body content is a bug.

## 5. Components

### Buttons
- **Shape:** `0.75rem` radius (`rounded-lg`); pill (`rounded-full`) for nav items and tag selectors. Heights: 36px default, 32px sm, 40px lg.
- **Primary:** Linear gradient (135°) Azulejo 500 → Azulejo 600, white text, low-spread Azulejo-tinted shadow (`0 2px 6px oklch(0.50 0.137 252 / 0.35)`). Hover deepens to Azulejo 600 → Azulejo 700 and the shadow lifts.
- **Outline:** Paper background, Rule border, Ink text. Hover fills Surface Soft, border shifts to Azulejo 300.
- **Ghost:** Transparent. Hover fills Azulejo 100 (light) / Azulejo 900/30 (dark), text shifts to Azulejo 700.
- **Destructive:** Solid Destructive background, white text. Reserved for delete only.
- **Focus:** 3px ring of Azulejo 500 at 40% alpha + 2px ring offset. Always visible on `:focus-visible`.
- **Icon-only:** Square (`rounded-lg`, `size-9` / `size-8` / `size-10`). Carries an `aria-label` or `sr-only` text.

### Inputs
- **Style:** Paper background (light) / oklch(1 0 0 / 5%) fill (dark), Rule border, 36px height, 12px horizontal padding, `rounded-lg`.
- **Focus:** Border shifts to Azulejo 500, 3px ring of Azulejo 500 / 40.
- **Invalid:** Border and ring shift to Destructive.

### Cards
- **Shape:** `0.875rem` radius (`rounded-xl`). Standard for most content surfaces.
- **Background:** Card token (Paper-light / Surface-dark).
- **Border:** 1px Rule.
- **Shadow:** **rest** vocabulary mandatory at all times. The shadow is part of the card; cards without elevation read as broken under this system.
- **Internal Padding:** 22px–24px (`p-5` to `p-6`).
- **Interactive cards** (tool tiles, news lead): hover lifts to **hover** shadow vocabulary with `transform: translateY(-2px)`. 150ms ease-out.
- **No nested cards.** Ever.

### Badges
- **Shape:** `rounded-full` pill. Replaces the prior ticket-stamp shape.
- **Default:** Azulejo 100 fill, Azulejo 700 text, label typography. 2px vertical / 9px horizontal padding.
- **Status variants:** Success / Warning / Destructive each with their semantic background-tint and matching darker text. Outline-only badges allowed inside data tables for density.
- **Live indicator:** A 5px dot using Azulejo 500 with a slow `opacity 1 → 0.4 → 1` pulse (2s, `prefers-reduced-motion` honoured).

### Tool tiles (landing-specific)
- **Shape:** `rounded-xl` card with rest shadow.
- **Layout:** 36px square icon backplate (one of the Azulejo-tinted neutrals: brand / blue / green / amber / pink) at top-left, label below in semibold 15px, sublabel in 12.5px muted, trailing arrow at top-right.
- **Hover:** Lift 2px, hover shadow, border shifts to Azulejo 200.

### Table (Repeater Row, the signature surface)
- **Layout:** `@tanstack/react-table` with frozen header. Mono columns: callsign, output, input, tone. Proportional columns: location, owner, modulation.
- **Density:** 36px row height default, 44px on touch. Vertical hairline dividers between column groups, not every column.
- **Hover:** Row background shifts to Surface Soft. No lift on rows; tables stay flat.
- **Selected:** Azulejo 100 fill + 1px inset Azulejo 500 ring. **Never** a left-edge stripe.

### Map Overlays (Leaflet)
- **Tooltips:** Solid Paper, Rule border, `rounded-lg`, mono for callsign + frequency, body for location.
- **Marker clusters:** Azulejo ramp (300 → 500 → 700) by cluster size. Use `--color-azulejo-*` tokens, not raw `rgba(...)`.
- **Map chrome:** Solid Paper at 96% opacity with a Rule border + rest shadow. No glass on map chrome.

### Navigation (Header)
- **Shape:** Sticky **pill** (`rounded-2xl`). Card background with `backdrop-blur-md` over scrolled content. Subtle floating shadow. Inset 12px from viewport edges.
- **Wordmark:** Mono, 16px, semibold. The dot in "radioamador.info" is Azulejo 500 (solid). On viewports below `sm:`, the `.info` segment scales down to 0.75em so the wordmark fits a 360 px header. No accent glyph, no gradient.
- **Nav items:** Ghost pill links (`rounded-lg`, sm), active state fills Azulejo 100 with Azulejo 600 text.
- **Search trigger:** Paper-filled input with magnifier glyph, `rounded-lg`.
- **CTA button:** Primary button vocabulary (gradient + shadow), tucked at right.
- **Active route underline:** Replaced by the pill active-state fill; the underline pattern from the Logbook era is retired.
- **Mobile:** Bottom tab bar in `safe-area-bottom`, pill style.

## 6. Do's and Don'ts

### Do:
- **Do** render every callsign, frequency, CTCSS tone, QTH locator, and absolute timestamp in Geist Mono. The Callsign Rule is non-negotiable across redesigns.
- **Do** put every card on the **rest** shadow vocabulary by default. The system reads as soft elevation; flat cards look broken.
- **Do** show timestamps on data that decays. PRODUCT.md's "earn trust through accuracy" requires visible staleness signals.
- **Do** keep Azulejo as the only saturated chroma. If a second saturated colour appears, it's signalling state (Success / Warning / Destructive / data viz). Decoration never qualifies.
- **Do** tint every neutral toward hue 250 at chroma 0.005 to 0.016. Pure achromatic OKLCH is forbidden.
- **Do** use sentence-case Portuguese in every label. No SCREAMING UPPERCASE except statutory acronyms (ANACOM, CTCSS) and ITU band codes (VHF, UHF).
- **Do** support `prefers-reduced-motion` on every transition. Disable the live-event pulse, hover lifts, and any reveal animations under that media query.
- **Do** pair colour with text or icon for any status signal. Colour is never the sole cue.
- **Do** allow gradient text on exactly one permitted placement: the hero headline accent noun. Use Azulejo 400 → Azulejo 700 only; no rainbow ramps.

### Don't:
- **Don't** apply `backdrop-blur` to anything that isn't the sticky Header or a floating overlay. Body content stays solid.
- **Don't** use a coloured `border-left` greater than 1px as a stripe on cards, list items, callouts, or selected rows. Use a full inset ring or a background tint.
- **Don't** ship the hero-metric card template (big number, gradient accent, supporting stats). PRODUCT.md rejects generic SaaS dashboards by name.
- **Don't** introduce a second gradient placement. One and only one: the hero accent noun.
- **Don't** stack one card inside another. Nested cards always wrong; use a sub-section with a Rule border + 12–16px gap.
- **Don't** introduce mascots, streaks, badges-as-rewards, confetti, or any consumer-app gamification.
- **Don't** use em dashes in UI copy. Use commas, colons, semicolons, periods, or parentheses.
- **Don't** copy QRZ.com, ANACOM-portal greys, crypto neon, or shadcn-default landing-page templates. Those are the four-quadrant trap.
- **Don't** copy QRZ.com's dense gradients-and-ads layout, ANACOM-portal greys, or crypto neon-on-black palettes.
- **Don't** uppercase Portuguese labels. Sentence case only, except for ITU band codes and statutory acronyms.
- **Don't** stack one card inside another. Nested cards are always wrong; use a sub-section with a Rule hairline instead.
- **Don't** use em dashes in any UI copy. Use commas, colons, or periods. The voice is terse.
