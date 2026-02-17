# DecoDocs — Validation Criteria Library

This folder contains **type-specific validation criteria** (checklists) used by DecoDocs.

Principles:
- Criteria are **explicit and versioned** (git)
- Prompts (DSPy or otherwise) must implement these criteria; criteria are not hidden in prompts
- UI may show a summary of criteria to users (“What we check for this type”)

## Prompt Pack Requirement

Validation criteria are paired with MDX prompt packs:
- Base prompt pack: `docs/prompts/GENERAL_DOC_TYPE.mdx`
- Type prompt pack: `docs/prompts/types/<typeId>.mdx`

Rules:
- each analyzable `typeId` must have a matching `docs/prompts/types/<typeId>.mdx`
- each type prompt pack must inherit from `GENERAL_DOC_TYPE`
- type-specific files contain only per-type deltas; shared behavior belongs in `GENERAL_DOC_TYPE`

## Files
- `invoice.md`
- `job-offer.md`
- `company-policy.md`
- `association-constitution.md`
- `sop-procedure.md`
