import { defineConfig } from 'vitest/config';

// Unit tests for the pure RSVP logic (parsing, roster building, helpers). Kept in
// tests/ so `astro check` and the build never pick them up; they import source
// modules directly. Anything needing the DB/Resend/Astro runtime is out of scope
// here — those are exercised by the local end-to-end checks instead.
export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
  },
});
