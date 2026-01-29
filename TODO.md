# TODO (DecoDocs)

_Last updated: January 28, 2026_

This file mirrors `decodocs-repo/docs/ROADMAP.md` and lists actionable engineering + documentation tasks.

## Phase 1 - Web MVP Foundation (Live, Iterating)
- [ ] Brand polish: ensure "DecoDocs" and "Snap Sign Pty Ltd" are consistent across UI + docs (no legacy names)
- [ ] Replace placeholder Sign page with real "signing MVP scope" copy + clear CTA (or hide until implemented)
- [ ] Add a visible "Free vs Pro" gating UX: explain *why* buttons are disabled + what upgrades unlock
- [ ] Harden analysis flow: loading/error/empty states for analysis results; avoid partial UI renders
- [ ] Make environment setup unambiguous: one canonical place to define required `.env` variables and how to run locally
 - [ ] Implement Google Identity Services (GIS) in the web app for Google sign-in and token management
 - [ ] Configure Firebase Hosting 301 redirects so `https://decodocs-site.web.app` and `https://decodocs-site.firebaseapp.com` permanently redirect to `https://decodocs.com` (via `firebase.json` hosting settings)
- [ ] Testing:
  - [ ] Expand Playwright: cover "auth failure still renders PDF", and "analysis buttons gated until authenticated"
  - [ ] Add CI-friendly `npm run test:unit` + `npm run test:e2e` runbook for the web app

## Phase 2 - Cloud Storage Integrations (Target: Q2 2026)
- [ ] Define the "Open vs Upload" contract (Free vs Pro) as a spec:
  - [ ] Default is ephemeral open (no storage)
  - [ ] Upload/save is explicit and paid (history/export)
  - [ ] Token revocation guarantees + audit logging expectations
- [ ] Google Drive (read-only):
  - [ ] OAuth consent + connect/disconnect UX
  - [ ] File picker -> open -> analyze pipeline
  - [ ] Token storage strategy (encrypted at rest; rotation/revocation)
- [ ] OneDrive (read-only):
  - [ ] Microsoft Graph integration + consistent UI with Drive
  - [ ] Cross-browser testing matrix
- [ ] iCloud Drive:
  - [ ] User-initiated file selection flow (Safari/iOS constraints)
  - [ ] Document open parity with local uploads
- [ ] Security checklist:
  - [ ] Least-privilege scopes (read-only)
  - [ ] No background sync or indexing
  - [ ] Clear user messaging about what is (not) stored

## Phase 3 - Paid Depth + Multi-Document (Target: Q3 2026)
- [ ] Define "Premium" value clearly (what's expensive and why):
  - [ ] DOCX conversion pipeline scope and limits
  - [ ] Multi-document session UX (bundle upload, ordering, references)
- [ ] Build multi-document analysis scaffolding:
  - [ ] Data model for bundles / references
  - [ ] UI for selecting which docs are in scope
  - [ ] Output schema for cross-document contradictions

## Phase 4 - Mobile Apps (Target: Q4 2026)
- [ ] Decide v1 architecture: WebView wrapper vs native shell + deep links
- [ ] Implement "Open in DecoDocs" from share sheet (iOS + Android)
- [ ] Establish auth + analytics parity with web (anonymous by default, upgrade path)
- [ ] Define v1 non-goals explicitly (offline, on-device inference, native signing)

## Phase 5 - Signing & Verification (Target: 2027+)
- [ ] Write a signing MVP spec:
  - [ ] What "sign" means (signature placement, audit trail, exports)
  - [ ] Envelope format + integrity checks
  - [ ] Legal/compliance assumptions and constraints by region
- [ ] Decide storage policy for signed artifacts (retention, export, deletion)

## Documentation Hygiene (Always On)
- [ ] Keep dates current across docs (avoid timelines stuck in 2025 when it's 2026+)
- [ ] Ensure roadmap claims match the code (mark items "specified" vs "implemented")
- [ ] Update test plans when selectors/UX change (`docs/test-plans/`)

## New Todos
- [ ] **Big Document Vector Management**: For big documents, RLM (Recursive Language Model) or other vector-based data management needs to be developed to efficiently handle large PDFs and document collections.
