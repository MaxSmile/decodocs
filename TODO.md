# TODO (DecoDocs)

_Last updated: February 19, 2026_

This file mirrors `decodocs-repo/docs/ROADMAP.md` and lists actionable engineering + documentation tasks.

## Phase 1 - Web MVP Foundation (Live, Iterating)

### Admin Portal (High priority)

Admin-specific decisions, status, and deploy checklist are tracked in:
- `admin/README.md`
- `admin/TODO.md`

Remaining cross-project dependency:
- [x] Add schema validation in Functions for safer writes to `admin/*`.
- [x] Add unified admin reports pipeline (`admin_reports`) for backend exceptions + user bug/feedback intake.

### UI Quality & Consistency (High priority refactor)
- ✅ Most UI-quality tasks (layout, header/nav, shared UI components, design tokens, responsive hero, 404/500) are implemented and verified in the codebase.
- Remaining maintainability focus is now narrowed to `DocumentViewer.jsx` and `functions/index.js` after splitting `DocumentEditor.jsx` into smaller modules.

#### Home page UI issues (as seen on mobile screenshots)

- [x] Replace placeholder Sign page with a clear "Signing MVP checklist" (show number of remaining tasks + CTA to analyze PDF + join waitlist)
  - Checklist (v1): signature placement UI, signer identity/consent, audit trail, doc hashing/integrity, signature appearance, signed PDF export, verification view, send-for-signing flow, storage/retention, legal/terms UX
- [x] Harden analysis flow: loading/error/empty states for analysis results; avoid partial UI renders
- [~] **Authentication (partial)** — Implemented: Email/Password, Google (+ One Tap), account linking, auth state model, GIS and emulator support. Remaining items:
  - Microsoft and Apple production provider configuration (Azure AD / Apple Service ID, domain verification, Firebase console setup).
  - Add the Playwright E2E for anonymous → provider linking and expand auth-related E2E coverage.
  
  (See `web/src/stores/authStore.ts`, `web/src/context/AuthContext.jsx`, `web/src/components/SignInPage.jsx` for implemented pieces.)
- [x] Make environment setup unambiguous with a strict **no `.env*` files** policy and documented runtime config approach.




## Testing:
  - [x] Add Playwright flow for anonymous → provider link → authenticated gating removal.
  - [x] Add Playwright flow for anonymous first-visit happy path (landing → app/view entry → auth prompt visibility).
  - [x] Add Playwright flow for anonymous usage limit reached (gated actions disabled + upgrade/sign-in explanation shown).
  - [ ] Add Playwright flow for anonymous sign-in with Google and session continuity (same working document remains usable).
  - [x] Add Playwright flow for anonymous sign-up with email/password and session continuity.
  - [ ] Add Playwright flow for anonymous attempting sign-up with existing email (clear "log in instead" path, no dead-end).
  - [x] Add Playwright flow for login with existing email account after anonymous session (continuity + no duplicate state).
  - [ ] Add Playwright flow for link additional provider after initial auth (e.g. Google + Email on same account).
  - [ ] Add Playwright flow for unlink/disconnect attempt safeguards (cannot lock user out of all providers).
  - [ ] Add Playwright flow for sign-out and re-authentication (state reset as expected; protected actions gated again when unauthenticated).
  - [ ] Add Playwright flow for auth popup blocked/cancelled/error handling (user sees recoverable UI, no crash).
  - [ ] Add Playwright flow for auth-state restore on refresh/deep-link (`/view`, `/pricing`, `/profile`) with no redirect loops.
  - [x] Add Playwright flow for local PDF "open-only" (analyze without persistent upload) behavior.
  - [x] Add Playwright flow for explicit upload-required path (clear transition from open-only to stored/upload flow where applicable).
  - [x] Add Playwright flow for unsupported file type / corrupted PDF handling (friendly error + retry path).
    - Consolidated in `web/playwright-tests/open-upload-and-file-errors.spec.js` (anonymous open-only baseline, non-Pro upload gate transition, paid upload option, unsupported/corrupt retry flow).
  - [x] Add Playwright flow for large/scanned PDF requiring Pro or alternate handling (clear CTA and preserved document context).
  - [x] Add Playwright flow for analysis lifecycle states (loading → success with results rendered).

  - [ ] Add Playwright flow for analysis API transient failure and retry success.
  - [ ] Add Playwright flow for analysis API hard failure (error message + no broken/partial UI).
  - [ ] Add Playwright flow for document type auto-detection + manual override persistence across refresh.
  - [ ] Add Playwright flow for selection-based "explain this" action and results panel updates.
  - [ ] Add Playwright flow for free-tier feature gates on signing/editor actions (disabled reason + upgrade CTA).
  - [ ] Add Playwright flow for Pro user happy path (gated controls enabled after entitlement is active).
  - [ ] Add Playwright flow for entitlement downgrade/expiry behavior mid-session (UI updates without stale Pro state).
  - [ ] Add Playwright flow for Stripe checkout entry + return URL handling (success/cancel states).
  - [ ] Add Playwright flow for mobile viewport core journey (home → upload/open → analyze) with no blocking layout regressions.
  - [ ] Add Playwright flow for static route/test-doc direct access in preview mode (`/view/test-docs/*`) and expected rendering.
  - [ ] Add CI workflow to run Playwright against the built preview and guard route-dependent specs (E2E_USE_PREVIEW).
  - [ ] Document preview-mode E2E steps in `docs/TESTING.md` and `web/README.md`.
  - [x] Fix targeted Vitest invocation reliability (deterministic single-file + single-test-name pattern documented and verified).
    - Implemented `npm run test:unit:single` in `web/package.json` (`vitest run --coverage.enabled=false`).
    - Documented deterministic command pattern in `docs/TESTING.md` and `web/README.md`:
      - `npm run test:unit:single -- src/stores/authStore.test.ts`
      - `npm run test:unit:single -- src/stores/authStore.test.ts --testNamePattern "routes all auth actions to firebase auth module"`
    - Verified on February 19, 2026: file-target run executed 11/11 tests; test-name run executed 1/1 selected test (10 skipped) with real pass/fail output.
  - [ ] Add CI guard or mocked S3 fallback so `functions/test/minio.test.js` can run reliably in CI (or only run when `MINIO_TEST_CONFIG` is present).

