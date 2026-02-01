# DecoDocs — Classifications Integration (Web + Functions + AI)

This document describes how the **static classification index** and **type-specific validation criteria** should be integrated with Firebase Functions + AI analysis.

## Goals
- Typeahead/search should be **client-side** using static assets served from Hosting/CDN.
- Deep validation logic and AI calls must be **server-side** (Functions), enforcing tier limits.
- Users can override classification per **puid+docHash**.
- Prompts implement explicit criteria docs; criteria are not hidden inside prompt text.

## Files / Assets

### Static (Firebase Hosting)
Location: `web/public/classifications/`
- `document-types.index.json` — flat list for typeahead
- `validation.index.json` — list of validation spec files
- `validation/<slug>.json` — validation specs (compiled from `docs/validation/*.md`)

These should be cached aggressively:
- long-lived cache headers
- versioned via deploy hash (Firebase Hosting)

### Server (Functions)
- `saveDocTypeOverride` callable (already exists)
- `getEntitlement`, `preflightCheck`, `analyzeText` (exist)
- Callables:
  - `detectDocumentType` (intake + type) — implemented (heuristic v1)
  - `getDocumentTypeState` (detected + override) — implemented
  - `analyzeByType` (type-specific pack selection) — implemented as a **stub** (returns effectiveType + loads validation spec). Next step: wire LLM extraction/validation.

## Data model (Firestore)

### Detected classification (global per docHash)
Collection: `doc_classifications/{docHash}`
- `docHash`
- `intakeCategory`: UNREADABLE | GENERAL | BUSINESS_LEGAL
- `typeId`: string (from `document-types.index.json`)
- `confidence`: number
- `model`: string/version
- `updatedAt`

### User override (per user)
Collection: `doc_type_overrides/{puid_docHash}` (already used)
- `puid`, `docHash`, `typeId`, `updatedAt`

### Effective type resolution
Effective typeId = override if present else detected.

## Web integration

### 1) Typeahead / override UI
- Load `document-types.index.json` on app start (or lazily on opening selector)
- Search purely client-side (no AI, no server)
- On doc load:
  - call `getDocumentTypeState({ docHash })` (best-effort) to hydrate detected+override
  - call `detectDocumentType({ docHash, stats, text })` (best-effort) after text extraction to seed `doc_classifications/{docHash}`
- When user picks a type:
  - show confirmation modal (“quick validation popup”)
  - on confirm:
    - save to localStorage `decodocs:doctype:<docHash>`
    - call `saveDocTypeOverride({ docHash, typeId })`

### 2) Showing classification
In DocumentViewer:
- show:
  - detected type + confidence (if available)
  - overridden type (if user changed)

### 3) Action routing (UI)
Based on effective intake+type, show a different action set:
- UNREADABLE: fix steps, no AI
- GENERAL: summary/key points/Q&A packs
- BUSINESS_LEGAL: validation packs, risk/obligation packs

> UI should remain simple; it should not embed deep checklists.

## Functions + AI integration

### A) detectDocumentType callable
Input:
- `docHash`
- `stats` (pageCount, charsPerPage, totalChars, pdfSizeBytes)
- `text` (Free/Anon extracted text)
- optional: `ocrText` (Pro)

Output:
- `{ intakeCategory, typeId, confidence, reasons[] }`

Rules:
- must be cheap
- must not hallucinate; if unsure → GENERAL/unknown

### B) analyzeByType callable
Input:
- `docHash`
- `effectiveTypeId` (resolved server-side)
- extracted text

Behavior:
- loads the relevant validation spec (server-side) by `typeId`
  - mapping from typeId → validation slug
- uses the validation criteria to run:
  - extraction
  - validation checks
  - produce structured JSON response matching the schema

Important:
- Typeahead index is static and public.
- Validation specs can be public too (fine), but AI execution remains server-side.

## Operational notes
- Keep validation specs versioned; add `version` to the JSON.
- Add a “model/prompt version” field to outputs for debugging.
- Add eval corpus per type later (DSPy training/optimization).
