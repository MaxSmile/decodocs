# Validation Criteria — SOP / Procedure / Guide

Type id: `general_sop_procedure`

## Goal
Turn instructions into an actionable runbook:
- extract steps
- flag ambiguity
- find missing prerequisites
- identify responsibility gaps
- highlight contradictions

## What to extract (structured)
- Purpose / scope
- Preconditions / prerequisites
- Required inputs/tools/access
- Steps (ordered)
- Decision points (if/else)
- Outputs / completion criteria
- Roles/responsibilities

## Validation checklist

### A) Actionable steps
- Convert narrative into numbered steps
- Each step should include:
  - action
  - responsible role (if known)
  - inputs
  - expected output

### B) Ambiguous instructions
Flag vague terms:
- “as needed”, “periodically”, “where appropriate”, “timely”, “reasonable”
For each, ask for missing:
- frequency, SLA, threshold, owner

### C) Missing prerequisites
- Missing access/permissions
- Missing tools/forms/templates
- Dependencies on other SOPs not provided

### D) Responsibility gaps
- Steps without an owner (“someone should…”) flagged
- Approvals/exceptions without approver defined

### E) Contradictions
- Conflicting steps across sections
- Inconsistent terminology (“request” vs “ticket” vs “case”)

## Output schema (draft)
```json
{
  "type": "sop_validation",
  "scope": "",
  "prerequisites": [""],
  "steps": [{"step": 1, "action": "", "owner": "", "inputs": [""], "outputs": [""]}],
  "decisionPoints": [{"if": "", "then": "", "else": ""}],
  "ambiguities": [{"term": "", "quote": "", "missing": ""}],
  "responsibilityGaps": [{"where": "", "missing": ""}],
  "contradictions": [{"a": "", "b": "", "why": ""}],
  "findings": [{"severity": "high|medium|low", "message": "", "evidence": [{"page": 1, "quote": ""}]}]
}
```
