# SnapSign - AI Signature Studio Flow (Free vs Paid) - Technical Spec (MVP)

## 0) Goals
- Enable users to create a calligraphic or artistic signature style with AI assistance.
- Preserve user control: AI proposes variants; user chooses, edits, and approves final output.
- Prevent impersonation and obvious forgery workflows.
- Keep privacy-first defaults for Free, with optional persistence in Paid tiers.
- Keep terminology clear:
  - **Generate** = AI proposes style variants from user-provided inputs.
  - **Approve** = user explicitly selects final variant for use.
  - **Open** = ephemeral processing, no persistence.
  - **Upload** = persistent storage of signature assets and metadata (Paid only).

## 1) Terms and Entities

### 1.1 Signature Profile
- `signature_profile_id` (UUID)
- `owner_puid` (server-side primary user identifier)
- `display_name` (name used to generate signature styles)
- `style_preset` (for example: `classic_calligraphy`, `modern_brush`, `minimalist_script`)
- `consent_version` (accepted terms version)
- `created_at`, `updated_at`

### 1.2 Signature Assets
- `signature.svg` (primary, scalable)
- `signature.png` (fallback raster export)
- `preview.webp` (small thumbnail for UI)
- `metadata.json` (generation prompt, model version, seed, style params)

### 1.3 Signature Session (ephemeral job)
- `session_id`
- `input_type`:
  - typed name only
  - typed name + handwriting sample
  - typed name + style reference
- `variant_count`
- `risk_classification`: `{SAFE | REVIEW | BLOCKED}`
- `reasons[]`

### 1.4 Consent and Eligibility
- User must confirm: "I am creating a signature for myself or I am explicitly authorized."
- User must confirm legal name intent for signature generation.
- Underage and regulated use cases may require extra policy gates (future).

## 2) Safety and Preflight Analyzer (runs before model generation)
Input:
- typed name
- optional handwriting sample image
- optional style reference image
- user/account context

Outputs:
- `normalized_name`
- `input_quality_score` (0..1)
- `contains_blocked_terms` (bool)
- `likely_impersonation` (bool)
- `risk_classification`: `{SAFE | REVIEW | BLOCKED}`
- `reasons[]`: machine-readable + user-facing strings

Rules baseline (configurable):
- Block if input explicitly requests another known person/brand signature.
- Block if prompt contains forgery-oriented intent (for example: "copy CEO signature exactly").
- Review if style reference resembles a scanned real signature artifact.
- Require minimum image quality for handwriting samples.
- Require explicit user consent checkbox before generation.

## 3) FREE AI Signature Flow (Stateless)

### 3.1 Entry points
A) Signature Studio page in web app
B) Signature setup step during sign flow (if no saved signature exists)

### 3.2 Free constraints
- No server-side storage of final signature assets
- No persistent profile history
- No custom style reference upload (typed name + basic presets only)
- Variant limits:
  - up to 6 variants per session
  - up to 3 regeneration attempts per day (per anonymous/free identity)

### 3.3 Processing steps
1) User enters name and selects style preset
2) User accepts consent statement
3) Run Safety and Preflight Analyzer
4) If risk classification is `BLOCKED`:
   - do not call model
   - show block reason and safe alternatives
5) If `SAFE` or `REVIEW`:
   - generate candidate vector strokes
   - normalize line quality for rendering and PDF placement
6) Return variants in-session only
7) User picks one variant and optionally tweaks:
   - stroke thickness
   - slant
   - baseline smoothing
8) Apply chosen signature to current document (ephemeral use)
9) Purge session artifacts after TTL expiry

### 3.4 Free error handling
- Low-quality input: prompt user to retry with clearer writing/sample
- Policy block: show clear reason and policy-safe path
- Model timeout/failure: return fallback preset variants from deterministic renderer
- Rate limit: show remaining attempts and reset time

