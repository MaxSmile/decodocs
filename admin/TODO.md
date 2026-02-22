# TODO - DecoDocs Admin Portal

_Last updated: February 21, 2026_

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

## Per-file code quality audit (February 21, 2026)

### `src/pages/AdminHome.jsx`
- [ ] Replace hardcoded config cards with a shared route/config registry used by both `AdminHome` and `ConfigEditor` to avoid route drift.
- [ ] Move repeated inline button/card styles into reusable UI components or shared style tokens (current inline duplication across most pages).

### `src/pages/AccessDenied.jsx`
- [ ] Add test coverage for sign-out flow and rendered account identity (`Signed in as`) so access-denied UX does not regress.
- [ ] Align layout/styling with shared page shell to remove one-off inline styling.

### `src/pages/LoginPage.jsx`
- [ ] Normalize Firebase auth error messages before rendering (currently raw `e.message` is shown directly).
- [ ] Add focused tests for login failure/success state transitions and disabled submit state.

### `src/pages/RegisterPage.jsx`
- [ ] Remove hardcoded password rule duplication (`password.length < 10`) by sourcing from shared validation policy to prevent UI/backend drift.
- [ ] Normalize Firebase auth error messages before rendering (currently raw `e.message` is shown directly).
- [ ] Add tests for password policy UI behavior and registration failure states.

### `src/pages/ConfigEditor.jsx`
- [ ] Fix stale hook dependency: `const saveConfig = useMemo(() => httpsCallable(fn, 'setAdminConfig'), [])` should include `fn`.
- [ ] Add unsaved-changes route leave protection (confirm before navigating away when `dirty` is true).
- [ ] Add tests for server validation error rendering path (`e.details.errors`), unknown config key path, and load failure path.

### `src/pages/AiEventsPage.jsx`
- [ ] Prevent state updates after unmount during async load (mirror `active` guard pattern already used in `ConfigEditor`).
- [ ] Add tests for loading/error/empty states and timestamp formatter behavior.
- [ ] Consider pagination/cursor loading instead of fixed cap (`MAX_ROWS = 150`) for better long-term operability.

### `src/pages/ReportsPage.jsx`
- [ ] Remove expensive full-table remount key (`key={filtered.map(...).join(',')}`); this scales poorly with row count.
- [ ] Add per-row pending state for status updates to prevent repeated rapid writes on the same report.
- [ ] Add tests for status update flow, filtering behavior, and error state rendering.

### `src/pages/UsersPage.jsx`
- [ ] Remove dead code: `rowsRef` is created and assigned but never used.
- [ ] Replace index-based row access in actions (`row.cells[4]`) with safer id-based mapping to reduce break risk when columns change.
- [ ] Remove expensive full-table remount key (`key={rows.map(...).join(',')}`) and use targeted row updates instead.
- [ ] Add per-row pending states for disable/delete actions to avoid duplicate requests from repeated clicks.
- [ ] Add tests for pagination (`nextPageToken`), disable/enable toggles, and delete confirmation paths.

### `src/App.jsx`
- [ ] Add integration test coverage for all protected admin routes (`/users`, `/reports`, `/ai-events`, `/config/:key`) under signed-out/non-admin/admin states.

### `src/AuthContext.jsx`
- [ ] Resolve lint warning from `react-refresh/only-export-components` by moving hook/context exports to a component-only module split.

### `src/test/HeaderLayout.test.jsx`
- [ ] Fix failing test setup: wrap `App` with required auth provider or mock `useAuth`; current test crashes with `useAuth must be used inside AuthProvider`.
- [ ] Narrow assertion scope to app-owned headers/components and avoid global computed-style checks that can be brittle in jsdom.
