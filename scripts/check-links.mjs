#!/usr/bin/env node
// ============================================================
// Internal link & anchor checker for the built site (dist/client).
// Run after `npm run build`: `npm run check:links`.
//
// Walks every prerendered HTML page, collects href/src values, and verifies:
//  - internal paths resolve to a built file (or a known server-rendered route);
//  - #fragment targets exist as an id on the destination page.
// External URLs (http/https/mailto/tel) are out of scope — nothing here should
// hit the network. Exits 1 with a per-page report when anything is broken.
// ============================================================
import { readFile, readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const ROOT = resolve(process.cwd(), 'dist/client');

// Routes that render on demand (prerender = false), so they have no file in
// dist/client. Keep in step with src/pages/{rsvp,admin,api}.
const SERVER_ROUTES = [
  /^\/(es\/)?rsvp(\/|$)/,
  /^\/admin(\/|$)/,
  /^\/api\//,
  /^\/_actions\//,
];

if (!existsSync(ROOT)) {
  console.error('dist/client not found — run `npm run build` first.');
  process.exit(2);
}

async function htmlFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await htmlFiles(p)));
    else if (entry.name.endsWith('.html')) out.push(p);
  }
  return out;
}

const pages = new Map(); // abs file path -> html text
for (const file of await htmlFiles(ROOT)) pages.set(file, await readFile(file, 'utf8'));

/** dist/client file for an internal path, or null when nothing matches. */
function fileFor(path) {
  const clean = path.replace(/[?#].*$/, '');
  const candidates = clean.endsWith('/')
    ? [join(ROOT, clean, 'index.html')]
    : [join(ROOT, clean), join(ROOT, clean, 'index.html'), join(ROOT, `${clean}.html`)];
  return candidates.find((c) => existsSync(c)) ?? null;
}

const idCache = new Map();
function hasId(file, id) {
  if (!idCache.has(file)) {
    const html = pages.get(file) ?? '';
    const ids = new Set(
      [...html.matchAll(/\sid=(?:"([^"]+)"|'([^']+)')/g)].map((m) => m[1] ?? m[2]),
    );
    idCache.set(file, ids);
  }
  return idCache.get(file).has(id);
}

const failures = [];
for (const [file, html] of pages) {
  const page = `/${file.slice(ROOT.length + 1)}`;
  const refs = [...html.matchAll(/\s(?:href|src)=(?:"([^"]+)"|'([^']+)')/g)].map(
    (m) => m[1] ?? m[2],
  );
  for (const ref of refs) {
    if (/^(https?:|mailto:|tel:|data:|javascript:)/i.test(ref)) continue;

    // Same-page fragment.
    if (ref.startsWith('#')) {
      const id = ref.slice(1);
      if (id && id !== 'top' && !hasId(file, id)) {
        failures.push(`${page}: missing same-page anchor "${ref}"`);
      }
      continue;
    }

    if (!ref.startsWith('/')) continue; // relative refs aren't used; _astro assets are absolute

    const [path, fragment] = ref.split('#');
    if (SERVER_ROUTES.some((r) => r.test(path))) continue;

    const target = fileFor(path);
    if (!target) {
      failures.push(`${page}: broken link "${ref}"`);
      continue;
    }
    if (fragment && target.endsWith('.html') && !hasId(target, fragment)) {
      failures.push(`${page}: "${ref}" — no id "${fragment}" on the target page`);
    }
  }
}

if (failures.length) {
  console.error(`✗ ${failures.length} broken link(s):\n` + failures.map((f) => `  ${f}`).join('\n'));
  process.exit(1);
}
console.log(`✓ ${pages.size} pages — every internal link and anchor resolves.`);