### 3.5 Free logging (allowed, non-content)
- `created_at`
- `sender_identity_hash` or `puid` (if available)
- `risk_classification` + `reasons`
- `variant_count`
- `latency_ms`
- `model_version`
- No raw handwriting image storage
- No final signature asset persistence

## 4) PRO AI Signature Flow

### 4.1 Pro capabilities
- Persistent signature profiles (**Upload**) enabled
- Handwriting sample upload for personalization
- Style reference upload with policy checks
- Higher variant/regeneration quotas
- Export formats: SVG, PNG, transparent PNG

### 4.2 Pro limits (baseline)
- Up to 100 generated variants/day per puid
- Up to 10 saved signature profiles per puid
- Hard limits remain for image size and dimensions

### 4.3 Identity and entitlement
- Identity: Firebase Auth
- Entitlement: server-side tier resolution via Stripe status
- Limits and storage are enforced per `puid`

If entitlement missing => apply Free constraints.

### 4.4 Pro processing modes
- **Open (ephemeral)**: generate and use without saving
- **Upload (persistent)**: save profile + approved assets + metadata

Default:
- Signature Studio uses Open unless user clicks "Save to profile"

### 4.5 Pro processing steps
1) Validate entitlement and consent
2) Ingest typed name + optional handwriting/reference files
3) Run Safety and Preflight Analyzer
4) Generate variants with controlled randomness and style constraints
5) Rank variants for legibility and stroke continuity
6) User refines and approves one or more variants
7) If mode is Upload:
   - store assets and metadata
   - store profile-level audit event
8) Signature becomes available in sign flows and profile settings

## 5) PREMIUM / BUSINESS Signature Flow

### 5.1 Premium capabilities
- Team-approved signature templates
- Delegated signing policies and role-based restrictions
- Signature lifecycle controls (rotation, revocation, mandatory re-approval)
- Advanced fraud/risk scoring and admin review queues

### 5.2 Processing
- Policy engine enforces who can generate, approve, and deploy signatures
- Optional dual-approval for high-risk accounts
- Full audit export for compliance teams

## 6) User Messaging (Web and Email)

### 6.1 Standard block message
- Title: `Signature generation blocked`
- Body:
  - one-line reason summary
  - policy-safe alternatives
  - support link for disputes

Suggested text:
- "We cannot generate signatures intended to imitate another person."

### 6.2 Review-state message
- "Your request can proceed, but this style may require confirmation before saving."

## 7) Security and Privacy Requirements
- TLS in transit for all uploads and generation requests
- Temporary files encrypted at rest with strict TTL purge
- Signature assets are access-controlled per `puid`
- Signed URLs for any asset retrieval
- Audit events are immutable append-only records
- No silent sharing of signature assets across accounts

## 8) Acceptance Criteria (MVP)
FREE:
- User can generate artistic signature variants from typed name + preset style.
- User can apply chosen variant to current signing flow without persistence.
- Policy blocks clear impersonation/forgery prompts.

PRO:
- User can upload handwriting sample and generate personalized variants.
- User can save approved signatures to profile and reuse them.
- System enforces tier limits and maintains profile-scoped access control.

## 9) Non-Goals (MVP)
- Fully automatic legal identity verification across jurisdictions
- Guarantee that generated style is legally valid in every country
- Replication of a specific third-party real signature
- Biometric signature verification for courts (separate phase)
- On-device model inference for mobile apps (separate phase)

## 10) Suggested API Surface (Initial)
- `POST /api/signature/preflight`
  - input: typed name, optional sample/reference metadata
  - output: risk classification + reasons
- `POST /api/signature/generate`
  - input: approved preflight token + style params
  - output: variant set (SVG/PNG previews)
- `POST /api/signature/approve`
  - input: selected variant id + optional refinements
  - output: approved asset bundle
- `POST /api/signature/save` (Pro)
  - input: approved asset bundle + profile metadata
  - output: `signature_profile_id`
- `GET /api/signature/profiles` (Pro)
  - output: saved profiles and active signature metadata
