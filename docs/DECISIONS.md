# Decisions

## Architecture
- hybrid architecture: client-heavy UI + server-authoritative security
- ReactJS web app hosted on Firebase as UI and gateway
- Firebase Auth for identity only
- Firebase Hosting for static content delivery
- VPS backend for AI, search, and background jobs
- object storage (S3-compatible) as canonical file store
- client-first decode: extract text in browser, send text to backend for AI, persist file only when needed

## Infra Management
- Ansible is the standard for VPS configuration and deployment
- Docker Compose as runtime standard
- one compose stack per logical service group

## Mobile
- Phase 1 mobile is WebView wrapper around the web app
- native features added only after clear product signals

## Product Positioning
- understanding is the product; signing is optional
- core model is Understand -> Manage -> Act for freelancers and SMBs
- clarity over complexity
- docs before signatures

## Landing CTA Framing
- secondary CTA on marketing entry points must be action-oriented and aligned with core workflows
- replaced "View Demo" copy with "Open Editor" to avoid passive/demo framing
- canonical secondary CTA target is `/edit/test-docs/offer.pdf` so users land in a real editing workflow

## Use-Case Routing for Founder Conversion Page
- `/use-cases/startup-founders/` is a dedicated, handcrafted SEO/conversion page (not rendered through the generic `[slug]` use-case template)
- generic use-case rendering remains in `web/src/pages/use-cases/[slug].astro` for all other personas
- route generation in `[slug].astro` explicitly excludes `startup-founders` to prevent route collisions and preserve tailored founder messaging

## Use-Case Routing for Procurement Conversion Page
- `/use-cases/procurement-teams/` is a dedicated, handcrafted SEO/conversion page (not rendered through the generic `[slug]` use-case template)
- this page broadens audience framing from procurement-only to procurement + operations + vendor management contract workflows
- route generation in `[slug].astro` explicitly excludes `procurement-teams` to prevent route collisions and preserve tailored copy

## Use-Case Routing for Freelancers & Agencies Page
- `/use-cases/freelancers-agencies/` is a dedicated, handcrafted SEO/conversion page (not rendered through the generic `[slug]` use-case template)
- page language prioritizes freelancer and agency business pain (scope, payment, IP, liability) over generic document features
- route generation in `[slug].astro` explicitly excludes `freelancers-agencies`

## Use-Case Routing for Small Business Owners Page
- `/use-cases/small-business-owners/` is a dedicated, handcrafted SEO/conversion page (not rendered through the generic `[slug]` use-case template)
- page language prioritizes owner/operator outcomes (cash flow, renewals, fees, operational risk)
- route generation in `[slug].astro` explicitly excludes `small-business-owners`

## Constraints
- no public buckets
- no secrets in git
- no long-lived signed URLs
- Firestore is used for metadata/ledgers (e.g. docHash), but not required as the canonical file store

## Hosting Canonical URL Policy
- Canonical public URL for the product is `https://decodocs.com`.
- Firebase default hostnames (`decodocs-site.web.app`, `decodocs-site.firebaseapp.com`) are treated as non-canonical entry points.
- In the current single-site Firebase Hosting setup, host-conditional 301 rules are not used for this because they are not practical on free-tier/simple hosting without introducing separate hosting-site/domain routing complexity.
- Decision: enforce canonicalization with a lightweight client-side redirect script in `web/src/layouts/MainLayout.astro` that forwards Firebase-host requests to `https://decodocs.com` while preserving path/query/hash.

## Entitlements / Tiers (Product + Technical)
- Core runtime tiers:
  - Anonymous = Firebase Anonymous Auth
  - Free = any non-anonymous Firebase Auth provider without an active subscription
  - Pro-capable paid tier = active paid subscription (includes Pro and Business behavior in current runtime path)
- Product tiers:
  - Pro = non-anonymous + active Pro subscription
  - Business = paid team tier (currently mapped to Pro-capable runtime behavior)
- Stripe implementation principle: **don’t overcomplicate state mapping**.
  - Stripe webhooks are authoritative.
  - We set user Pro state on subscription activation webhook events.
  - We revert to Free on subscription state-change webhook events.
  - Backend always enforces entitlement server-side (tier is never trusted from the client).
- AI access is available to all tiers, but with limits:
  - Anonymous: **20k tokens per Firebase uid** (same uid == same auth session)
  - Free: **40k tokens/day per uid**
  - Pro-capable paid tiers (Pro/Business): unlimited in app-layer budget gate (until abuse policy is introduced)
- OCR/scanned PDFs require Pro (Free/Anonymous must not use a vision model)
- Pro includes **5GB** storage hosted on Contabo VPS (custom storage)
- We store `docHash` metadata for all users in Firestore `docshashes` collection with **forever** retention (explicitly documented)

## Identity Linking (Auth)
- Firebase Auth providers supported: anonymous, email, google, apple, microsoft
- Linking is universal: users may link multiple providers over time.
- We treat all provider identities as aliases of a **puid (primary user identifier)**, resolved server-side.
- All counting and enforcement is per **puid** (usage, docHash, Stripe entitlement, storage quota).
- Today, `puid == uid`; alias expansion is incremental.
- puid is **not exposed** to the client UI; it is an internal Functions/backend concept.
- See: docs/AUTH_LINKING.md

## Optional / Later
- wallet-based electronic signature is optional and not MVP
- blockchain timestamping/NFT proof is optional and not core
