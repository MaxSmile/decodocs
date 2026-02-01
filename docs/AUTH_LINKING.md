# DecoDocs — Auth Linking + Primary User ID (puid)

This document defines how DecoDocs treats Firebase identities across multiple providers (anonymous/email/google/apple/microsoft), and how we keep usage/entitlements consistent when accounts are linked.

## Goals
- Users can start **Anonymous** and later attach one or more providers without losing continuity.
- A user can link multiple providers over time (e.g. Google + Email + Apple).
- Usage limits, docHash ledger, and Stripe entitlements are always counted against a stable **primary identifier**.

## Terms
- **Firebase uid**: The uid from Firebase Auth for a given signed-in session.
- **Provider uid**: A Firebase uid created under a specific provider flow (anonymous, google, email, etc).
- **puid (primary user identifier)**: Our internal canonical user identifier used by Firebase Functions and backend services.
  - **Not exposed to client UI**
  - Used as the join key for: usage counters, docHash records, entitlements, Stripe customer/subscription mapping.

## Provider Support (MVP)
We support Firebase Auth providers:
- anonymous
- email
- google
- apple
- microsoft

## Linking Rules (Authoritative)

### 1) Linking is universal
All provider identities are treated as aliases of a single primary identity.

- The **first** uid we consider canonical becomes the **puid**.
- Any subsequently linked uid/provider becomes an **alias**.

### 2) Counting and gating
All of the following are counted/enforced per **puid**:
- AI token budgets
- docHash ledger
- Stripe entitlements (Pro)
- storage quotas (Pro)

### 3) Anonymous → Free
When an Anonymous user signs in to a non-anonymous provider:
- We **link** the provider to the existing identity (continuity preserved).

### 4) Email already exists
If an Anonymous user attempts to sign up with an email that already has an account:
- The UX should suggest **log in instead**.
- After login, accounts can be linked (so the anonymous session becomes an alias under the same puid).

### 5) Multi-provider linking
A user may link multiple providers to the same puid.
- The UI should show a list of linked providers in the user area.

## Data Model (Suggested)

### Firestore: `users/{puid}`
- `createdAt`
- `primaryUid` (optional; if puid != firebase uid)
- `aliases`: array of `{ uid, provider, linkedAt }`
- `subscription`: `{ stripeCustomerId, status, updatedAt }`
- `usage`: summary fields (optional; detailed usage may live elsewhere)

### Firestore: `uid_aliases/{uid}`
Maps any Firebase uid to its puid.
- `puid`
- `provider`
- `linkedAt`

> NOTE: exact collection names are flexible, but the invariant is: **given a Firebase uid, Functions must resolve the puid**.

## Security
- puid is server-side only.
- Client never trusts its own claimed tier; backend resolves tier using:
  - Firebase ID token verification
  - puid resolution
  - Stripe subscription status for that puid
