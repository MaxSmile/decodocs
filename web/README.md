# DecoDocs Web App

Frontend application for `decodocs.com`.

## Stack

- Astro (primary build/runtime)
- React islands/components where needed
- Firebase SDK for auth + callable functions
- Playwright + Vitest for testing

## Commands

Run from `Decodocs/web/`:

```bash
npm run dev          # Astro dev server
npm run build        # writes version metadata + Astro build
npm run preview      # preview built output
npm run test         # vitest run
npm run test:unit    # vitest run (unit-focused)
npm run test:unit:single -- src/stores/authStore.test.ts
npm run test:e2e     # Playwright tests
```

Target one test name within a known file:
```bash
npm run test:unit:single -- src/stores/authStore.test.ts --testNamePattern "routes all auth actions to firebase auth module"
```

For deterministic E2E against built output:
```bash
E2E_USE_PREVIEW=1 npm run test:e2e
```

## Build Output

- Static output directory: `Decodocs/web/decodocs.com/`
- Firebase hosting target (from root `firebase.json`): `decodocs-site`

## Development Notes

- Keep app behavior aligned with canonical docs in `../docs/`.
- Do not use `.env*` files (`.env`, `.env.local`, etc.) for this app.
- If runtime flags are needed, pass them via process environment when starting commands (CI/shell), not via env files.
- For API contracts and callable payloads, use `../docs/API.md`.
- For deployment and hosting behavior, use `../docs/DEPLOYMENT.md`.
- For classification and doc-type behavior, use:
  - `../docs/DOCUMENT_TYPE_SYSTEM.md`
  - `../docs/CLASSIFICATIONS_INTEGRATION.md`

## Related Docs

- Documentation hub: `../docs/README.md`
- Product context: `../docs/PRODUCT.md`
- Testing strategy: `../docs/TESTING.md`
- Web test plan: `TEST_PLAN.md`
