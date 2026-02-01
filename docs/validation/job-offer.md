# Validation Criteria — Job Offer / Offer Letter

Type id: `legal_job_offer`

## Goal
Help users validate job offers by surfacing:
- missing critical terms
- unclear or risky clauses (probation, termination, restraints, IP)
- inconsistencies between summary and detailed terms

## What to extract (structured)
- Employer entity details
- Role/title, location, start date
- Salary/compensation (base, bonuses, allowances)
- Superannuation/retirement contributions (if present)
- Hours, overtime, leave
- Probation period
- Notice periods (both sides)
- Termination grounds
- Confidentiality / IP assignment
- Restraint clauses (non-compete / non-solicit)
- Policies referenced (but not attached)

## Validation checklist

### A) Identity & basics
- Employer legal entity name present
- Candidate name present
- Role/title clear
- Start date stated

### B) Compensation clarity
- Base salary amount + pay frequency
- Bonus/commission conditions (if mentioned)
- Equity terms clear (if mentioned): vesting schedule, cliff, dilution notes

### C) Probation & termination
- Probation period stated (if used)
- Termination notice period both ways
- Termination for cause vs without cause described

### D) Restraints & IP
- Confidentiality obligations clear
- IP assignment scope clear (work product)
- Restraint clauses flagged if:
  - duration/region too broad or undefined
  - vague triggers ("any competitive activity")

### E) Working conditions
- Hours / flexibility
- Remote/hybrid expectations
- Leave entitlements referenced

### F) Missing attachments / policies
- If offer references policies/handbooks, flag as missing if not provided.

## Output schema (draft)
```json
{
  "type": "job_offer_validation",
  "role": {"title": "", "location": "", "startDate": ""},
  "employer": {"name": ""},
  "comp": {"base": "", "frequency": "", "bonus": "", "equity": ""},
  "termination": {"probation": "", "notice": "", "grounds": ""},
  "restraints": {"hasRestraint": null, "summary": ""},
  "policiesReferenced": [""],
  "findings": [{"severity": "high|medium|low", "code": "", "message": "", "evidence": [{"page": 1, "quote": ""}]}]
}
```

## Red flags (high severity)
- missing employer entity
- missing salary terms
- very broad restraint clause
- IP assignment that captures unrelated personal work (vague/too broad)
- policies referenced but not supplied

## Disclaimer
This is informational analysis, not legal advice.
