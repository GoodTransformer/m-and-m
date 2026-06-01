# RSVP — how it works, and how to run it

The site collects RSVPs itself, using a **guest list**: each household gets its own
unguessable link, so replies can't be duplicated, +1s are capped, and you always
know exactly who hasn't replied. The couple can also **send the invitations and
reminders automatically**, with strong safety rails. It runs **free** on every
service below.

## The reply process

1. You import your guest list (once) in `/admin`. Each household gets a personal
   link like `https://site/rsvp/?c=K7P2QX` (Spanish households get the `/es/` one).
2. You send each household its link by email — **automatically from `/admin`**, or
   by copying the link and sending it yourself.
3. The guest opens their link: their **invited people are listed by name**, and
   they confirm who can come and pick each person's meal. They **cannot add anyone
   you didn't invite** — only a plus-one seat you've explicitly granted lets them
   type a name. Submitting **updates their one record** — replying again never
   makes a duplicate, and the same link lets them **edit** later.
4. On submit, the guest gets a confirmation email and the couple get a
   notification. Anyone opening `/rsvp` **without** a valid link sees a polite
   "use your invitation link" page — no open form, so no gate-crashing.
5. The couple read everything in `/admin`: who's coming, headcount, dietary notes,
   and **who's still outstanding** — with a one-click reminder to exactly those
   people. After the deadline the form closes automatically.

## What the couple do (in `/admin`, behind a passcode)

- **Import guest list** — paste a CSV; preview flags any bad rows; import. Re-import
  to update (matched by email) — never duplicates.
- **Send invitations** — `Test to us` → `Preview` → `Send`. Idempotent: no one is
  ever emailed twice, even if you click again.
- **Read replies** — a live table with headline counts and a **Download CSV** for
  the caterer/venue.
- **Send reminders** — same guarded flow, automatically targeting only the invited
  households that haven't replied.

### The guest-list CSV

A header row plus one row per household. Only `household` is required.

| Column | Required | Meaning |
|---|---|---|
| `household` | ✓ | The greeting / display name, e.g. `The Whitfields` |
| `guests` | – | The people invited — one full name each, separated by **semicolons**. These *are* the seats. Defaults to a single seat using `household`. |
| `email` | – | Where the invitation is sent (blank = a "paper" guest you invite by hand) |
| `plus` | – | Extra "+ guest" seats the household may bring (default `0`) — the only way a guest can add an un-named person |
| `language` | – | `en` or `es` (default `en`) — picks their language edition |

```csv
household,guests,email,plus,language
The Whitfields,Eleanor Whitfield; James Whitfield,eleanor@example.com,0,en
Familia Peña,Mariana Peña; Diego Peña; Lucía Peña,pena@example.com,1,es
```

`guests` is the heart of it: list exactly the people you're inviting, and those
become their seats. A guest can never add someone you didn't name — give a
household a `plus` of `1` only when you want to allow an un-named partner.

### The safe send workflow (do this in order)

1. **Verify your sending domain in Resend first** (DNS records) — without it,
   invitations are likely to land in spam.
2. **`Test to us`** — sends one sample to your own address. Open it, check the link
   and that it's in your inbox (not spam).
3. **`Preview`** — see the exact list of who would be emailed.
4. **Send a small first batch** if your list is large (the free tier allows **100
   emails/day**; the sender sends up to 90 at a time and tells you how many remain
   — click again the next day, or upgrade Resend for a one-shot send).
5. **Reminders** a week or so before the deadline — `Preview`, then `Send`.

Nothing ever sends on its own: emails only go out when you deliberately click, and
every send is idempotent, so a double-click or retry cannot double-email anyone.

## Will the emails reach everyone? (international guests)

Guests span Bolivia, the US, UK and EU. A few simple things make invitations land
in the inbox rather than spam — this is plain deliverability, not legal/compliance:

- **Verify your sending domain in Resend** (the SPF/DKIM DNS records it gives you) —
  the single biggest factor. Add one more DNS record, DMARC:
  `v=DMARC1; p=none; rua=mailto:you@yourdomain`. `p=none` means "just monitor" —
  nothing to manage. Together these lift inbox placement from ~50% to ~85%+.
- **Don't blast a brand-new domain all at once.** Send a small first batch (the
  sender already batches and shows how many remain), confirm it landed, then send
  the rest. A domain you've emailed from before is even better.
- **Test to a couple of providers** — `Test to us` goes to your own address; if you
  can, also try a Gmail and an Outlook/Hotmail address (they filter differently).
- Already handled for you: a real "From" name (Mari & Michael, not `noreply@`), one
  clear link, a **plain-text version** of every email, and UTF-8 so accented names
  (Peña) render correctly.

The **links** are robust by design, too:

