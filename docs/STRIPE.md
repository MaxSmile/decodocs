# DecoDocs — Stripe (Webhook + Firestore Admin Config)

This document defines how Stripe configuration is supplied and how subscription state is written into Firestore.

## Principles
- Stripe subscription state is **webhook-authoritative**.
- The client UI never decides Pro state.
- Stripe secrets are **not** committed in `.env` or git.
- Stripe config is stored in Firestore under an admin-controlled document.

## Firestore admin config

### Location
- Collection: `admin`
- Document: `stripe`

### Fields (expected)
- `apiKey`: string (e.g. `sk_test_...`) **server-side only**
- `productIds`: object
  - e.g. `{ "pro": "prod_..." }`
- `priceIds`: object
  - e.g. `{ "pro_monthly": "price_...", "pro_annual": "price_..." }`
- `webhookSecret`: string (Stripe signature secret `whsec_...`) **server-side only**
- `mockWebhookSecret`: string (optional; protects mock webhook in non-emulator)

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

### Webhook behavior
- On subscription activation / state change events:
  - Functions update `users/{puid}.subscription.*`
  - `isPro=true` when the subscription is active
  - `isPro=false` when Stripe reports a non-active state

### Event → puid mapping
For now, webhook payload must contain the user identity, typically via Stripe metadata:
- `metadata.firebaseUid` (or later `metadata.puid`)

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
