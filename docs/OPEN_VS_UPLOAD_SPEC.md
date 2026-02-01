# DecoDocs — “Open vs Upload” Contract (Free vs Pro) — Spec

_Last updated: February 2, 2026_

This document defines the product + technical contract between:

- **Open** (ephemeral): user opens a document for viewing/analysis without saving it into DecoDocs storage.
- **Upload/Save** (persistent): user explicitly saves a document into DecoDocs-managed storage.

The goal is to make the default workflow privacy-forward and low-liability, while enabling Pro value where storage and heavier processing are required.

## 1) Definitions

### 1.1 Open (ephemeral)
**Meaning:**
- The user provides a local file (or cloud file via picker) and DecoDocs processes it to render/analyze.
- DecoDocs does **not** persist the raw file bytes in DecoDocs storage.

**Allowed for:** Anonymous + Free + Pro.

**Expected characteristics:**
- Works without a long-lived storage record.
- A page refresh may lose the document unless the user re-selects it.

### 1.2 Upload/Save (persistent)
**Meaning:**
- The user explicitly requests that the document be stored in DecoDocs storage (a “vault/history”).

**Allowed for:** Pro only.

**Expected characteristics:**
- Document can be re-opened without re-uploading.
- Enables history, sharing links (if implemented), and consistent analysis reports across devices.

## 2) Default behavior (must be explicit)

- **Default is Open**.
- “Upload/Save” must be a clear, explicit user action (button/CTA).
- Any UI implying persistence must be clearly labeled as Pro.

## 3) Gating rules

### 3.1 Open
- Always available (subject to entitlement limits and cost controls).

### 3.2 Upload/Save
- Requires Pro.
- If a Free/Anonymous user clicks “Save”, show a gate:
  - explain that storage is Pro
  - link to `/pricing`

## 4) What is stored (and what is not)

### 4.1 Open
We may store **minimal metadata** required for:
- abuse prevention / cost accounting
- product debugging

Examples:
- `docHash` ledger entries (see `SUBSCRIPTION_TIERS.md`)
- token usage counters

We do **not** store:
- raw PDF bytes
- extracted full text (unless explicitly justified and documented)

### 4.2 Upload/Save
We store:
- raw file bytes (encrypted at rest)
- stable metadata (filename, size, MIME type)
- `docHash` and audit metadata

We may store:
- extracted text (if needed for search and cost-effective re-analysis)

## 5) Token revocation guarantees (cloud connectors)

When a user connects a cloud provider (Drive/OneDrive/etc):

- Tokens must be revocable by the user.
- After disconnect/revoke:
  - the app must stop making provider API calls immediately (best-effort)
  - server-side must delete/disable stored refresh tokens

## 6) Audit logging expectations

When Upload/Save is implemented:

- record a minimal audit trail for storage actions:
  - `uploadedAt`, `uploaderUid/puid`, `source` (local/drive/onedrive)
  - delete events (who/when)
  - revocation events (who/when)

## 7) UX copy requirements (non-negotiable)

- Open mode: “Free mode never stores files.”
- Save/Upload: “Saving to DecoDocs is a Pro feature.”
- Cloud providers: “We only access files you select. No background sync.”
