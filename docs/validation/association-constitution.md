# Validation Criteria — Associations Constitution / Charter / Bylaws

Type id: `governance_association_constitution` (planned)

## Goal
Surface hidden power structures in “formal” governance documents:
- membership and expulsion power
- voting rules and quorum traps
- amendment mechanisms
- board vs members authority conflicts
- missing dispute/dissolution clauses
- silent areas (finance control, asset ownership)

## What to extract (structured)
- Membership classes + eligibility
- Admission/removal/expulsion procedures
- Member voting rights + meeting rules
- Quorum rules
- Board powers + delegation
- Amendment procedure
- Dispute resolution process
- Dissolution/winding up process
- Finance controls + asset ownership statements

## Validation checklist

### A) Membership vs expulsion power
- Criteria for membership clear
- Grounds for expulsion clear
- Procedural fairness: notice, right to respond, appeal
- Flag expulsion power without process

### B) Voting and quorum traps
- Voting rights per member class
- Quorum definition and how it can be met/blocked
- Proxy voting rules
- Special resolution thresholds
- Chair casting vote rules

### C) Amendment mechanism
- Who can propose amendments
- Notice period
- Required majority
- Flag if board can amend core rules unilaterally

### D) Authority conflicts
- Map board powers vs member powers
- Flag contradictory clauses or unclear precedence

### E) Missing clauses / silent areas
Flag if missing or unclear:
- dispute resolution / internal appeals
- dissolution / asset distribution
- finance controls (approvals, dual sign, audit)
- asset ownership / IP ownership

## Output schema (draft)
```json
{
  "type": "association_constitution_validation",
  "membership": {"classes": [], "expulsion": ""},
  "voting": {"quorum": "", "proxy": "", "thresholds": ""},
  "powers": {"board": [], "members": []},
  "amendment": {"who": "", "notice": "", "threshold": ""},
  "dispute": {"exists": null, "summary": ""},
  "dissolution": {"exists": null, "summary": ""},
  "silentAreas": [""],
  "findings": [{"severity": "high|medium|low", "message": "", "evidence": [{"page": 1, "quote": ""}]}]
}
```

## Red flags (high severity)
- expulsion without process/appeal
- quorum/voting rules enabling capture by a small group
- board can amend core constitution without member vote
- missing dissolution clause
