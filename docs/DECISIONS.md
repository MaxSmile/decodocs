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

## Constraints
- no public buckets
- no secrets in git
- no long-lived signed URLs
- Firestore is used for metadata/ledgers (e.g. docHash), but not required as the canonical file store

## Entitlements / Tiers (Product + Technical)
- 3 user types:
  - Anonymous = Firebase Anonymous Auth
  - Free = any non-anonymous Firebase Auth provider without an active subscription
  - Pro = non-anonymous + Stripe subscription active
- AI access is available to all tiers, but with limits:
  - Anonymous: 20k tokens per Firebase `uid`-session
  - Free: 40k tokens/day per `uid`
  - Pro: unlimited (until abuse policy is introduced)
- OCR/scanned PDFs require Pro (Free/Anonymous must not use a vision model)
- Pro includes 5GB storage hosted on Contabo VPS (custom storage)
- We store `docHash` metadata for all users in Firestore `docshashes` collection with **forever** retention (explicitly documented)

## Optional / Later
- wallet-based electronic signature is optional and not MVP
- blockchain timestamping/NFT proof is optional and not core
