# DecoDocs — Email/Password Auth (Firebase) — Setup + UX

_Last updated: February 2, 2026_

This document describes how DecoDocs uses Firebase Email/Password auth and what must be configured for it to work in production.

## 1) Firebase Console setup (required)

In Firebase Console for project `snapsign-au`:

1. Go to **Build → Authentication → Sign-in method**
2. Enable **Email/Password** provider
3. Ensure your app’s domains are allowed under **Authorized domains**

## 2) User experience (current)

In `/sign-in` the app supports:

- **Link email to current session**
  - Intended for the default anonymous-first flow
  - Uses Firebase credential linking, upgrading the current user to a permanent email/password sign-in

- **Sign in with email**
  - Signs in directly using email/password

- **Create account**
  - Creates an email/password account
  - Recommended minimum password length: **10**

- **Reset password**
  - Sends a password reset email

## 3) Common failure modes

### Email already in use
If a user attempts to link an email that already exists on another Firebase account:
- Firebase returns `auth/email-already-in-use`
- UX: instruct the user to **sign out**, then sign in to the existing account, then link other providers from `/profile`

## 4) Testing notes

- Unit tests should not require real credentials.
- Prefer emulator or mock mode (see `docs/DEVELOPMENT.md`).
