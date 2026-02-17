# DecoDocs API Documentation

## Overview

The DecoDocs API provides AI-powered document analysis services through Firebase Functions.

- It is primarily designed for the DecoDocs web/mobile apps.
- “External API” / MCP exposure may exist later, but for now the API is **internal-only**.

## Base URL

Production: `https://[PROJECT-ID].firebaseapp.com`
Development: `http://localhost:5001/[PROJECT-ID]/us-central1`

## Authentication

- API is **internal-only** for now (not a public developer platform).
- Auth is **Firebase Auth**.
- We prefer **Firebase Callable Functions** (ID token verified server-side) over API keys.

Tier behavior (high level):
- Free API calls operate on **extracted text** (no OCR / no vision model).
- Paid/Pro can upload PDFs for OCR / image recognition.

## Common Response Format

For callable functions, responses are function-specific but generally follow:

```json
{
  "ok": true,
  "...": "function-specific payload"
}
```

For denied/failed operations, functions either:
- return `ok: false` with structured fields like `code`, `message`, `requiredTier`, or
- throw Firebase callable errors (for invalid input/internal failures).

## Callable Functions

The production app uses Firebase callable functions (`httpsCallable`) rather than public REST `POST /...` routes.

### Core AI Callables

#### `analyzeText`
Performs primary document analysis.

Input:
- `docHash` (string, required)
- `stats` (object, required)
- `text` (object with `value`, required)
- `options` (object, optional)

Response shape:
```json
{
  "ok": true,
  "docHash": "sha256...",
  "result": {
    "plainExplanation": "...",
    "risks": []
  },
  "usage": {}
}
```

#### `explainSelection`
Explains selected text in plain language.

Input:
- `docHash` (string, optional)
- `selection` (string, required)
- `documentContext` (string, optional)

Response shape:
```json
{
  "ok": true,
  "explanation": {
    "plainExplanation": "...",
    "examples": []
  },
  "usage": {}
}
```

#### `highlightRisks`
Runs risk extraction over document text.

Input:
- `docHash` (string, optional)
- `documentText` (string, required)
- `documentType` (string, optional)

Response shape:
```json
{
  "ok": true,
  "risks": {
    "summary": {
      "totalRisks": 0,
      "overallRiskLevel": "low"
    },
    "items": []
  },
  "usage": {}
}
```

#### `translateToPlainEnglish`
Translates legal text into plain English.

Input:
- `docHash` (string, optional)
- `legalText` (string, required)

Response shape:
```json
{
  "ok": true,
  "translation": {
    "originalText": "...",
    "plainEnglishTranslation": "..."
  },
  "usage": {}
}
```

#### `analyzeByType`
Runs type-specific analysis using detected/overridden document type and validation criteria.

Input:
- `docHash` (string, required)
- `text` (string, required)

Response shape:
```json
{
  "ok": true,
  "effectiveTypeId": "legal_job_offer",
  "validationSlug": "job-offer",
  "validationSpec": {},
  "result": {
    "plainExplanation": "...",
    "extracted": {},
    "checks": []
  },
  "usage": {}
}
```

### Supporting Callables
- `preflightCheck`
- `getEntitlement`
- `detectDocumentType`
- `getDocumentTypeState`
- `saveDocTypeOverride`

### Legacy Note
- Older documentation and local mock mode may still reference REST-style paths such as `/explainSelection`.
- Canonical runtime contract for production is Firebase callable functions and `ok`-based responses.

## Rate Limits / Budgets

AI operations are budgeted by entitlement tier:

- Anonymous: 20,000 tokens per identity session
- Free: 40,000 tokens/day (UTC)
- Pro: no hard app-layer token cap (fair-use policy may apply)
- Business: Pro-capable runtime budget behavior plus team/org controls

Notes:
- OCR/scanned-document processing is gated to paid Pro-capable tiers.
- Budget enforcement is server-side in Functions; client-side tier claims are not trusted.

## Error Codes

Callable functions use Firebase `HttpsError` codes and/or structured denied responses.

Common codes:
- `invalid-argument`: malformed or missing input
- `unauthenticated`: user auth missing/invalid
- `permission-denied`: entitlement/authorization failure
- `resource-exhausted`: budget/rate limits exceeded
- `internal`: unexpected server error

## Usage Guidelines

### Best Practices

1. **Input Validation**: Always validate input before sending to the API
2. **Error Handling**: Implement robust error handling for all API calls
3. **Retry Logic**: Implement exponential backoff for failed requests
4. **Caching**: Cache responses when appropriate to reduce API calls
5. **Security**: Sanitize all inputs to prevent injection attacks

### Performance Tips

1. **Batch Requests**: Combine multiple operations when possible
2. **Efficient Payloads**: Send only necessary data
3. **Connection Reuse**: Reuse connections for multiple requests
4. **Response Parsing**: Parse responses efficiently

## Versioning

The API currently has no versioning scheme. Future versions will follow semantic versioning principles with version prefixes (e.g., `/v1/analyzeDocument`).
