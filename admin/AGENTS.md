# AGENTS.md - DecoDocs Admin Portal

## Scope
This file applies to everything under `Decodocs/admin/`.

## Purpose
`Decodocs/admin` is the internal admin portal for managing runtime config in Firestore without redeploying functions or frontend.

Current scope:
- Admin dashboard
- JSON editors for:
  - `admin/stripe`
  - `admin/plans`
  - `admin/flags`
  - `admin/policies`

## Architecture
- Stack: React + Vite + Firebase Web SDK
- Hosting: Firebase Hosting site `decodocs-admin`
- Build output: `Decodocs/admin/dist`
- Routing: SPA (`** -> /index.html`)

## Security model
- Auth method: Firebase Email/Password
- UX gate: user email must end with `@snapsign.com.au`
- Source of truth: Firestore Rules on `admin/*` (must enforce the same domain rule)
- Important: client-side checks are UX only; Firestore rules are the real enforcement.

## Deployment constraints
- Keep this app as static hosting only.
- Do not add SSR, Next.js hosting adapters, Cloud Build-triggered hosting flows, or App Hosting features.
- Keep changes compatible with basic Firebase Hosting + basic gen2 Functions usage in the umbrella repo.

## Operator workflow
1. Sign in/register with a `@snapsign.com.au` account.
2. Open a config card.
3. Edit JSON.
4. Save to Firestore doc under `admin/*`.
5. Verify affected product behavior in web/functions.

## Guardrails for edits
- Keep config doc IDs stable: `stripe`, `plans`, `flags`, `policies`.
- If adding new config docs, update:
  - `src/pages/AdminHome.jsx`
  - `src/pages/ConfigEditor.jsx`
  - Relevant Firestore rules and docs.
- Avoid introducing hidden defaults in UI; prefer explicit JSON in Firestore.
