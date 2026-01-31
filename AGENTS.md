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
