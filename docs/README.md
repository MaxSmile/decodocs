# DecoDocs Documentation

Canonical docs for product, architecture, auth, tiers, and deployment.

## Start Here
- Product context: [PRODUCT.md](PRODUCT.md)
- Current status: [STATUS_SUMMARY.md](STATUS_SUMMARY.md)
- Architecture: [ARCHITECTURE.md](ARCHITECTURE.md)
- API surface: [API.md](API.md)
- Deployment: [DEPLOYMENT.md](DEPLOYMENT.md)

## Entitlements and AI Budgets
Source of truth:
- [SUBSCRIPTION_TIERS.md](SUBSCRIPTION_TIERS.md)
- [DECISIONS.md](DECISIONS.md)

Current budget model:
- Anonymous: 20,000 tokens per session identity
- Free: 40,000 tokens/day (UTC)
- Pro: unlimited in app-layer budget enforcement (fair-use policy may apply)
- Business: Pro-capable tier + team/billing features (runtime may currently map to Pro capability until dedicated Business branching is finalized)

## Authentication (Current, Not Planned)
Auth is already active in production:
- Firebase Auth providers: anonymous, email/password, Google, Apple, Microsoft
- Anonymous-first flow with provider linking
- Server-side entitlement enforcement

Related docs:
- [AUTH_LINKING.md](AUTH_LINKING.md)
- [AUTH_UX.md](AUTH_UX.md)
- [AUTH_EMAIL_PASSWORD.md](AUTH_EMAIL_PASSWORD.md)
- [AUTH_GOOGLE_ONE_TAP.md](AUTH_GOOGLE_ONE_TAP.md)

## Storage Mode
- Open mode and upload mode behavior: [OPEN_VS_UPLOAD_SPEC.md](OPEN_VS_UPLOAD_SPEC.md)

## Other Specs
- Cloud integrations: [CLOUD_INTEGRATIONS.md](CLOUD_INTEGRATIONS.md)
- Document typing and validation: [DOCUMENT_TYPE_SYSTEM.md](DOCUMENT_TYPE_SYSTEM.md), [CLASSIFICATIONS_INTEGRATION.md](CLASSIFICATIONS_INTEGRATION.md), [validation/README.md](validation/README.md)
- Prompt pack contract: each `typeId` must have `docs/prompts/types/<typeId>.mdx` and inherit from `docs/prompts/GENERAL_DOC_TYPE.mdx` (see Document Type System + Classifications Integration)
- Email-to-sign: [EMAIL_TO_SIGN_FLOW.md](EMAIL_TO_SIGN_FLOW.md)
- AI signature studio: [AI_SIGNATURE_STUDIO_FLOW.md](AI_SIGNATURE_STUDIO_FLOW.md)
