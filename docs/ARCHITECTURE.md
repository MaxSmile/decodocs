# DecoDocs Architecture

## Overview
DecoDocs uses a hybrid web architecture:
- marketing pages rendered statically for SEO/performance
- app workflows rendered in React
- server-authoritative Firebase Functions for AI and entitlements

## High-Level Architecture

```text
Browser
  ├─ Marketing pages (static HTML)
  └─ App UI (React)
        └─ Firebase Functions (callable)
              ├─ Entitlements / budgets
              ├─ Analysis orchestration
              └─ Usage ledgers/events
```

## Frontend

- Marketing: static-first pages for fast first render and better Core Web Vitals
- App: React-based document viewer/editor and authenticated workflows
- Routing:
  - marketing/documentation paths are static-routed
  - app paths are served via app shell + client routing
- State:
  - local component state/hooks for UI
  - shared auth state via central store

## Authentication (Current)
Authentication is active now (not planned):
- Firebase Auth providers: anonymous, email/password, Google, Apple, Microsoft
- Anonymous-first session model
- Provider linking for continuity
- Server-side entitlement checks in Functions (client tier is never trusted)

## AI Analysis Pipeline

1. Client extracts text from PDF and computes `docHash`.
2. Client calls `preflightCheck`.
3. Client calls `analyzeText` or `analyzeByType`.
4. Functions enforce tier budgets and OCR gating.
5. Functions return structured analysis payload.

## Envelope Pipeline (.snapsign)

- Envelope processing is client-side only.
- Browser handles create/extract/validate of `.snapsign` ZIP files via `JSZip`.
- Integrity is enforced with SHA-256 hash in `manifest.json`.
- Relevant module: `Decodocs/web/src/services/envelopeService.js`.
- Current UI entry points: `Decodocs/web/src/components/SignPage.jsx` and `Decodocs/web/src/components/DocumentViewer.jsx`.
- Sender email flow is manual: user downloads `.snapsign`, then sends from their own email client with manual attachments.
- Functions do not expose envelope HTTP endpoints and do not orchestrate recipient invite/session lifecycle.
- Canonical envelope tests are client-side unit tests in `Decodocs/web/src/__tests__/envelopeService.test.js`.

## Tier Budget Enforcement

Current enforced budgets:
- Anonymous: 20k tokens/session identity
- Free: 40k tokens/day (UTC)
- Pro: unrestricted in this app-layer budget gate
- Business: product tier documented as Pro-capable team tier; runtime capability currently follows Pro path until dedicated branching is enabled

## Backend

- Firebase Functions (Node.js)
- Firestore collections used for entitlement and usage ledgers:
  - `users`
  - `usage_daily`
  - `usage_events`
  - `docshashes`
- Storage for paid tiers is S3-compatible MinIO on VPS using pre-signed URLs

## Security

- All auth/entitlement checks are server-side
- No AI provider secrets in client
- Pre-signed URL access for storage operations
- Audit-friendly usage events in Firestore

## Notes

- Some advanced AI/type-specific execution is still placeholder/heuristic and is documented in roadmap/spec files.
- See `SUBSCRIPTION_TIERS.md` and `STATUS_SUMMARY.md` for product-policy and status updates.
