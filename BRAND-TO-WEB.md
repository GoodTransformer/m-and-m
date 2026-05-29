# Brand → Web translation

How the **Wedding Brand Identity Guide** becomes this website. The guide is the
authority; this document records the decisions. The governing rule throughout is
the guide's own: **depth first, glow second, softness third** — and the ratio of
**85–90 % refined old-world romance to 10–15 % selective wit**.

> An elevated, candlelit, art-inspired wedding with literary depth, old-world
> elegance, champagne-and-espresso warmth, sophisticated romantic drama, and a
> few carefully chosen moments of self-aware play.

---

## Colour

Tokens live in [`src/styles/tokens.css`](src/styles/tokens.css). Every value is
taken verbatim from the guide's palette.

| Role | Token | Hex |
|---|---|---|
| Page ground | `--bg` Candle Ivory | `#f2e8d8` |
| Secondary ground | `--bg-alt` Old Parchment | `#d8c7a8` |
| Glow panel | `--bg-glow` Champagne Silk | `#cbb891` |
| Card / linen | `--bg-card` (parchment+ivory) | derived |
| Dark interlude | `--bg-deep` Dark Walnut | `#2b1b14` |
| Body ink | `--text` Espresso | `#24140f` |
| Display ink | `--text-display` Dark Walnut | `#2b1b14` |
| Metals | `--bronze` `#6c4f36` · `--brass` `#a47a48` |
| Accent / CTA | `--accent` Oxblood | `#5b1215` |
| Accent (wine) | `--accent-wine` Burgundy | `#6e1c28` |
| The wink | `--wink` Cherry `#c6414e` · `--wink-soft` Cake `#e8a8b8` |

**Contrast law.** Body text is only Espresso / Dark Walnut / Deep Ivy on light
grounds, and Candle Ivory on dark interludes. Oxblood and Burgundy are for
emphasis, headings and buttons. Brass, rose, cake and cherry are decorative or
large-display only — **never default text**. All token pairs are checked to
WCAG 2.2 AA (body inks ≥ 10:1; oxblood CTA 11.2:1; ivory-on-walnut 13.6:1).

**The wink** appears in exactly two places: the cherry lozenge on *A Note on
Gifts*, and the red `///` of the what3words addresses. Pink is never page
atmosphere.

---

## Typography

Defined in [`src/styles/typography.css`](src/styles/typography.css); fonts
self-hosted via Fontsource.

- **Display — Fraunces** (variable, optical sizing). Hero, chapter titles,
  venue names, the italic ampersand.
- **Body — EB Garamond** (variable). Copy, lists, captions.
- **Chapter labels** — small-caps, letter-spaced, bronze, with a roman numeral
  (`I · Welcome`). The literary "chapter" device — never a book/quill motif.
- No script faces, no calligraphy. The model is a private-press broadside, not a
  calligraphed save-the-date.
- Fluid scale via `clamp()`; body measure 60–66ch, poetic intros 38–46ch.

---

## Layout, spacing & motion

- 4px spacing scale; section padding on a generous `clamp()` for "expensive"
  whitespace. Mobile is one column; desktop gains **air, not clutter** — splits,
  balanced grids, the same structure enlarged.
- Motion is subtle and optional: a slow reveal-on-scroll, hover underlines on
  desktop, a gentle FAQ open. **`prefers-reduced-motion` is fully respected**,
  and a `<noscript>` fallback keeps everything visible without JavaScript.

---

## Bilingual system (English · Español)

- Astro i18n routing: English at `/`, Spanish at `/es/`
  ([`astro.config.mjs`](astro.config.mjs)).
- All copy is typed against one contract ([`src/i18n/types.ts`](src/i18n/types.ts)),
  so the two editions can never drift out of sync.
- The masthead **EN · ES** toggle and the hero language link both preserve the
  current page (`/es/venues` ⇄ `/venues`) via
  [`localePath()`](src/lib/i18n.ts).

## Copy symmetry

Per the brief: where a section has paired copy blocks, the text is written to
**matched character counts within each language** (Spanish ≈ 1.2× English), and
the layout enforces structural symmetry (equal grid tracks, equal-height cards).
Budgets and a dev-time check live in [`src/lib/symmetry.ts`](src/lib/symmetry.ts).

---

## Components

Primitives and features in [`src/components/`](src/components/): `Masthead`,
`LanguageToggle`, `Footer`, `Chapter`, `Rule`, `Button`, `Card`, `QuickActions`,
`Hero`, `WeekendTimeline`, `VenueCard` (maps + what3words), `Faq` (native
`<details>`), `ImagePlaceholder` (framed like a plate in an art book). Page
bodies live in [`src/components/pages/`](src/components/pages/) and are shared by
both locales.

## Maps & directions

Static, no map library, no API key ([`src/lib/maps.ts`](src/lib/maps.ts)): a
universal Google Maps directions link (works cross-platform), an Apple Maps
link, and a branded what3words link per venue.

---

## Accessibility & performance

WCAG 2.2 AA: semantic landmarks, heading order, labelled controls, visible brass
focus rings, keyboard-operable menu (with Esc), reduced-motion + no-JS
fallbacks, large tap targets, contrast-tested tokens. Performance: static HTML,
minimal JS (one tiny island for the menu + reveal), self-hosted woff2, declared
image dimensions (zero layout shift), `noindex, nofollow` for the private
preview.

## The final creative check (applied to every screen)

Elevated, candlelit, literary, old-world, romantic? Champagne glow + espresso
depth + antique warmth? Any playful/pink moment used *sparingly and knowingly*?
Avoids soft / rustic / bright / cliché / theme-like? — the guide's own test.