## Storage integrations & multi-document (drive providers behave like disks; open/save not premium)
- Policy: Cloud drive connectors (Google Drive, OneDrive, iCloud, etc.) must behave like disk providers: users can open, edit, and save documents directly to their drive without requiring Pro. Upload-to-server (persistent storage) and heavy server-side processing (large OCR, bulk cross‑doc AI) remain explicit and may be metered.
- Done: "Open vs Upload" contract specified (ephemeral open by default; upload is explicit/paid; token revocation + audit expectations documented).
- [ ] Drive parity tasks (open + save) — available to all users:
  - Google Drive:
    - [ ] OAuth consent + connect/disconnect UX
    - [ ] File picker -> open -> analyze pipeline
    - [ ] Save back to Drive (preserve filename/folder metadata; conflict resolution UI)
    - [ ] Token storage strategy (encrypted at rest; rotation/revocation)
  - OneDrive:
    - [ ] Microsoft Graph integration + consistent UI with Drive
    - [ ] File picker -> open -> save back to OneDrive
    - [ ] Cross-browser testing matrix
    - [ ] Token handling + least-privilege scopes
  - iCloud Drive:
    - [ ] User-initiated file selection flow (Safari/iOS constraints)
    - [ ] Open/save parity with local uploads
- [ ] Security checklist:
  - [ ] Least-privilege scopes (read/write only when necessary)
  - [ ] No background indexing or automatic uploads
  - [ ] Clear user messaging about what is (not) stored and how to revoke access
- [ ] Multi-document (bundles & cross-document analysis) — not gated by "Paid Depth" label:
  - [ ] Data model for bundles / references
  - [ ] UI for selecting which docs are in scope (bundle ordering, pinning)
  - [ ] Save/load bundle metadata (persist per user/docHash)
  - [ ] Output schema for cross-document contradictions and references
  - [ ] E2E + Playwright coverage for bundle upload/open/save flows

### Tests — required coverage (Playwright E2E, unit, integration, CI guards)
- UI / Playwright E2E (use mocks in CI)
  - [ ] `playwright-tests/drive-connectors/drive-open-save-parity.spec.js` — Connect provider → open file → analyze (open-only) → edit → save back → assert file content + metadata preserved
  - [ ] `playwright-tests/drive-connectors/connect-disconnect-and-revoke.spec.js` — OAuth consent, disconnect, provider-revoked token handling, app shows reconnect CTA
  - [ ] `playwright-tests/drive-connectors/conflict-resolution.spec.js` — Simulate remote conflict on save; verify rename/merge UX and final file state
  - [ ] `playwright-tests/multi-document/bundles-create-edit.spec.js` — Create bundle from drive files, reorder/pin, save/load bundle metadata, re-open bundle
  - [ ] `playwright-tests/multi-document/cross-doc-analysis.spec.js` — Run cross-document analysis on a bundle; verify UI shows contradictions/refs and metering notice for heavy compute
  - [ ] `playwright-tests/edge/large-and-scanned-files.spec.js` — Open large/scanned PDF from Drive; verify OCR/Pro gating CTA and preserved viewer context
  - [ ] `playwright-tests/security/no-background-indexing.spec.js` — Assert no automatic background sync/indexing for connected drives
