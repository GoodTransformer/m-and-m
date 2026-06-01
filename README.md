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
npm run dev      # http://localhost:4321  (everything, incl. RSVP, runs here)
npm run build    # content prerendered; the RSVP routes bundle for Vercel
```

Requires Node 18+ locally; Vercel runs the deployed site on Node 22. RSVP has
safe local defaults (a `local.db` file, email off, captcha off) — see
[`RSVP-SETUP.md`](RSVP-SETUP.md).

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

Photos live in `src/assets/images/` and render through the `Frame` component
(Astro's `<Image>` → Sharp), which optimises to WebP, downscales to the size
actually displayed, and reserves the aspect ratio so there's zero layout shift.
To swap one, replace the file in `src/assets/images/` keeping the same name —
no markup change needed.

## Details to confirm

Placeholders currently in the site — replace before sharing widely:

- [x] **Wedding date** — Wednesday, 23 September 2026 (confirmed; midweek, so no "weekend" copy)
- [ ] **RSVP deadline** (currently 26 August 2026 placeholder) — `data/site.ts` (`RSVP.deadline`)
- [ ] **Ceremony & reception times** (currently 3:00 pm / 6:30 pm — 3 pm not yet firmly confirmed) — `i18n/*.ts` (`weekend`, `today`)
- [ ] **Running order** of the day — `i18n/*.ts` (`weekend.events`)
- [ ] **Dress code** wording (currently *Black tie*) — `i18n/*.ts`
- [ ] **what3words** square for each entrance — `data/site.ts`
- [ ] **On-the-day contact** name + number — `data/site.ts`
- [ ] **Taxi** numbers — `data/site.ts`
- [ ] **Accommodation** recommendations — `i18n/*.ts` (`travel.stays`; add `url` to link out)
- [ ] **Gifts** wording / any fund link — `i18n/*.ts` (`gifts`)
- [ ] **Our Story** copy — `i18n/*.ts` (`story`)
- [ ] **Photographs** — venue shots are the venues' *own* official images, used for the
      preview (see Image credits). Ideally replace with the couple's own photos, or
      confirm permission, before any public/printed use. `Our Story` portrait is still a placeholder.
- [ ] Verify venue **coordinates** (entrances) — `data/site.ts`

## Image credits

Venue photographs are the venues' own promotional images, used here for the private
preview. Replace with licensed or couple-owned photos before wider use.
Photos live in `src/assets/images/` and are optimised at build time by Astro
(Sharp → WebP, downscaled, zero layout shift) via the `Frame` / `<Image>`
components. To swap one, replace the file (keep the name) — no markup change.
- **Magdalen College** (`magdalen.jpg`, `magdalen-wide.jpg`) — magd.ox.ac.uk (© John Cairns).
- **Weston Manor** (`weston-manor.jpg`, `weston-garden.webp`) — themanorweston.com.
- **Our Story** (`our-story.jpg`) — couple's own.

Regenerate the social-share card after changing the date/photos:
`Google Chrome --headless --screenshot=public/og.png --window-size=1200,630 scripts/og.html`

> **RSVP** is built into the site as a **guest list**: each household gets a personal
> link (`/rsvp/?c=…`), so replies can't be duplicated and +1s are capped, with a
> private inbox at `/admin` where the couple read replies and **send invitations &
> reminders automatically** (idempotent — no one is emailed twice). It needs a
> server, so the site is hosted on Vercel — see [`RSVP-SETUP.md`](RSVP-SETUP.md) for
> the full flow, the guest-list CSV format, the safe send workflow, and the env vars.

## Privacy

The site ships with `noindex, nofollow` so it stays out of search results. On
GitHub Pages that meta tag is the control (Pages can't send the stronger
`X-Robots-Tag` header — that's added on Vercel later).

## Deployment

The full site is hosted on **Vercel** (free Hobby tier). Adding RSVP introduced a
server (the form action, the `/admin` inbox, and the auth middleware), which
GitHub Pages can't run — so Vercel is now the home of the site.
[`RSVP-SETUP.md`](RSVP-SETUP.md) is the step-by-step.

### Vercel (host)

1. Import the repo in Vercel (it detects Astro and the adapter).
2. Leave `BASE_PATH` unset — the site serves from `/`.
3. Add the RSVP environment variables (see [`RSVP-SETUP.md`](RSVP-SETUP.md)).
4. Optionally add an `X-Robots-Tag: noindex` response header for stronger privacy,
   then attach the custom domain.

Internal links are base-aware, so nothing in the site itself needs changing.

### Note on the old GitHub Pages workflow

`.github/workflows/deploy.yml` predates RSVP and deploys a **static** build to the
GoodTransformer Pages account. It can no longer serve the whole site (no server →
no RSVP), and the Vercel adapter changes the build output it expects. **Disable it
on cutover** (delete the file, or Settings → Pages → Source: None) so it doesn't
publish a broken copy on push to `main`.
