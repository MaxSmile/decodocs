# DecoDocs — Auth UX + States (Source of Truth)

_Last updated: February 2, 2026_

This document defines the **user-facing authentication UX** and the explicit states/transitions DecoDocs must support.

Goal: users can start anonymous (privacy-first), then **upgrade to a real account** without losing context (current document + analysis state), and understand when/why features are gated.

## 1) Auth states

### A) Anonymous session (default)
**Definition:** Firebase Auth user where `user.isAnonymous === true`.

**UX expectations:**
- The user can open/view PDFs.
- AI features may be limited by tier budgets.
- When AI features are disabled due to being signed out/unauthenticated, show a clear CTA to sign in.

**Primary CTAs:**
- “Sign in” (goes to `/sign-in`)
- “See Free vs Pro” (goes to `/pricing`)

### B) Signed-in session (persistent)
**Definition:** Firebase Auth user where `isAnonymous === false` (Google/Email/Microsoft/Apple).

**UX expectations:**
- Session persists across reloads.
- User can access `/profile`.

### C) Linking flow (anonymous → provider)
**Definition:** user starts anonymous, then links a provider.

**Required behavior:**
- Use Firebase credential linking (e.g. `linkWithPopup`, `linkWithCredential`).
- Preserve the current identity when possible (same underlying account upgraded).

**UX expectations:**
- The user should not “lose” the current document context in the UI.
- After linking, navigate to `/profile` (current behavior) or return to the originating page (future enhancement).

### D) Signed-out session
**Definition:** no Firebase user session.

**UX expectations:**
- App still renders for viewing.
- Any gated actions explain why they’re disabled and offer sign-in.

> Note: in practice, the app may auto-create an anonymous session; signed-out can be treated as an edge-case.

## 2) Required entry points

### 2.1 Always-accessible sign-in
- Provide a visible route `/sign-in`.
- Ensure there is at least one discoverable UI entry point:
  - Header/footer sign-in link (recommended)
  - and/or gating panel CTAs when buttons are disabled

### 2.2 Gated action click-through
When a user attempts a gated action:
- Show a clear explanation.
- Offer the correct next step:
  - Anonymous → “Create free account / Sign in”
  - Free → “Upgrade to Pro”

## 3) Conflict handling (non-negotiable)

If a user is anonymous and tries to link a provider credential that already belongs to another Firebase account:
- Show: “This email is already in use. Sign in to that account to continue.”
- Provide a safe recovery path:
  - sign out
  - sign in using that provider
  - link other providers from `/profile`

Do **not** silently merge accounts.

## 4) Current implementation notes

- `/sign-in` exists and supports:
  - Google via Firebase `GoogleAuthProvider`
  - Apple + Microsoft via `OAuthProvider`
  - Email/password linking via `linkWithCredential`
- Provider linking behavior:
  - If `auth.currentUser` exists, the page links providers to the current session.

## 5) Acceptance criteria

- A user can start anonymous, open a PDF, and then link a provider without breaking the app.
- Gated actions clearly communicate what’s required (sign-in vs Pro).
- Credential-already-in-use cases produce a human-readable message and recovery path.