- Unit / integration tests
  - [ ] `vitest` — `web/src/stores/driveStore.test.ts` (token storage/refresh/revoke + permission checks)
  - [ ] `vitest` — `web/src/components/DrivePicker.test.tsx` (open/save UI, conflict dialog)
  - [ ] `functions/test/drive-proxy.test.js` (pre-signed URL generation, save callbacks, error paths; mock provider APIs)
  - [ ] `functions/test/bundles.test.js` (Firestore bundle model CRUD, permissions, metadata persistence)
  - [ ] Integration tests with mocked Google/OneDrive APIs verifying request payloads for open/save/metadata
- Security & telemetry
  - [ ] Assert server logs never contain raw document content (only `docHash` + metadata) in functions/unit tests
  - [ ] Test token revocation and expired-token flows surface a clear, recoverable UI path
- CI / test infra
  - [ ] Add `E2E_USE_MOCK_DRIVES` env flag and mock servers/fixtures so Playwright runs deterministically in CI
  - [ ] Gate real-provider tests behind `RUN_REAL_DRIVE_TESTS` (manual/optional in CI)
  - [ ] Add Playwright fixture data: `web/test-docs/drive/sample.pdf`, `sample-scanned.pdf`, `sample-large.pdf`
  - [ ] Store Drive API fixtures: `tests/fixtures/google-drive/*.json`, `tests/fixtures/one-drive/*.json`
- Test acceptance criteria
  - All Playwright specs run reliably in CI using mocks and assert end-to-end open + save parity with local disk.
  - Unit/integration tests validate token lifecycle, conflict-resolution logic, pre-signed save callbacks, and Firestore bundle persistence.
  - Any tests requiring real OAuth/providers are documented and gated.

## Phase 4 - Mobile Apps 
- [ ] Decide v1 architecture: WebView wrapper vs native shell + deep links
- [ ] Implement "Open in DecoDocs" from share sheet (iOS + Android)
- [ ] Establish auth + analytics parity with web (anonymous by default, upgrade path)
- [ ] Define v1 non-goals explicitly (offline, on-device inference, native signing)

## Phase 5 - Signing & Verification
- [ ] Write a signing MVP spec:
  - [ ] What "sign" means (signature placement, audit trail, exports)
  - [ ] Envelope format + integrity checks
  - [ ] Legal/compliance assumptions and constraints by region
- [ ] Decide storage policy for signed artifacts (retention, export, deletion)

## Documentation Hygiene (Always On)
- [ ] Ensure roadmap claims match the code (mark items "specified" vs "implemented")
- [x] Update test plans when selectors/UX change (`docs/test-plans/`)

## New Todos

### Document typing + prompt packs (needed for real-world uploads)
- [ ] Implement **intake category detection** (UNREADABLE / GENERAL / BUSINESS_LEGAL) and persist per `docHash`.
- [ ] Implement **fine-grained document type detection** for BUSINESS_LEGAL docs (initial 10–20 types).
- [x] Add user override persistence (server-side per puid+docHash) + surface the detected vs overridden type in UI.

### Static classification/validation JSON artifacts (public)
- ✅ Static classification artifacts + generator script are in place (`web/public/classifications/`, `web/scripts/generate-classifications.mjs`) and the UI lazy-loads the index/validation files. Remaining: none (maintenance/follow-ups only).

### Fileserver / MinIO — operational verification (high priority)
- [ ] Verify production fileserver (`storage.smrtai.top`) is live and serving the MinIO health endpoint via the proxy.
  - Acceptance: `curl -sSf https://storage.smrtai.top/minio/health/live` (or `https://storage.smrtai.top:7433/minio/health/live`) returns HTTP 200.
  - Confirm TLS (Certbot) is valid and Cloudflare origin rule rewrites to port `7433`.
- [ ] Confirm Firestore `admin/minio` contains the production config required by `functions/index.js`:
  - `mode: "prod"`, `endpoint`, `bucket`, and `prod.accessKey` + `prod.secretKey` (or local test config `test.*` when applicable).
  - Recommended check: run `node functions/test/fetch-minio-config.js` to save `functions/test/.minio-test-config.json`.
