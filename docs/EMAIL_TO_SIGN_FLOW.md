# SnapSign Envelope Flow (Frontend-Only)

## Scope
This document defines the canonical `.snapsign` envelope workflow implemented in this project.

Non-negotiable boundary:
- envelope technology is frontend/client-side
- user sends emails manually from their own email client
- backend does not send envelope invitation emails and does not orchestrate recipient sessions

## 1) Current Implementation (Live)

### Envelope container
- Extension: `.snapsign` (ZIP container)
- Required entries:
  - `document.pdf`
  - `manifest.json`
- Optional entries:
  - `analysis.json`
  - `audit.json`

`manifest.json` includes:
- `version`
- `createdAt`
- `document.path`
- `document.name`
- `document.mimeType`
- `document.sizeBytes`
- `document.sha256`

### Integrity model
- SHA-256 hash is calculated from raw `document.pdf` bytes.
- On extract/validate, browser recalculates hash and compares with `manifest.document.sha256`.
- Hash mismatch marks envelope invalid.

### Client modules
- Primary module: `Decodocs/web/src/services/envelopeService.js`
- Main APIs:
  - `openPdfOrEnvelopeFile(file)`
  - `createEnvelopeFromPdf(...)`
  - `extractEnvelope(...)`
  - `validateEnvelopeBytes(...)`
  - `createEnvelopeFileFromPdfFile(...)`
  - `runClientPreflight(...)`
  - `processEmailToSignClient(...)`
- UI usage:
  - `Decodocs/web/src/components/SignPage.jsx`
  - `Decodocs/web/src/components/DocumentViewer.jsx`
  - `Decodocs/web/src/components/PDFDropzone.jsx`
- Accepted upload types:
  - `.pdf`
  - `.snapsign`

### Current preflight
Baseline limits:
- `maxPages = 15`
- `maxTokens = 20000`
- `maxScanRatio = 0.20`
- `maxFileSize = 20MB`

Classifications:
- `FREE_OK`
- `PRO_REQUIRED`
- `BLOCKED`

### Server boundary (current and intended)
Functions are responsible for:
- entitlement checks
- usage budgets
- analysis calls
- storage URL signing

Functions do not perform:
- envelope ZIP parsing
- envelope validation
- envelope creation
- send-for-sign recipient/session orchestration
- outbound invitation/reminder/completion email delivery for envelopes

## 2) End-to-End Envelope Send-for-Sign Flow (Client-Side)

### 0. Preconditions
- Sender authenticated.
- Source document available (uploaded or imported).
- Sender has their own email client available (Gmail/Outlook/etc.) for manual sending.

### 1. Create envelope
Input:
- `document.pdf`
- optional envelope metadata (title/message)
- optional recipient metadata for convenience (stored in envelope metadata/audit only)

Browser:
- computes document hash
- builds `.snapsign` container with `manifest.json`
- keeps envelope state locally in app/session until export

### 2. Prepare envelope document
Sender places fields:
- signature
- initials
- date
- name
- text
- checkbox

Browser validates:
- required fields complete
- coordinates valid (no invalid overlap/out-of-bounds)
- any recipient assignments stored as metadata only (no backend recipient lifecycle)

Envelope remains local draft until exported.

### 3. Add recipients
For each recipient:
- `name`
- `email`
- `role` (`signer`, `cc`, `viewer`)
- optional signing order index (informational metadata only)

Browser stores recipient info in envelope metadata/audit for human workflow context.
No server-issued signing tokens are created.

### 4. Optional AI preflight (DecoDocs differentiator)
Client and Functions can run non-blocking analysis:
- obligations
- risky clauses
- inconsistencies
- "questions to clarify"

Outputs:
- `risk_report`
- `summary`
- optional shareable explanation view for recipients

This step is optional and does not auto-send anything.

### 5. Finalize envelope
Sender action:
- click `Export .snapsign`

Browser action:
- serializes current envelope (`document.pdf`, `manifest.json`, optional `analysis.json`, optional `audit.json`)
- returns downloadable `.snapsign` file to sender

### 6. Manual email by sender
Sender action (outside system automation):
- opens personal/work email client
- composes message manually
- attaches `.snapsign` (or PDF plus instructions)
- sends to recipients manually

System behavior:
- no automatic invitation emails
- no automatic reminder emails
- no automatic completion emails

### 7. Recipient signing flow
Recipient action:
- receives email in their own inbox
- downloads attachment
- opens `.snapsign` in DecoDocs by uploading file
- reviews doc and optional analysis
- signs/annotates in client

Browser action:
- validates envelope hash on open
- records local audit entries in `audit.json`
- allows export of updated/signed envelope

### 8. Return signed envelope manually
Recipient action:
- exports signed `.snapsign` or signed PDF
- replies/forwards manually via email

Sender action:
- receives returned files
- opens and verifies in client

## 3) Core State Machines

### Envelope (client-local)
`draft_local -> exported -> sent_manual -> signed_returned | declined_returned | closed`

### Recipient metadata
`planned -> emailed_manual -> response_received`

Important:
- these are workflow states, not backend-authoritative server states

## 4) Minimum Audit Events

- `envelope.created`
- `document.uploaded`
- `fields.updated`
- `envelope.exported`
- `email.sent_manual`
- `recipient.opened` (if recorded by client/user action)
- `signer.submitted` or `signer.declined`
- `signed_copy.received_manual`

## 5) Edge Cases to Handle Upfront

- Sender edits after sending -> export new envelope revision and resend manually.
- Recipient forwards attachment -> no server token binding exists; rely on document hash checks and process controls.
- Partial completion -> sender decides follow-up/resend manually by email.
- Delays -> sender sends reminders manually from their own email client.
- Recipient replacement -> sender reissues envelope and keeps prior audit trail artifacts.

## 6) Delivery Constraints (for this repo)

- Keep static hosting + basic Functions architecture; no SSR/advanced hosting.
- Keep envelope ZIP parsing/creation/validation in browser for `.snapsign` interoperability.
- Do not add backend invite-email orchestration for envelope flow.
