# AGENTS.md (web)

This file describes how agents (and contributors) should reason about the **DecoDocs web app** architecture and where responsibilities live.

## Core Principle

**DecoDocs is docs-first.**  
The product’s core action is: **decode documents** (understand → clarify → fix → act).  
Signing and sending are optional downstream steps.

## Hybrid Architecture Overview

We deliberately use a **hybrid** approach to optimize for:
- fast UI iteration
- strong security boundaries
- predictable infra costs
- portability over time

### Client (Web) — “Most operations”
The web app is designed to do **as much as possible on the client side**, including:
- PDF rendering, paging, zoom, search-in-doc UI
- highlights, notes, annotations UI
- local drafts / optimistic updates
- caching decoded outputs for responsiveness
- lightweight text transformations where feasible

**Important:** “client-side heavy” never means exposing secrets or bypassing access control.

### Firebase — Identity Provider (only what we need)
We use **Firebase Auth** primarily as an identity provider:
- login (email/Google/etc.)
- token issuance
- user identity verification

We do **not** rely on Firebase Functions for core backend logic (optional only).
Firestore usage is optional and can be used for realtime UX in early phases, but it should not become a hard dependency that blocks future migration.

### Contabo — File Storage (canonical)
All document files (PDFs and artifacts) are stored outside Firebase, on **Contabo storage**:
- preferred: Contabo Object Storage (S3-compatible)
- alternative: Storage VPS + MinIO (S3 API)

The web app uploads directly to storage using **pre-signed URLs** generated server-side.

### VPS — Backend + AI + Search (source of truth for “heavy work”)
A self-managed VPS (or small cluster) handles:
- generation of pre-signed upload/download URLs (or delegated gateway)
- AI “decode” pipelines (OCR if needed, chunking, summaries, risk highlights, rewrites)
- semantic search indexing (pgvector/Qdrant) and retrieval
- background jobs / queues / retries
- rate limiting and cost control for AI operations
- secure email workflows (send-for-sign, reminders) if/when implemented

## Non-Negotiable Security Rules

Anything that involves:
- AI provider keys / model calls
- storage credentials
- pre-signed URL generation
- access control / tenancy decisions
- email sending workflows
- payments

**MUST be server-side** (VPS and/or Next.js server routes).

The client may request these actions, but **never performs them directly**.

## Next.js Role (Web Folder)

`/web` is expected to be a Next.js app.

Next.js is used for:
- UI + routing
- server routes (API endpoints) that must remain private
- acting as a lightweight gateway to VPS services when needed
- verifying Firebase ID tokens and enforcing authorization

Even though the UI is client-heavy, we keep secrets and permission checks on the server.

## Recommended Data Boundaries

### Storage objects (canonical files)
- Stored in Contabo
- Identified by `fileKey` (opaque)
- Never public
- Access via short-lived pre-signed GET URLs

### Metadata and UI state
- Can live in Firestore initially for realtime UX
- Long-term can migrate to Postgres
- Store only what the UI needs:
  - docId, owner/tenantId, fileKey, status, timestamps
  - annotations/highlights (or pointers to them)
  - decode result references (or summarized payloads)

### AI decode results
MVP approach:
- Store decode outputs where the UI can easily read them (often Firestore).
Evolving approach:
- Canonical storage of decode outputs + embeddings in VPS-managed DB,
  with minimal sync to Firestore for UX.

## Standard Flow (MVP)

1. **Auth**
   - Client signs in with Firebase Auth
   - Client holds Firebase ID token

2. **Create doc**
   - Client creates a doc record (metadata) via server route or directly (if allowed)
   - Status: `created`

3. **Upload file**
   - Client requests `POST /api/files/presign` (Next.js server route)
   - Server verifies Firebase token and returns:
     - pre-signed PUT URL
     - `fileKey`
   - Client uploads directly to Contabo using the PUT URL
   - Client updates doc record with `fileKey`, status: `uploaded`

4. **Start decode**
   - Client calls `POST /api/decode/start` (or a Firestore-triggered mechanism if used)
   - Server verifies auth, authorizes doc access, queues decode on VPS
   - Status: `decoding`

5. **Decode completion**
   - VPS completes processing and writes results back:
     - either directly to Firestore (service account)
     - or calls a server route that persists results
   - Status: `decoded`

6. **UI rendering**
   - Client renders decode output + annotations UI
   - Client operations remain mostly local and responsive

## “Client-side first” UX Expectations

Agents should prioritize:
- responsive UI
- local-first interactions
- minimal server roundtrips during reading/annotation
- optimistic updates with eventual consistency

But always preserve:
- strict auth verification
- server-authoritative permission checks
- no exposure of secrets in the browser

## What to Avoid

- Calling LLM APIs directly from the browser
- Storing files in public buckets
- Long-lived signed URLs
- Deep lock-in to Firestore rules as the only authorization layer
- Building “an e-sign tool” mindset; signing is downstream

## Terminology

- **Decode**: explain + highlight risks + clarify + suggest fixes.
- **Doc**: any PDF/document stored in Contabo and represented by metadata in the app.
- **Tenant**: future concept for teams/orgs; keep IDs and ownership boundaries in mind.

---
If you change architecture decisions, update this file first.
