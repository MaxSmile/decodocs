# DecoDocs Admin Portal

Internal admin UI for managing runtime configuration docs in Firestore.

## What this app does
- Authenticates users with Firebase Email/Password.
- Allows access only to users with `@snapsign.com.au` emails.
- Provides JSON config editors for:
  - `admin/stripe`
  - `admin/plans`
  - `admin/flags`
  - `admin/policies`
- Provides operations dashboard pages for:
  - `admin_ai_events` (AI function failures)
  - `admin_reports` (backend exceptions + user bug/feedback reports)

Config is loaded from Firestore and saved via the callable Function `setAdminConfig` so server-side schema checks can reject invalid writes.

## How it works
- App entry: `src/main.jsx`
- Auth state + helpers: `src/AuthContext.jsx`
- Admin email rule: `src/firebase.js`
- Routes and gating: `src/App.jsx`
- Config editor page: `src/pages/ConfigEditor.jsx`

Security is two-layered:
- Client-side gate for UX (domain check).
- Firestore Rules as source of truth for `admin/*` access.

## Local development
```bash
cd Decodocs/admin
npm ci
npm run dev
```

Config policy:
- Do not use `.env*` files (`.env`, `.env.local`, `.env.production`, etc.).
- Keep mutable runtime config in Firestore `admin/*` docs.

Build:
```bash
cd Decodocs/admin
npm run build
```

## Deployment
From repo root, either use helper scripts or deploy hosting directly:

```bash
./build-and-deploy.sh
```

or

```bash
firebase deploy --only hosting:decodocs-admin
```

Hosting config is in root `firebase.json` with:
- `site`: `decodocs-admin`
- `public`: `Decodocs/admin/dist`

## TODO
Admin planning and deployment-readiness checklist live in:
- `Decodocs/admin/TODO.md`

## Related docs
- `Decodocs/docs/ADMIN_CONFIG.md`
- `Decodocs/admin/TODO.md`
- Root `firestore.rules`
- Root `firebase.json`
