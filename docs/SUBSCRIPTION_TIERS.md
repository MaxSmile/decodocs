# DecoDocs — User Types, Entitlements, and Limits (Technical Spec)

This document is the **source of truth** for:
- how we classify users (Anonymous / Free / Pro / Business / Enterprise)
- which features are gated
- how AI budgets are enforced
- where entitlements and abuse-prevention metadata live

## 1) User Types (Authoritative)

### 1.1 Anonymous
**Definition:** Firebase Auth user where `auth.token.firebase.sign_in_provider == "anonymous"`.

**Capabilities**
- AI analysis: **allowed** (very small budget)
- LLM tier: **low-cost** model
- OCR / vision model: **not allowed**
- Storage with us: **none** (browser-only)

**Limits**
- **20,000 tokens per Firebase uid-session** (same uid == same anonymous login session)

> Note: Internally, enforcement will be done against **puid** (primary user identifier) once provider-linking is introduced.
> See docs/AUTH_LINKING.md.

### 1.2 Free
**Definition:** Firebase Auth user that is **not** anonymous (Google/Email/Microsoft/Apple/etc) AND does **not** have an active subscription.

**Capabilities**
- AI analysis: **allowed** (bigger budget)
- LLM tier: **standard** model
- OCR / vision model: **not allowed**
- Storage with us: **none** (browser-only)
- Cloud connectors (later): user can connect Google Drive / OneDrive / iCloud as external sources (no storage on our side).

**Limits**
- **40,000 tokens per day (per Firebase `uid`)**

### 1.3 Pro (Individual)
**Definition:** Non-anonymous Firebase Auth user AND Stripe subscription is **active** on the Pro plan.

**Price**
- **$5 / month** (individual)

**Capabilities**
- AI analysis: **unlimited** (until we observe abuse, then we introduce fair-use)
- LLM tier: **premium** model (vs Free/Anonymous)
- OCR / scanned PDF support: **yes**
- Storage with us: **5 GB per user**

### 1.4 Business
**Definition:** Non-anonymous Firebase Auth user AND Stripe subscription is **active** on the Business plan.

**Price**
- **$50 / month** (up to 5 worker accounts)

**Capabilities**
- Includes all Pro capabilities.
- Org-level ownership for documents and usage.
- Admin visibility across team documents.
- Shared billing and seat management (up to 5 worker accounts).
- LLM tier: **premium** model.
- Storage with us: **5 GB per user**.

### 1.5 Enterprise
**Definition:** Contracted org account (plan flag set by admin/config), non-anonymous users under the org, typically for teams needing **more than 5 worker accounts**.

**Price**
- **Custom** (seat- or usage-based, to be defined)

**Capabilities**
- All Business capabilities.
- Enterprise controls: SSO (SAML), SCIM, RBAC, audit logs, retention policies, legal hold, export controls.
- Security/compliance posture: DPA, data residency options, subprocessor list, and compliance roadmap.
- LLM tier: **premium** model, with model/provider transparency and AI output traceability.
- Storage with us: **custom** (per contract).

## 2) Feature Gating Rules

### 2.1 AI analysis
- Anonymous: allowed within **20k tokens per uid-session**
- Free: allowed within **40k tokens/day**
- Pro / Business / Enterprise: unlimited (subject to fair-use)

### 2.2 OCR / scanned PDFs
- We detect scanned PDFs.
- **Free and Anonymous do not get OCR** (no vision model).
- Pro / Business / Enterprise get OCR.

### 2.3 Storage
- Anonymous: none
- Free: none (browser-only)
- Pro: **5 GB** stored with us
- Business: **5 GB per user** (org-managed)
- Enterprise: **custom** (per contract)

## 3) Entitlements Source of Truth

### 3.1 Identity
- Firebase Auth is the identity provider.
- Server-side code must verify Firebase ID tokens and derive:
  - `uid`
  - `isAnonymous`

### 3.2 Subscription status
- Stripe is the source of truth for **Pro** and **Business** subscription state.
- Enterprise is set via admin config (contracted).
- Server-side code determines:
  - `subscriptionActive: boolean`
  - `planId: free | pro | business | enterprise`
  - `seatLimit` (for business/enterprise)

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
- **Team features → Upgrade to Business** (org visibility, shared billing, up to 5 worker accounts)
- **Enterprise controls → Contact sales** (SSO, SCIM, audit, retention)

Also: when actions are *disabled* (not just blocked after a click), the UI must explain *why* and provide a clear next step.

### 6.1 Disabled-state messaging (required)

Common disabled reasons and preferred CTA:
- **No document loaded:** “Open a PDF to enable analysis tools.” → CTA: **Open PDF**
- **Not signed in:** “Sign in to enable AI analysis (Free).” → CTA: **Sign in** + optional “See Free vs Pro”
- **Pro required (preflight):** “This document needs Pro features (OCR / deeper processing).” → CTA: **Upgrade to Pro**
- **Loading:** “Working…” → CTA: none

Examples:
- Anonymous limit reached: “Create a free account to continue (higher daily AI limit).”
- Free OCR attempt: “OCR is available on Pro (includes 5GB storage).”
- Free AI limit reached: “Upgrade to Pro for unlimited analysis and OCR.”
