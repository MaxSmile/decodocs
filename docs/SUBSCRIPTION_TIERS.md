# DecoDocs — User Types, Entitlements, and Limits (Technical Spec)

This document is the **source of truth** for:
- how we classify users (Anonymous / Free / Pro)
- which features are gated
- how AI budgets are enforced
- where entitlements and abuse-prevention metadata live

## 1) User Types (Authoritative)

### 1.1 Anonymous
**Definition:** Firebase Auth user where `auth.token.firebase.sign_in_provider == "anonymous"`.

**Capabilities**
- AI analysis: **allowed** (very small budget)
- OCR / vision model: **not allowed**
- Storage with us: **none** (browser-only)

**Limits**
- **20,000 tokens per auth session (per Firebase `uid`)**
  - Practically: the same anonymous `uid` persists until the user clears site data or we explicitly sign them out.

### 1.2 Free
**Definition:** Firebase Auth user that is **not** anonymous (Google/Email/Microsoft/Apple/etc) AND does **not** have an active subscription.

**Capabilities**
- AI analysis: **allowed** (bigger budget)
- OCR / vision model: **not allowed**
- Storage with us: **none** (browser-only)
- Cloud connectors (later): user can connect Google Drive / OneDrive / iCloud as external sources (no storage on our side).

**Limits**
- **40,000 tokens per day (per Firebase `uid`)**

### 1.3 Pro
**Definition:** Non-anonymous Firebase Auth user AND Stripe subscription is **active**.

**Capabilities**
- AI analysis: **unlimited** (until we observe abuse, then we introduce fair-use)
- Better model: **yes** (vs Free/Anonymous)
- OCR / scanned PDF support: **yes**
- Storage with us: **5 GB per user**

## 2) Feature Gating Rules

### 2.1 AI analysis
- Anonymous: allowed within **20k tokens per uid-session**
- Free: allowed within **40k tokens/day**
- Pro: unlimited

### 2.2 OCR / scanned PDFs
- We detect scanned PDFs.
- **Free and Anonymous do not get OCR** (no vision model).
- Pro gets OCR.

### 2.3 Storage
- Anonymous: none
- Free: none (browser-only)
- Pro: **5 GB** stored with us

## 3) Entitlements Source of Truth

### 3.1 Identity
- Firebase Auth is the identity provider.
- Server-side code must verify Firebase ID tokens and derive:
  - `uid`
  - `isAnonymous`

### 3.2 Subscription status
- Stripe is the source of truth for **Pro** subscription state.
- Server-side code determines:
  - `subscriptionActive: boolean`

### 3.3 Canonical user record
We keep a minimal record for **all** users (including Anonymous), because any user can later become Free/Pro.

## 4) Abuse Prevention / Deduplication Metadata (docHash)

### 4.1 What we store
We store document hashes to:
- reduce anonymous abuse / repeated submissions
- support usage accounting keyed to a stable doc identifier

At minimum, we store:
- `docHash` (content hash)
- `uid`
- timestamps / counters (e.g., lastSeenAt, totalTokensUsed)

### 4.2 Where we store it
- Firestore collection: **`docshashes`**

### 4.3 Retention
- **Forever** (explicit product/security decision; document this in Privacy/Policy).

## 5) Pro Storage Backend

- Pro storage lives on **Contabo VPS** (custom setup).
- Firestore remains the system of record for:
  - identities/metadata
  - docHash abuse-prevention ledger
  - subscription/entitlement flags (as needed)

## 6) Standard Gating UX Messages (copy guidance)

When a user hits a gate, the UI should distinguish:
- **Anonymous → Register** (to get the Free tier limits)
- **Free → Upgrade to Pro** (for OCR, better model, unlimited AI, 5GB storage)

Examples:
- Anonymous limit reached: “Create a free account to continue (higher daily AI limit).”
- Free OCR attempt: “OCR is available on Pro (includes 5GB storage).”
- Free AI limit reached: “Upgrade to Pro for unlimited analysis and OCR.”
