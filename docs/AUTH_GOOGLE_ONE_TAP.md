# DecoDocs — Google Identity Services (One Tap)

_Last updated: February 19, 2026_

This document describes how Google Identity Services (GIS) One Tap is integrated into the DecoDocs web app.

## 0) Implementation record (what was done)

GIS is implemented as a client-side enhancement in `web/src/components/auth/GoogleOneTap.jsx` and wired through the existing Firebase Auth model.

Implementation path:
- Load Google GIS script (`https://accounts.google.com/gsi/client`) only when needed.
- Enable One Tap only for authenticated anonymous sessions (`authState.status === 'authenticated'` and `user.isAnonymous === true`).
- Use Firebase credential handoff:
  - create Firebase credential with `GoogleAuthProvider.credential(response.credential)`.
  - prefer `linkWithCredential(auth.currentUser, credential)` to preserve anonymous-session continuity.
  - fallback to `signInWithCredential(auth, credential)` if no current user is available.
- Apply UX guardrails:
  - once-per-session prompt cap via `sessionStorage`.
  - 7-day dismissal cooldown via `localStorage`.
- Emit telemetry events (`auth_one_tap_*`) through `trackAuthEvent` for funnel visibility.

## 1) Purpose

- Reduce friction for returning users.
- Encourage anonymous → account upgrade without navigation.

## 1.1) What this gives us

- Faster sign-in/upgrade path for anonymous users (no full sign-in page detour).
- Better identity continuity by linking Google to the existing anonymous Firebase user where possible.
- Lower risk of “new account instead of linked account” behavior during upgrade.
- Measurable auth funnel signals through explicit One Tap event tracking.

## 2) When One Tap runs

One Tap is only enabled when:

- `VITE_GOOGLE_GIS_CLIENT_ID` is set (web env)
- user session is **anonymous** (`user.isAnonymous === true`)
- the user has not dismissed One Tap recently
- One Tap hasn’t already been shown in this browser session

## 3) Dismissal behavior

- Dismissal is respected for **7 days** via localStorage.
- One Tap shows at most once per session via sessionStorage.

## 4) Auth behavior

- If an anonymous Firebase user exists, the GIS credential is **linked** to that user.
- Otherwise we fall back to sign-in.

Implementation: `web/src/components/auth/GoogleOneTap.jsx`.

## 5) Analytics events

If `window.gtag` exists, the app emits:

- `auth_one_tap_shown`
- `auth_one_tap_success`
- `auth_one_tap_error`
- `auth_one_tap_dismissed`

## 6) Local dev setup (no env files)

Do not use `.env.local` or any `.env*` file.

If you need to test with a GIS client ID locally, pass it inline when starting the dev server:

```bash
VITE_GOOGLE_GIS_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID npm run dev
```
