# TODO - DecoDocs Admin Portal

_Last updated: February 19, 2026_

## Decisions (confirmed)
- **Admins:** any signed-in user with `@snapsign.com.au` email = super admin (single role for now).

- **Config model:** one Firestore doc per config:
  - `admin/stripe`
  - `admin/plans`
  - `admin/flags`
  - `admin/policies`
- **Audit log:** not required yet (add later once testing stabilizes).

## v1 Scope (status)
- [x] Stripe config editor for `admin/stripe` (interactive json-edit-react tree editor).
- [x] Plans/entitlements editor for `admin/plans` (interactive json-edit-react tree editor).
- [x] Feature flags editor for `admin/flags` (interactive json-edit-react tree editor).
- [x] Usage policies editor for `admin/policies` (interactive json-edit-react tree editor).
- [x] Dashboard with quick links.
- [x] Email/password auth (sign-in + registration).
- [x] Client-side admin gating by email domain.
- [x] Firestore rules enforcement for `admin/*`.
- [x] Users management page (`/users`) — list, disable, enable, delete Firebase Auth users via `adminListUsers` / `adminUpdateUser` / `adminDeleteUser` callables.
- [x] Feedback & bug reports page (`/reports`) with inline status updates — gridjs-react table.
- [x] AI error events page (`/ai-events`) — gridjs-react table with sort/search/pagination.

## UI library upgrades (done)
- [x] Replace raw JSON textarea with `json-edit-react` interactive tree editor in all config editors.
- [x] Replace hand-rolled CSS-grid tables with `gridjs-react` (mermaid theme) in Reports and AI events pages.
- [x] Import gridjs mermaid CSS globally in `main.jsx`.

## First deploy readiness (staging)
- [x] Firebase Auth: enable Email/Password provider in project `snapsign-au`.
- [x] Firestore Rules: confirm `admin/*` read/write is restricted to `@snapsign.com.au`.
- [x] Hosting target mapping: confirm `.firebaserc` maps `decodocs-admin -> decodocs-admin`.
- [ ] Bootstrap at least one `@snapsign.com.au` admin account.
- [ ] Seed minimum config docs:
  - [ ] `admin/stripe`
  - [ ] `admin/plans`
  - [ ] `admin/flags`
  - [ ] `admin/policies`
- [x] Build app (`npm run build`) and verify `Decodocs/admin/dist`.
- [ ] Deploy staging (`firebase deploy --only hosting:decodocs-admin`).
- [ ] Smoke test:
  - [ ] Allowed admin login works.
  - [ ] Non-allowlisted account is blocked with Access Denied.
  - [ ] Read/save round-trip works for all four config docs.
  - [ ] Invalid data shows validation hint and does not write.
  - [ ] Users page lists users and disable/delete work.
  - [ ] Reports page loads and status updates persist.
- [ ] Verify downstream behavior in web + functions after config edits.

## Next engineering tasks
- [x] Add server-side schema validation for `admin/*` writes (Functions).
- [x] Add lightweight UI validation hints for common config mistakes.
- [x] Add admin portal test coverage (auth gating + config read/write flow).
- [ ] Add `adminSetCustomClaims` callable for granting roles to users.
- [ ] Add pagination for users list beyond initial 1000 batch.
- [ ] Bundle-split large dependencies (json-edit-react, gridjs) to reduce initial load.

## Crash + report operations (done)
- [x] Add unified Firestore collection for operational reports (`admin_reports`).
- [x] Add admin page to view and manage report status (`/reports`).
- [x] Add web intake for `feedback` and `bug` reports from decodocs.com.
- [x] Log backend exceptions to Firestore operational reports for admin triage.
