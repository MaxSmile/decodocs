# Validation Criteria — Informational Document

Type ids (planned):
- `general_informational`
- `general_report_informational`

## Goal
Validate informational content for trustworthiness and usefulness:
- separate claims from evidence
- identify logic gaps and overreach
- detect missing context and uncertainty
- highlight unsupported conclusions

## What to extract (structured)
- Core thesis / key message
- Material claims (factual or quantitative)
- Evidence provided for each claim
- Source quality indicators (named source, date, method)
- Explicit assumptions
- Stated limitations / uncertainty
- Final recommendations or conclusions

## Validation checklist

### A) Claims vs evidence mapping
- Extract each material claim into `claims[]`
- Map supporting evidence snippets to each claim
- Flag claims with no supporting evidence

### B) Evidence quality
For each evidence item, assess whether it includes:
- source identity
- date/recency
- method/sample context (if statistical)
- direct relevance to the claim

### C) Logic and inference checks
- Detect leaps from correlation to causation
- Detect overgeneralization from narrow evidence
- Flag conclusions stronger than evidence supports

### D) Missing context / uncertainty
- Flag absent baseline/comparison context
- Flag key counterarguments not addressed
- Flag missing limitations/disclaimer language

### E) Internal consistency
- Detect contradictions between sections
- Detect changing definitions/terms for same concept

## Output schema (draft)
```json
{
  "type": "informational_document_validation",
  "thesis": "",
  "claims": [
    {
      "id": "c1",
      "claim": "",
      "category": "factual|quantitative|prediction|opinion",
      "evidence": [
        {
          "source": "",
          "quote": "",
          "page": 1,
          "quality": "strong|medium|weak"
        }
      ],
      "supportStatus": "supported|partially_supported|unsupported"
    }
  ],
  "logicGaps": [
    {
      "claimId": "c1",
      "issue": "",
      "whyItMatters": ""
    }
  ],
  "missingContext": [
    {
      "area": "",
      "missing": ""
    }
  ],
  "contradictions": [
    {
      "a": "",
      "b": "",
      "why": ""
    }
  ],
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
- strong recommendation with no evidence
- quantitative claim without source/date/method
- causal claim supported only by correlation
- contradictory conclusions in the same document

## Disclaimer
Informational analysis only, not professional advice.