- [ ] Run the MinIO integration tests: `cd functions && npm run test:minio` (requires `admin/minio` or `functions/test/.minio-test-config.json`).
- [ ] Verify ops/backup/monitoring:
  - Ensure `minio-backup.sh` produces archives in `minio_backup_dir` and retention is enforced.
  - Ensure `minio-healthcheck.sh` cron runs and (if configured) webhook alerts are firing on failure.
- [ ] Credential rotation & secrets:
  - Rotate app credentials using `Decodocs/fileserver/rotate-minio-app-key.sh`, store new secret in the secure secret manager, then re-run `node functions/test/fetch-minio-config.js` + `npm run test:minio`.
- [ ] CI / tests:
  - Add a CI guard so `functions/test/minio.test.js` runs only when `MINIO_TEST_CONFIG` (or equivalent) is available in CI, or provide a mocked S3 fallback.

### AI integration tasks (classification + type-specific validation)
- ✅ Server-callables (`detectDocumentType`, `getDocumentTypeState`, `analyzeByType`) and docs are implemented (`functions/index.js`, `docs/CLASSIFICATIONS_INTEGRATION.md`). Follow-up: expand unit/integration/E2E coverage where noted.

### Validation schema authoring (docs)
- ✅ Existing prompt-pack schemas: company-policy, sop-procedure, invoice, job-offer, association-constitution (see `docs/validation/`).
- Remaining: author JSON prompt-pack schemas for Informational docs, Decision/evaluation docs, and Representation docs; wire UI action sets per intake+type; keep `docs/DOCUMENT_TYPE_SYSTEM.md` up to date.

- [ ] **Big Document Vector Management**: For big documents, RLM (Recursive Language Model) or other vector-based data management needs to be developed to efficiently handle large PDFs and document collections.
- [ ] **Refactor: split large UI components (maintainability)**: Reduce “god components” by extracting hooks + subcomponents so PDF viewing, analysis actions, and presentation concerns are separated.
  - [~] Refactor `decodocs-repo/web/src/components/DocumentViewer.jsx` into smaller units
    - ✅ Firebase callable wrappers have been moved into `web/src/services/*` (`analyzeText`, `preflightCheck`, `documentType*`, `analyzeByType`).
    - ✅ Extracted viewer state/presentation modules:
      - `web/src/hooks/useViewerDocumentState.js` (open/load/upload/download/finish flows)
      - `web/src/hooks/useViewerSignMode.js` (tool/signature/annotation interaction state)
      - `web/src/components/viewer/ViewerPageOverlay.jsx` (signature + annotation overlay rendering)
    - Why: this file mixes (1) PDF.js init/loading, (2) PDF render lifecycle, (3) Firebase callable orchestration, and (4) UI layout/wiring. Remaining suggested extractions: `usePdfJs()`, `useDocumentAnalysis()` and smaller UI subcomponents.
    - References:
      - Component + state: `decodocs-repo/web/src/components/DocumentViewer.jsx:17`
      - PDF.js init (worker + test PDF load): `decodocs-repo/web/src/components/DocumentViewer.jsx:63`
  - [x] Refactor `decodocs-repo/web/src/components/HomePage.jsx` by extracting page sections + moving content arrays out of the component
    - ✅ `HomePage.jsx` is now a thin orchestrator that composes landing section components (`Hero`, `SocialProof`, `HowItWorks`, `FeatureGrid`, `UseCases`, `Integrations`, `SecureByDesign`), and no longer acts as a large marketing “god component”.
    - Reference: `decodocs-repo/web/src/components/HomePage.jsx:1`
  - [x] Refactor `decodocs-repo/web/src/components/DocumentEditor.jsx` into “editor shell” + “overlay/canvas” subcomponents
    - ✅ Extracted:
      - `EditorToolbar`: `web/src/components/editor/EditorToolbar.jsx`
      - `EditorOverlay`: `web/src/components/editor/EditorOverlay.jsx`
      - `useSignMode()` hook: `web/src/hooks/useSignMode.js`
    - ✅ `DocumentEditor.jsx` now focuses on PDF loading, export orchestration, and composition of extracted modules.
  - [ ] Refactor `functions/index.js` by extracting Cloud Functions + shared helpers into modules
    - Why: `functions/index.js` is a single entry containing config/constants, auth/validation helpers, multiple callable functions, and a scheduled job (~461 LOC). Splitting improves testability and reduces merge conflicts.
    - Suggested extraction:
      - `functions/src/adminInit.js` (Admin init + emulator creds bootstrap)
      - `functions/src/validators.js` (auth, docHash, schema validation)
      - `functions/src/preflightCheck.js`, `functions/src/analyzeText.js`, `functions/src/getEntitlement.js`, `functions/src/cleanupOldUsageRecords.js`
      - Keep `functions/index.js` as a thin export/wiring file
    - References:
      - Admin init + helpers: `functions/index.js:8`, `functions/index.js:49`, `functions/index.js:67`, `functions/index.js:85`
      - Exports: `functions/index.js:108`, `functions/index.js:192`, `functions/index.js:393`, `functions/index.js:428`
