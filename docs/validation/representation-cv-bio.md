# Validation Criteria — Representation Document (CV / Bio)

Type ids:
- `general_resume_cv`
- `general_professional_bio` (planned)

## Goal
Check representation documents for credibility and completeness:
- detect inconsistencies across timeline and claims
- identify unsupported achievements
- flag material omissions and ambiguity
- improve verifiability of profile content

## What to extract (structured)
- Candidate identity and contact fields present
- Role history (title, company, dates)
- Education and certifications (institution, dates)
- Skills and tools claimed
- Quantified achievements
- External links/portfolio references

## Validation checklist

### A) Timeline consistency
- Employment dates are chronologically coherent
- No unexplained overlaps or impossible sequences
- Gaps are flagged (not auto-judged as negative)

### B) Claim specificity and evidence
- Achievement claims are specific (scope, metric, outcome)
- Quantified claims include baseline/timeframe where possible
- Flag vague superlatives without supporting detail

### C) Role-content alignment
- Skills listed align with project/role evidence
- Seniority claims align with years/scope described
- Flag title inflation signals (high title, low evidence)

### D) Education and credential integrity
- Degree/certification entries include institution and date
- Flag missing completion status where ambiguous
- Flag inconsistent naming of same credential

### E) Omission and clarity checks
Flag missing core profile elements:
- contact or location context (if expected)
- recent role end/start clarity
- links to portfolio/public work when claims depend on them

## Output schema (draft)
```json
{
  "type": "representation_cv_bio_validation",
  "profile": {
    "name": "",
    "headline": "",
    "contactPresent": true
  },
  "experience": [
    {
      "role": "",
      "organization": "",
      "start": "",
      "end": "",
      "achievements": [
        {
          "claim": "",
          "metric": "",
          "evidenceStatus": "strong|medium|weak|missing"
        }
      ]
    }
  ],
  "education": [
    {
      "credential": "",
      "institution": "",
      "date": "",
      "status": "completed|in_progress|unknown"
    }
  ],
  "skills": [""],
  "timelineIssues": [{"issue": "", "where": ""}],
  "consistencyIssues": [{"issue": "", "where": ""}],
  "omissions": [{"missing": "", "whyItMatters": ""}],
  "findings": [
    {
      "severity": "high|medium|low",
      "message": "",
      "evidence": [{"section": "", "quote": ""}]
    }
  ]
}
```

## Red flags (high severity)
- materially conflicting dates across roles/education
- major achievement claims with no context or evidence
- credentials presented ambiguously as completed when unclear
- duplicated or contradictory role histories

## Disclaimer
Informational analysis only; verification requires independent checks.
