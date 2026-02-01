# DecoDocs — Google Identity Services (One Tap)

_Last updated: February 2, 2026_

This document describes how Google Identity Services (GIS) One Tap is integrated into the DecoDocs web app.

## 1) Purpose

- Reduce friction for returning users.
- Encourage anonymous → account upgrade without navigation.

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

## 6) Local dev setup

Create `web/.env.local` (do not commit):

```bash
VITE_GOOGLE_GIS_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID
```
