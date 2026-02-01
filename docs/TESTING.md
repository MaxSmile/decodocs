# DecoDocs — Testing Runbook (CI-friendly)

This document is the canonical reference for running the DecoDocs web app tests locally and in CI.

## Web app location

All commands below assume:

```bash
cd decodocs/web
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

## E2E tests (Playwright)

Run:

```bash
npm run test:e2e
```

This runs Playwright tests in `web/playwright-tests/`.

### Requirements for CI

- Browsers must be installed for Playwright.

If you need to install them:

```bash
npx playwright install --with-deps
```

### Running against a server

If you want Playwright to run against a locally served build, you can:

```bash
npm run build
npm run preview
```

Then run Playwright in a separate terminal.

## Common failures

### "Not implemented: HTMLCanvasElement's getContext()"

- This is a jsdom limitation.
- Prefer mocking canvas APIs in unit tests rather than relying on real rendering.

### Auth/Functions in CI

- Unit tests should not require real Firebase credentials.
- Use mocks/emulator modes (see `docs/DEVELOPMENT.md`) when writing new tests.
