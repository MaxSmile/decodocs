# Validation Criteria — Decision / Evaluation Document

Type ids (planned):
- `business_decision_memo`
- `business_option_evaluation`

## Goal
Stress-test decision documents before action:
- make assumptions explicit
- surface missing data
- evaluate option tradeoffs consistently
- detect recommendation bias and weak justification

## What to extract (structured)
- Decision question / objective
- Options considered
- Decision criteria
- Assumptions
- Evidence/data used
- Risks and mitigations
- Recommended option and rationale
- Implementation constraints and dependencies

## Validation checklist

### A) Decision framing quality
- Decision objective is explicit and measurable
- Scope and constraints are defined
- Success criteria are stated

### B) Option completeness
- At least two viable options assessed (or clear reason if not)
- "Do nothing" baseline included or justified as excluded
- Option descriptions are comparable (same level of detail)

### C) Criteria and weighting
- Criteria are explicit (cost, risk, timeline, impact, etc.)
- Relative weighting or priority is stated
- Flag hidden criteria introduced only in conclusion

### D) Assumptions and data sufficiency
- Extract assumptions and confidence level
- Flag assumptions lacking evidence
- Flag material missing data that could change outcome

### E) Risk realism
- Risks include likelihood + impact framing
- Mitigations are specific and assigned to owners
- Flag one-sided optimism (benefits listed, risks shallow)

### F) Recommendation integrity
- Recommended option aligns with scored criteria
- Flag recommendation that contradicts analysis table/text
- Flag irreversible decisions without fallback/rollback plan

## Output schema (draft)
```json
{
  "type": "decision_evaluation_validation",
  "decision": {
    "question": "",
    "objective": "",
    "constraints": [""]
  },
  "options": [
    {
      "id": "opt1",
      "name": "",
      "summary": "",
      "pros": [""],
      "cons": [""],
      "risks": [{"risk": "", "likelihood": "low|medium|high", "impact": "low|medium|high"}]
    }
  ],
  "criteria": [
    {
      "criterion": "",
      "weight": null,
      "scores": [{"optionId": "opt1", "score": null, "justification": ""}]
    }
  ],
  "assumptions": [{"assumption": "", "confidence": "low|medium|high", "evidence": ""}],
  "missingData": [{"dataNeeded": "", "why": "", "impactOnDecision": ""}],
  "recommendation": {
    "optionId": "opt1",
    "rationale": "",
    "fallbackPlan": ""
  },
  "findings": [
    {
      "severity": "high|medium|low",
      "message": "",
      "evidence": [{"page": 1, "quote": ""}]
    }
  ]
}
```

## Red flags (high severity)
- recommendation does not match evaluation results
- critical assumptions have no supporting data
- only one option considered without justification
- no fallback for high-impact irreversible decision

## Disclaimer
Informational analysis only, not financial/legal/operational advice.