- Personal links are **path-style** (`/rsvp/CODE/`) — survives forwarding through
  corporate filters and messaging apps better than a `?query`.
- Opening a link is a harmless page view, so corporate "safe-link" scanners
  (Outlook / Mimecast / Proofpoint) can't break it by pre-checking it.
- The site's `noindex` (keeps it out of Google) does **not** stop WhatsApp/iMessage
  link previews or block any guest who has the link.
- The **deadline closes "Anywhere on Earth"** (end of day in the last timezone), so
  a guest in Bolivia or the US is never cut off early.

## Architecture

Astro **Actions** (the reply) + **Turso** (libSQL database) + **Resend**
(email, incl. idempotent batch sends) + **Cloudflare Turnstile** (anti-spam),
deployed on **Vercel**. Content pages stay static; only `/rsvp`, `/rsvp/thank-you`,
and `/admin` (+ its endpoints) render on demand.

## Local development (no accounts needed)

`.env` ships with safe dev defaults: a local SQLite file (`local.db`, gitignored),
email **off** (sends are logged to the console), Turnstile **off** (honeypot +
time-trap still run), and a dev admin passcode.

```bash
npm run dev
# Admin:  http://localhost:4321/admin/   (login: mari / dev-passcode-change-me)
#  → import the sample CSV above, then "Copy" a household's link to try the form.
# A guest without a link:  http://localhost:4321/rsvp/   (shows the nudge page)
```

## Going live — one-time provisioning

1. **Database — Turso** (free, no pausing):
   ```bash
   npm i -g @tursodatabase/cli   # or: brew install tursodatabase/tap/turso
   turso auth signup
   turso db create mari-and-michael
   turso db show mari-and-michael --url      # → TURSO_DATABASE_URL (libsql://…)
   turso db tokens create mari-and-michael   # → TURSO_AUTH_TOKEN
   ```
   Tables are created automatically on first use.

2. **Email — Resend** (free 3,000/mo, 100/day). Create an API key → `RESEND_API_KEY`.
   **Verify a sending domain** (DNS) and set `RSVP_FROM_EMAIL` to e.g.
   `Mari & Michael <rsvp@yourdomain>`. Set `COUPLE_NOTIFY_EMAIL` to the couple's inbox.

3. **Anti-spam — Cloudflare Turnstile** (free): add your domain, copy the
   **site key** → `PUBLIC_TURNSTILE_SITEKEY` and **secret** → `TURNSTILE_SECRET_KEY`.

4. **Admin passcode** → `ADMIN_PASSCODE` (and optionally `ADMIN_USER`).

5. **Deploy — Vercel** (free Hobby): import the repo, add the env vars below
   (leave `BASE_PATH` unset), set `SITE_URL` to your deployed origin, deploy to a
   Preview, walk the test-send + a sample RSVP, then promote and attach the domain.

## Environment variables (set in Vercel)

| Variable | What it is |
|---|---|
| `SITE_URL` | Deployed origin (builds the personal links), e.g. `https://yourdomain` |
| `TURSO_DATABASE_URL` / `TURSO_AUTH_TOKEN` | Database URL + token |
| `RESEND_API_KEY` | Email API key |
| `RSVP_FROM_EMAIL` | Verified sender, e.g. `Mari & Michael <rsvp@domain>` |
| `COUPLE_NOTIFY_EMAIL` | Where the couple get a copy of each reply (and test sends) |
| `PUBLIC_TURNSTILE_SITEKEY` | Turnstile site key (the only browser-exposed value) |
| `TURNSTILE_SECRET_KEY` | Turnstile secret |
| `ADMIN_USER` / `ADMIN_PASSCODE` | Login for `/admin` |

Secrets never live in the repo — `.env` is gitignored; only `.env.example` (names) is tracked.

## A note on guest data (kept simple)

This is a private, non-commercial site, so there's nothing heavy to do. Two sensible
habits: dietary/allergy notes stay in the `/admin` inbox (they're not copied into
notification emails), and you can delete everything after the wedding. That's it.

## Things you can tune

- **Deadline / on-off:** `RSVP` in [`src/data/site.ts`](src/data/site.ts).
- **Meal menu:** `MEALS` in [`src/data/site.ts`](src/data/site.ts) — set the two
  main-course names (the guest picks one per attending person, shown only when
  they're coming). `MEALS_ENABLED = false` hides the meal section. The couple get a
  per-meal tally + a "missing a meal" flag in `/admin`, and meals appear in the CSV.
- **Wording (both languages):** the `rsvp` block in `src/i18n/en.ts` / `es.ts`.
- **Invitation & reminder emails:** `src/lib/email.ts` (bilingual).
- **Form fields:** `src/components/RsvpForm.astro`; validation/save in `src/actions/index.ts`.
