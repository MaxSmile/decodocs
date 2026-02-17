# DecoDocs — Document Type System (Plan)

This document captures how DecoDocs should classify real-world uploads and route users into the right actions/prompt packs.

## Why
Users upload anything: contracts, invoices, books, pitch decks, private letters, SOPs, policies, broken PDFs.
If we treat everything as a contract:
- we waste tokens
- we produce confusing outputs
- we increase risk (users assume legal advice)

So we use a 2-level type system:

## Level 0 — Intake category
- **UNREADABLE**: corrupt/invalid, encrypted/password-protected, empty/blank
- **GENERAL**: informational or personal documents (books, resumes, letters, decks, manuals)
- **BUSINESS_LEGAL**: governance/compliance/finance/contracts (policies, invoices, contracts, constitutions)

UI must show the detected category and allow user override.

## Level 1 — Document type (examples)

### GENERAL (examples)
- Resume / CV
- Professional bio
- Cover letter
- Whitepaper
- Report
- Manual / guide
- SOP / procedure
- Pitch deck
- Proposal / tender response
- Marketing flyer
- Personal letter / notes

### BUSINESS_LEGAL (examples)
- Contract / agreement (generic)
- Employment contract
- Job offer / offer letter
- NDA
- Residential lease / tenancy
- Commercial lease
- Invoice
- Purchase order
- Privacy policy / terms

### Governance (BUSINESS_LEGAL) — high impact
- Company policies (IT / HR / Security / Ethics / Privacy)
- Associations constitution / charter / bylaws
- Company first minutes / incorporation resolutions

## Validation criteria library

For each supported type, DecoDocs maintains explicit validation criteria docs:
- `docs/validation/*`

Prompts must implement these criteria (criteria are not hidden inside prompts).

## Prompt Packs (Required MDX Contract)

Each document type used for analysis must have a matching MDX prompt pack file.

Required structure:
- Base prompt pack (always present): `docs/prompts/GENERAL_DOC_TYPE.mdx`
- Type prompt pack (one per type): `docs/prompts/types/<typeId>.mdx`

Required rules:
- Every `typeId` in the document type registry must have a matching `docs/prompts/types/<typeId>.mdx`.
- Every type prompt pack must inherit from `GENERAL_DOC_TYPE`.
- Type prompt packs define only type-specific prompts/overrides; shared prompts stay in `GENERAL_DOC_TYPE`.
- If a type prompt pack is missing, the type is incomplete and must not be considered production-ready.

Conceptual composition:
- Final prompt stack = `GENERAL_DOC_TYPE` + `docs/prompts/types/<typeId>.mdx`

## Routing: actions/prompt packs

### UNREADABLE
- Show fix steps (re-export, remove password, re-scan)
- No AI spend

### GENERAL
- Summary + key points
- Q&A (answer from doc only, cite where possible)
- Specialized packs by subtype:
  - Informational (whitepapers/reports/manuals): clarity, logic, unsupported claims
  - Representation (CV/bio): inconsistencies, exaggerations, omissions (careful wording)
  - Decision/Evaluation (pitches/tenders): assumptions, weak claims, missing data
  - Guides/SOPs: actionable steps, prerequisites, ambiguous instructions, responsibility gaps, contradictions

### BUSINESS_LEGAL
- Risks/obligations (with citations)
- Type-specific validation checklists
- OCR required for scanned PDFs (Pro)

### Company policies (BUSINESS_LEGAL)
- Extract mandatory vs optional rules
- Detect vague language (“appropriate”, “as needed”, “periodically”)
- Find conflicts between sections
- Flag missing enforcement / ownership
- Check alignment with provided laws/standards (only if supplied)

### Associations constitutions / charters
- Membership rules vs expulsion powers
- Voting rights + quorum traps
- Amendment mechanisms
- Board vs members authority conflicts
- Missing dispute / dissolution clauses
- Silent areas (finance control, asset ownership)

### Company first minutes / incorporation resolutions
- Directors properly appointed?
- Shares actually issued vs just mentioned?
- Officers assigned authority or just named?
- Banking/signing authority defined?
- Dates aligned with incorporation?
- Jurisdiction compliance gaps

### Invoices
- Legal entity mismatch
- Missing invoice number / tax IDs
- VAT/GST logic
- Line items vs totals mismatch
- Payment terms clarity
- Cross-check vs contract/PO (if provided)

## Storage of classification
- Store detected type + confidence per `docHash`.
- Store user override per **puid + docHash** (users are isolated).