- [ ] **Copy/SEO/UX: audit + rewrite all user-facing text (no ambiguity)** — Status summary:
  - ✅ Implemented: Home hero & trust line rewrite, footer/nav links fixed, Pricing copy aligned, "Not legal advice" disclaimer added to Home/Viewer/About, SEO/meta tags and legal/contact pages created.
  - Remaining:
    - [ ] Decide and apply the single canonical tagline across the site (choose Option A or B).
    - [ ] Improve microcopy for AI feature gating (remove internal terms, add clear reason + next action and replace blocking alerts with non-blocking UI).


- [ ] **Make DecoDocs available via MCP (Model Context Protocol) as a “document decode service”**: expose safe, well-scoped tools that let MCP clients upload a document, request analysis, and retrieve results with clear limits and privacy guarantees.
  - Goal (non-ambiguous): an MCP client (Cursor/Claude Desktop/etc.) can connect to a local/hosted MCP server and call `decodocs.decode_document(...)` to get structured analysis JSON, with optional “explain selection” and “risk highlights” tools.
  - [ ] Decide MCP deployment model and document it (pick exactly one)
    - Option A (recommended initially): **local MCP server** that calls existing HTTP/Firebase endpoints; no secrets shipped to clients; users authenticate with Firebase and provide an ID token.
    - Option B: **hosted MCP server** (VPS) that verifies auth and runs decode pipelines server-side.
    - Acceptance criteria:
      - A single command starts the MCP server (e.g. `npm run mcp` or `python -m decodocs_mcp`).
      - A README section shows exact setup steps, required env vars, and example tool calls.
  - [ ] Define the MCP tool surface (final names + schemas)
    - Tools (minimum set):
      - `decodocs.health()` → `{ ok: boolean, version: string }`
      - `decodocs.decode_document({ filename, content_base64, options })` → `{ doc_id, summary, risks[], recommendations[], usage }`
      - `decodocs.preflight({ filename, content_base64 })` → `{ classification, reasons[], limits }`
    - Optional tools (if supported by backend):
      - `decodocs.explain_selection({ doc_id, selection_text })`
      - `decodocs.highlight_risks({ doc_id })`
    - Acceptance criteria:
      - Each tool has deterministic input validation and a stable JSON output schema (versioned).
  - [ ] Decide and implement authentication and authorization (no ambiguity)
    - Required behavior:
      - Every tool call must include either a Firebase ID token or an API key that maps to an account (choose one).
      - Server verifies the token on each request and scopes access by `uid`.
      - Rate limiting and per-doc AI budgets are enforced server-side (no client trust).
    - References (current auth model):
      - Firebase Auth usage: `decodocs-repo/web/src/context/AuthContext.jsx`
      - Callable functions enforcing auth: `functions/index.js:108`
  - [ ] Implement document ingestion strategy for MCP (pick exactly one)
    - Option A (simple): pass the full PDF as base64 to the MCP server, then:
      - extract text server-side (preferred) OR
      - call the existing “analyzeText” function with pre-extracted text (least change)
    - Option B (scalable): upload to object storage via pre-signed URL and pass `fileKey`/`docHash` to decode (aligns with `decodocs-repo/web/AGENTS.md` architecture).
    - Acceptance criteria:
      - Maximum input size is documented and enforced (hard limit + friendly error).
      - No documents are stored unless the user explicitly requests storage (Free vs Pro contract).
  - [ ] Add a clear privacy and indexing policy for MCP usage
    - Tasks:
      - Add “Data handling” section: what is sent, what is stored, retention, and how to delete.
      - Ensure MCP server never logs raw document content by default (only docHash + metadata).
      - Add a config flag to enable/disable telemetry logging.
  - [ ] Provide end-to-end examples (copy/paste runnable)
    - Examples to include:
      - Decode a PDF and print “Top 5 risks”
      - Explain a highlighted clause
      - Handle Pro-required (scanned PDF) response gracefully
    - Acceptance criteria:
      - Examples run without code edits (only env vars and a sample PDF).
