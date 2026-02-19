# TODO - DecoDocs Admin Portal

_Last updated: February 19, 2026_

## Decisions (confirmed)
- **Admins:** any signed-in user with `@snapsign.com.au` email = super admin (single role for now).
- **Hosting:** start with staging at `decodocs-admin.web.app` (Firebase Hosting site `decodocs-admin`).
  - Production domain `admin.decodocs.com` later.
- **Config model:** one Firestore doc per config:
  - `admin/stripe`
  - `admin/plans`
  - `admin/flags`
  - `admin/policies`
- **Audit log:** not required yet (add later once testing stabilizes).

## v1 Scope (status)
- [x] Stripe config editor for `admin/stripe` (JSON editor).
- [x] Plans/entitlements editor for `admin/plans` (JSON editor).
- [x] Feature flags editor for `admin/flags` (JSON editor).
- [x] Usage policies editor for `admin/policies` (JSON editor).
- [x] Dashboard with quick links.
- [x] Email/password auth (sign-in + registration).
- [x] Client-side admin gating by email domain.
- [x] Firestore rules enforcement for `admin/*`.

## First deploy readiness (staging)
- [ ] Firebase Auth: enable Email/Password provider in project `snapsign-au`.
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
  - [ ] Invalid JSON shows error and does not write.
- [ ] Verify downstream behavior in web + functions after config edits.

## Next engineering tasks
- [x] Add server-side schema validation for `admin/*` writes (Functions).
- [x] Add lightweight UI validation hints for common config mistakes.
- [x] Add admin portal test coverage (auth gating + config read/write flow).

## Crash + report operations (new)
- [x] Add unified Firestore collection for operational reports (`admin_reports`).
- [x] Add admin page to view and manage report status (`/reports`).
- [x] Add web intake for `feedback` and `bug` reports from decodocs.com.
- [x] Log backend exceptions to Firestore operational reports for admin triage.
