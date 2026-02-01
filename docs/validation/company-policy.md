# Validation Criteria — Company Policy (IT / Security / HR / Ethics / Privacy)

Type ids (examples):
- `policy_privacy`
- `policy_terms` (website terms; not internal policy)
- governance policy types (planned)

## Goal
Turn “formal but unread” policy documents into actionable governance:
- extract mandatory vs optional rules
- detect vague language
- find conflicts
- flag missing ownership/enforcement
- optionally check alignment with provided standards/laws

## What to extract (structured)
- Scope (who/what is covered)
- Definitions/glossary terms
- Mandatory rules (must/must-not)
- Optional guidance (should/may)
- Exceptions/waivers
- Enforcement mechanism
- Owners (role/team)
- Review cadence

## Validation checklist

### A) Mandatory vs optional rules
- Extract MUST/MUST-NOT/REQUIRED/PROHIBITED into `mandatoryRules[]`
- Extract SHOULD/MAY/RECOMMENDED into `optionalRules[]`
- Extract exception language (unless/except/with approval)

### B) Vague language
Flag terms like:
- “appropriate”, “reasonable”, “as needed”, “periodically”, “timely”, “where possible”
For each, request missing specificity:
- threshold, timeframe, owner, required evidence

### C) Conflicts and contradictions
- Identify conflicting requirements across sections
- Detect inconsistent terminology (same concept, different names)
- Highlight exception clauses that silently override core rules

### D) Ownership and enforcement gaps
Flag if missing:
- accountable role/team per policy area
- enforcement mechanism (what happens on breach)
- escalation path (who approves exceptions)
- review cadence/version control

### E) Alignment with standards/laws (only if provided)
- If a standard/law doc is provided, map policy rules to control requirements
- Flag missing controls / weak controls
- **Do not** invent external compliance requirements

## Output schema (draft)
```json
{
  "type": "company_policy_validation",
  "scope": {"appliesTo": "", "systems": ""},
  "mandatoryRules": [{"rule": "", "who": "", "when": "", "evidence": ""}],
  "optionalRules": [{"rule": "", "who": "", "when": ""}],
  "exceptions": [{"rule": "", "approval": ""}],
  "vagueLanguage": [{"term": "", "quote": "", "whyItMatters": ""}],
  "conflicts": [{"a": "", "b": "", "why": ""}],
  "ownershipGaps": [{"area": "", "missing": ""}],
  "enforcementGaps": [{"missing": ""}],
  "findings": [{"severity": "high|medium|low", "message": "", "evidence": [{"page": 1, "quote": ""}]}]
}
```

## Red flags (high severity)
- no ownership/accountability
- no enforcement mechanism
- vague requirements without thresholds
- conflicts that create impossible compliance

## Disclaimer
Informational analysis, not legal advice.
