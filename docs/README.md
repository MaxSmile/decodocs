# DecoDocs Documentation Hub

Canonical entrypoint for product and technical documentation.

## How To Read This Folder

Document classes used here:
- `canonical` - source of truth for ongoing behavior and decisions.
- `runbook` - operational procedure docs.
- `working` - active planning/checklist docs that may change frequently.

When canonical and working docs differ, canonical wins.

## Canonical Core

- Product definition: [PRODUCT.md](PRODUCT.md)
- Current product/platform status: [STATUS_SUMMARY.md](STATUS_SUMMARY.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- API and callable contracts: [API.md](API.md)
- Security posture: [SECURITY.md](SECURITY.md)
- Terminology and domain language: [TERMINOLOGY.md](TERMINOLOGY.md)

## Delivery And Operations

- Development workflow: [DEVELOPMENT.md](DEVELOPMENT.md)
- Deployment runbook: [DEPLOYMENT.md](DEPLOYMENT.md)
- Testing strategy: [TESTING.md](TESTING.md)
- Visual regression checklist: [VISUAL_REGRESSION_CHECKLIST.md](VISUAL_REGRESSION_CHECKLIST.md)

## Entitlements And Commercial Logic

- Subscription limits and enforcement model: [SUBSCRIPTION_TIERS.md](SUBSCRIPTION_TIERS.md)
- Permanent policy/decision record: [DECISIONS.md](DECISIONS.md)
- Stripe/billing integration details: [STRIPE.md](STRIPE.md)

## Feature Specs

- Functional feature inventory: [FEATURES.md](FEATURES.md)
- Use-case positioning and mapping: [use-cases.md](use-cases.md)
- User journey mapping: [USER_FLOWS.md](USER_FLOWS.md)
- Open vs upload storage modes: [OPEN_VS_UPLOAD_SPEC.md](OPEN_VS_UPLOAD_SPEC.md)
- Document type architecture: [DOCUMENT_TYPE_SYSTEM.md](DOCUMENT_TYPE_SYSTEM.md)
- Classification implementation: [CLASSIFICATIONS_INTEGRATION.md](CLASSIFICATIONS_INTEGRATION.md)
- Validation type specs: [validation/README.md](validation/README.md)
- Email-to-sign flow: [EMAIL_TO_SIGN_FLOW.md](EMAIL_TO_SIGN_FLOW.md)
- AI signature studio: [AI_SIGNATURE_STUDIO_FLOW.md](AI_SIGNATURE_STUDIO_FLOW.md)
- Cloud integrations: [CLOUD_INTEGRATIONS.md](CLOUD_INTEGRATIONS.md)
- Mobile strategy/plan: [MOBILE_APPS.md](MOBILE_APPS.md)

## Auth And Identity

- Authentication UX principles: [AUTH_UX.md](AUTH_UX.md)
- Provider linking flows: [AUTH_LINKING.md](AUTH_LINKING.md)
- Email/password details: [AUTH_EMAIL_PASSWORD.md](AUTH_EMAIL_PASSWORD.md)
- Google One Tap details: [AUTH_GOOGLE_ONE_TAP.md](AUTH_GOOGLE_ONE_TAP.md)

## Planning Docs (Working)

- Product roadmap: [ROADMAP.md](ROADMAP.md)
- MVP scope record: [MVP.md](MVP.md)
- Admin config shape/flows: [ADMIN_CONFIG.md](ADMIN_CONFIG.md)

## Ownership And Update Rules

- Update canonical docs in the same change that alters behavior.
- Keep planning notes (`working`) concise and linked back to canonical docs.
- Move long-lived decisions from working docs into canonical docs and/or `DECISIONS.md`.

Related:
- Root documentation governance: `../../docs/README.md`
- Nested-repo engineering tasks: `../TODO.md`
