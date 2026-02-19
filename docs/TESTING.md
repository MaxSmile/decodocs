# DecoDocs — Testing Runbook (CI-friendly)

This document is the canonical reference for running the DecoDocs web app tests locally and in CI.

## Web app location

All commands below assume:

```bash
cd Decodocs/web
```

## Unit tests (Vitest)

Run once (CI-friendly):

```bash
npm run test:unit
```

Watch mode (local dev):

```bash
npm run test
```

Notes:
- Unit tests run in `jsdom`.
- Some PDF/canvas related tests may log warnings about `HTMLCanvasElement.getContext()` in jsdom; they should still pass.

### Targeted single-test runs (deterministic)

Use the dedicated script to avoid noisy full-suite coverage output and ensure a deterministic file filter:

```bash
npm run test:unit:single -- src/stores/authStore.test.ts
```

Run one specific test name inside a known file:

```bash
npm run test:unit:single -- src/stores/authStore.test.ts --testNamePattern "routes all auth actions to firebase auth module"
```

Notes:
- Always pass an explicit test file path under `src/**/*.{test,spec}.*` first, then add `--testNamePattern` as needed.
- This pattern is verified and returns real pass/fail output (not "No test files found").

## E2E tests (Playwright)

Run:

```bash
npm run test:e2e
```

This runs Playwright tests in `web/playwright-tests/`.

**Preview vs dev server (important)**
- Some specs assert server-served static routes (e.g. `/view/test-docs/*`, direct PDF URLs, pricing direct GET). Those tests require the production-like preview server.
- To run Playwright against a built preview locally (or in CI):

```bash
# Run Playwright against the static preview (build + preview)
E2E_USE_PREVIEW=1 npm run test:e2e
```

When `E2E_USE_PREVIEW=1` Playwright's configured webServer will execute `npm run build && npm run preview` before tests.

### Requirements for CI

- Browsers must be installed for Playwright.

If you need to install them:

```bash
npx playwright install --with-deps
```

### Running against a server (manual)

If you prefer to serve the built site yourself then run:

```bash
npm run build
npm run preview
```

Then run Playwright in a separate terminal (no E2E_USE_PREVIEW env var required in this mode).

## Skyvern (optional visual smoke tests)

For quick visual/LLM-driven smoke tests (helpful after UI refactors), see:

- `docs/SKYVERN_SMOKE_TESTS.md`
- `docs/VISUAL_REGRESSION_CHECKLIST.md` (manual, quick)

## Common failures

### "Not implemented: HTMLCanvasElement's getContext()"

- This is a jsdom limitation.
- Prefer mocking canvas APIs in unit tests rather than relying on real rendering.

### Auth/Functions in CI

- Unit tests should not require real Firebase credentials.
- Use mocks/emulator modes (see `docs/DEVELOPMENT.md`) when writing new tests.
