# DecoDocs — Stripe (Webhook + Firestore Admin Config)

This document defines how Stripe configuration is supplied and how subscription state is written into Firestore.

## Principles
- Stripe subscription state is **webhook-authoritative**.
- The client UI never decides Pro state.
- Stripe secrets are **not** committed in `.env` or git.
- Stripe config is stored in Firestore under an admin-controlled document.
- Canonical reference for admin config docs + security model: `docs/ADMIN_CONFIG.md`

## Current implementation (important)
- Entitlement is currently **binary** in Firestore: `users/{puid}.subscription.isPro`.
- `isPro` is set from Stripe status by one rule: only `status === "active"` maps to `isPro=true`.
- `trialing`, `past_due`, `canceled`, `unpaid`, `incomplete` map to `isPro=false`.
- Checkout accepts `plan: "pro" | "business"` and `billing: "monthly" | "annual"`.
- Current webhook write model does **not** persist a separate `planId`; both paid plans currently converge into the same `isPro` entitlement flag.

## Firestore admin config

### Location
- Collection: `admin`
- Document: `stripe`

### Fields used by runtime
- `apiKey`: string (e.g. `sk_test_...`) **server-side only, required**
- `productIds`: object
  - e.g. `{ "pro": "prod_...", "business": "prod_..." }`
  - used by tests for Stripe product verification
- `priceIds`: object
  - e.g. `{ "pro_monthly": "price_...", "pro_annual": "price_...", "business_monthly": "price_...", "business_annual": "price_..." }`
  - `pro_monthly` and `pro_annual` are required for Pro checkout
  - `business_monthly` / `business_annual` are required when Business checkout is enabled
- `webhookSecret`: string (Stripe signature secret `whsec_...`) **server-side only**
  - required for `POST /stripeWebhook`
- `mockWebhookSecret`: string
  - required for `POST /stripeWebhookMock` outside emulators
- `publishableKey`: string (e.g. `pk_test_...`)
  - not used by Functions runtime, but required by integration tests for config validation

Checkout/Portal URLs (recommended):
- `successUrl`: string (e.g. `https://decodocs.com/profile?stripe=success`)
- `cancelUrl`: string (e.g. `https://decodocs.com/pricing?stripe=cancel`)
- `portalReturnUrl`: string (e.g. `https://decodocs.com/profile`)

> Note: access to `admin/stripe` must be restricted (Firestore rules) so only admins / Functions can read it.

## User subscription state storage

### Location (MVP)
- Collection: `users`
- Document: `{puid}` (currently puid may equal Firebase `uid` until puid-alias mapping is implemented)

### Fields
- `subscription`:
  - `provider`: "stripe"
  - `customerId`: string
  - `subscriptionId`: string
  - `status`: string (whatever Stripe sends)
  - `isPro`: boolean
  - `updatedAt`: server timestamp

## Webhook handling

### Real webhook endpoint
Firebase Functions endpoint:
- `POST /stripeWebhook`

Behavior:
- Verifies Stripe signature using `admin/stripe.webhookSecret` (`whsec_...`).
- Updates `users/{puid}.subscription.*` and `isPro`.
- We treat Stripe as authoritative: if Stripe says inactive → we set `isPro=false`.

Checkout callable (`stripeCreateCheckoutSession`) accepts:
- `plan`: `pro | business`
- `billing`: `monthly | annual`
- writes Checkout metadata: `firebaseUid`, `puid`, `plan`, `billing`
- writes Subscription metadata: `firebaseUid`, `puid`, `plan`

Events handled (MVP):
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `checkout.session.completed` (captures `customerId`/`subscriptionId` early)

### Event → puid mapping
We map events to users using metadata we attach during Checkout Session creation:
- subscription metadata: `metadata.puid` and `metadata.firebaseUid`
- checkout session: `client_reference_id = puid` and `metadata.puid/firebaseUid`

## Mock webhook (for development)

We provide a mock webhook endpoint to simulate Stripe events without Stripe configured.

Endpoint (Firebase Functions):
- `POST /stripeWebhookMock`

Payload shape (minimal):
```json
{
  "type": "customer.subscription.updated",
  "data": {
    "object": {
      "status": "active",
      "customer": "cus_...",
      "id": "sub_...",
      "metadata": {
        "firebaseUid": "<uid>"
      }
    }
  }
}
```

Rules:
- In emulators: endpoint is open for convenience.
- In non-emulator: requires `x-mock-secret` header matching `admin/stripe.mockWebhookSecret`.

## Integration test coverage (`functions/test/stripe.test.js`)

The Stripe integration suite validates real Stripe test-mode behavior and deployed webhook behavior.

Config load order used by tests:
1. Firestore `admin/stripe` (requires ADC via `gcloud auth application-default login`)
2. Local fallback `functions/test/.stripe-test-config.json`

What tests currently enforce:
- `apiKey` starts with `sk_test_`
- `publishableKey` starts with `pk_test_`
- `productIds.pro`, `priceIds.pro_monthly`, `priceIds.pro_annual` are present and valid ids
- `successUrl` includes `/profile?stripe=success`
- `cancelUrl` includes `/pricing?stripe=cancel`
- `portalReturnUrl` includes `/profile`
- `mockWebhookSecret` is present
- Stripe API connectivity in test mode (`livemode === false`)
- Pro product/prices are active and recurring; annual is cheaper per-month than monthly
- Checkout sessions can be created for Pro monthly/annual
- Mock webhook endpoint security and status transitions (`active` => `isPro=true`, `canceled/past_due` => `isPro=false`)

For webhook mock tests, set:
- `FUNCTIONS_URL=https://<your-cloud-run-base-url>`

Helper script:
- from deployment repo root: `node functions/test/fetch-stripe-config.js`
- or from `functions/`: `node test/fetch-stripe-config.js`
- fetches `admin/stripe` via deployed `getDocByPath` and writes `functions/test/.stripe-test-config.json`
