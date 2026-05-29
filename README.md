# Mari & Michael — wedding website

A bilingual (English · Español), mobile-first, editorial wedding site for the
marriage of **Mari & Michael** — Magdalen College, Oxford and Weston Manor,
Bicester. Built with **Astro + TypeScript** and a hand-crafted CSS design system
translated from the Wedding Brand Identity Guide. See
[`BRAND-TO-WEB.md`](BRAND-TO-WEB.md) for the design rationale.

> The text and images on the site are tasteful **placeholders**. See
> [Details to confirm](#details-to-confirm) for everything to replace before it
> goes out widely.

## Quick start

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output to ./dist
npm run preview  # serve the built site
```

Requires Node 18+.

## How it's organised

```
src/
  i18n/        en.ts · es.ts   ← all copy (English & Spanish)
               types.ts         ← the shared contract both languages implement
  data/site.ts                  ← dates, venues, coordinates, contacts (facts)
  styles/      tokens.css        ← colours, type, spacing (the design system)
  components/                    ← UI; components/pages/ hold each page's body
  pages/  +  pages/es/           ← thin route wrappers (EN at /, ES at /es/)
  lib/         i18n · maps · format · symmetry
```

### Editing the words

- **Prose & labels:** [`src/i18n/en.ts`](src/i18n/en.ts) and
  [`src/i18n/es.ts`](src/i18n/es.ts). Keep the two in step — TypeScript will flag
  a missing key. Aim to keep paired blocks a similar length within each language.
- **Facts** (date, venue addresses, coordinates, what3words, phone numbers):
  [`src/data/site.ts`](src/data/site.ts). Items marked `PLACEHOLDER` need
  confirming.

### Swapping in real photos

Images are currently the `ImagePlaceholder` component (a framed "plate" that
holds exact dimensions, so there's no layout shift when you replace it). When
photos are ready, drop them in `public/` and replace the relevant
`<ImagePlaceholder … />` with a `<picture>` (export art-directed mobile and
desktop crops; prefer AVIF/WebP; keep the same aspect ratio).

## Details to confirm

Placeholders currently in the site — replace before sharing widely:

- [ ] **Wedding date** (using *Saturday, 12 September 2026*) — `data/site.ts`
- [ ] **Ceremony & reception times** (2:00 pm / 6:30 pm) — `i18n/*.ts` (`weekend`, `today`)
- [ ] **Running order** of the day — `i18n/*.ts` (`weekend.events`)
- [ ] **Dress code** wording (currently *Black tie*) — `i18n/*.ts`
- [ ] **what3words** square for each entrance — `data/site.ts`
- [ ] **On-the-day contact** name + number — `data/site.ts`
- [ ] **Taxi** numbers — `data/site.ts`
- [ ] **Accommodation** recommendations — `i18n/*.ts` (`travel.stays`; add `url` to link out)
- [ ] **Gifts** wording / any fund link — `i18n/*.ts` (`gifts`)
- [ ] **Our Story** copy — `i18n/*.ts` (`story`)
- [ ] **Real photographs** — replace `ImagePlaceholder`s
- [ ] Verify venue **coordinates** (entrances) — `data/site.ts`

> **RSVP** is intentionally not on this site — the couple use a separate RSVP
> system. (If you ever want a discreet outbound "RSVP" link to it, it can be
> added to the masthead/quick-actions in minutes.)

## Privacy

The site ships with `noindex, nofollow` so it stays out of search results. On
GitHub Pages that meta tag is the control (Pages can't send the stronger
`X-Robots-Tag` header — that's added on Vercel later).

## Deployment

### Now — GitHub Pages (preview)

Published under the **GoodTransformer** GitHub account. A workflow at
`.github/workflows/deploy.yml` builds and deploys on every push to `main`; it
sets `BASE_PATH` to `/<repo>/` so links resolve under the project-pages URL.

After the repo is created and pushed, enable **Settings → Pages → Source:
GitHub Actions**. The site goes live at:

```
https://goodtransformer.github.io/<repo>/
```

### Later — Vercel + custom domain

The build is portable. To move:

1. Import the repo in Vercel (framework: Astro).
2. Remove `BASE_PATH` (the site serves from `/`).
3. Add an `X-Robots-Tag: noindex` response header (and an optional shared
   passcode) for stronger privacy.
4. Attach the custom domain.

No changes to the site itself are required — internal links are base-aware.
