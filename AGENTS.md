# AGENTS.md - DecoDocs (Nested Repo) + Deployment Integration Policy

## Repo structure (important)
- This is the **DecoDocs product repository**.
- It is intentionally **nested** inside the SnapSign-AU deployment repo at:
  - `SnapSign-AU/decodocs/`
- SnapSign-AU’s Firebase Hosting deploy expects the build output at:
  - `decodocs/web/dist`

**Rule:** Keep this as an independent repo (retain its own `.git/`).

## Hosting target → production domain
DecoDocs is deployed via the SnapSign-AU Firebase project:
- `site: "decodocs-site"` → **decodocs.com**

## Hosting/Functions Requirements
- **Only use simple (static or SPA) Firebase Hosting and basic gen2 Functions.**
- Do NOT use Advanced Hosting (SSR, Next.js app hosting, preview channels, or Cloud Build triggers).
- Do NOT configure 'webframeworks', SSR, or 'app hosting' in firebase.json or deployment scripts.
- Hosting must always point to the built static site output (e.g., `dist/`) and never require a build server.
- Functions must be simple, not depend on advanced triggers, and reside in a single functions directory for basic API/utility use only.
- All configuration should permit deployment on the Spark (free) or Blaze (pay-as-you-go) plan, but never force advanced/locked vendor-specific features.

---

If any hosting or function scripts require Blaze/Cloud Build, re-check your firebase.json and eliminate non-static or SSR-related features. All deployments should keep Cloud Build and Artifact Registry disabled unless absolutely necessary for your product.

## Environment Policy (Required)
- Do not create or use `.env*` files (`.env`, `.env.local`, `.env.production`, etc.).
- Do not add dotenv loaders to web/admin/functions scripts.
- Configuration must come from:
  - Firestore admin config documents, and/or
  - platform-provided process environment (CI/runtime/shell), without env files committed or loaded from disk.

## Documentation & product context
- Both code changes and content/copy updates require project understanding. Consult the umbrella `DOCS_INDEX.md` and `Decodocs/docs/README.md` for the curated docs, ownership, and deployment/runbook guidance before making non-trivial changes.
- The `DOCS_INDEX.md` is the canonical entry point for locating architecture, deployment, and product documentation.

## Canonical deployment script
- DecoDocs is deployed as part of the SnapSign-AU umbrella. Use the repo-root `./test-build-deploy.sh` to build and deploy DecoDocs together with the other subprojects.
- Do NOT deploy `Decodocs` independently using ad-hoc `firebase deploy` — the umbrella script guarantees the expected nested output paths and build verification.

## Task tracking ownership
- This DecoDocs repo tracks product work in `Decodocs/TODO.md`.
- Do not log umbrella Firebase integration work here; use root `TASKS.md`.
- Admin-portal-only work should be tracked in `Decodocs/admin/TODO.md`.
