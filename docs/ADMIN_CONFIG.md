# Admin Config (Firestore)

DecoDocs stores small, admin-managed configuration documents in Firestore under the `admin/*` collection.

These docs are edited via the admin portal (staging):

- https://decodocs-admin.web.app

## Security model

- **Client-side gating (UX):** the admin portal UI only allows access if the signed-in email ends with `@snapsign.com.au`.
- **Server-side enforcement (source of truth):** Firestore Rules (and any future admin APIs) must enforce:
  - `request.auth.token.email` endsWith `@snapsign.com.au`

This prevents non-admin users from reading/writing `admin/*` even if they tamper with the frontend.

## Documents

### `admin/stripe`

Used by Stripe webhook processing and plan lookups.

Suggested fields:

```json
{
  "live": {
    "productId": "prod_...",
    "priceMonthlyId": "price_...",
    "priceYearlyId": "price_..."
  },
  "webhookSecret": "whsec_...",
  "mockWebhookSecret": "dev_only_shared_secret",
  "updatedAt": "<serverTimestamp>"
}
```

### `admin/plans`

Plan entitlement constants.

Suggested fields:

```json
{
  "free": {
    "maxPages": 25,
    "dailyCalls": 10,
    "ocrEnabled": false
  },
  "pro": {
    "maxPages": 200,
    "dailyCalls": 200,
    "ocrEnabled": true
  },
  "updatedAt": "<serverTimestamp>"
}
```

### `admin/flags`

Feature flags for turning experimental capabilities on/off.

Suggested fields:

```json
{
  "enableOcr": false,
  "enableTypeSpecificAnalysis": true,
  "updatedAt": "<serverTimestamp>"
}
```

### `admin/policies`

Usage policies / rate-limit constants.

Suggested fields:

```json
{
  "rateLimit": {
    "perMinute": 30
  },
  "updatedAt": "<serverTimestamp>"
}
```

## Notes

- v1 uses a **JSON editor** in the admin portal; schema validation is minimal.
- Prefer keeping these docs **small and stable**.
- If/when configs grow, add explicit schema validation in Cloud Functions and/or move to a typed UI.
