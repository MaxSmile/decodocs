# Product

## What DecoDocs Is

DecoDocs is an AI-powered document workspace for
**freelancers and small business owners**.

It helps users:
- understand documents
- manage them over time
- share, sign, and act on them confidently

DecoDocs is not just about reading documents.
It is about **running a business with documents**.

---

## The Core Problem

Freelancers and SMBs deal with documents constantly:
- contracts
- invoices
- proposals
- policies
- agreements

Their real problems are:
- "I'm not sure what this really means"
- "I don't know if this is risky"
- "I don't want to make a mistake"
- "I need to send this and get it signed"
- "I need to find this again later"

Using multiple tools increases confusion and risk.

DecoDocs brings these needs into **one place**.

---

## Core Model: Understand -> Manage -> Act

### Understand (Decode)
- explain documents in plain language
- translate when needed
- highlight risks and obligations
- catch mistakes and inconsistencies
- clarify unclear sections
- suggest improvements

Understanding reduces uncertainty.

---

### Manage (Own the Document)
- store documents securely
- keep explanations and notes attached
- organize by client or project
- search by meaning
- preserve context over time
- generate invoices and receipts
- templates for common agreements
- add watermarks when needed

Management prevents chaos and loss of knowledge.

---

### Act (Do Business)
- share documents with clients
- send for signature
- sign documents
- track status and (optionally) saved documents
- keep signed versions and proof
- set reminders for deadlines and payments

Action turns understanding into revenue and protection.

---

## What DecoDocs Is NOT

- not just an e-signature tool
- not legal advice
- not an enterprise compliance platform
- not a document dumping ground
- not unlimited free document processing

DecoDocs is **practical, clarity-first, and business-oriented**.

---

## Target Users

Initial focus:
- freelancers
- consultants
- small business owners
- founders

These users need:
- confidence
- speed
- simplicity
- fewer tools, not more

---

## Product Principles

- understanding is the foundation
- managing documents is essential
- acting on documents is the payoff
- reduce cognitive load
- keep workflows human-readable
- prefer clarity over automation theater

If a feature does not help users
**understand, manage, or act**, it does not belong.

---

## Feature Surfaces (Secondary)

Features show up in multiple places, but they are never the first door:
- inside the app
- on `/features` (secondary, optional)
- inside blog posts
- in tooltips and onboarding

---

## Site Structure (Recommended)

- `/` -> main positioning
- `/understand-contracts`
- `/explain-documents`
- `/find-risky-clauses`
- `/share-and-sign`
- `/manage-documents`
- `/pricing`

Each page has:
1. one problem
2. one promise
3. one primary CTA (decode/upload)

Home CTA policy:
- keep the primary hero CTA focused on decode/upload
- when a secondary CTA is present, use action copy (`Open Editor`) and route to `/edit/test-docs/offer.pdf`
- avoid "View Demo" framing because it implies passive viewing instead of real workflow entry

## Startup Founders Use Case Page Blueprint (2026-02-19)

Canonical route:
- `/use-cases/startup-founders/`

Purpose:
- conversion-focused founder page for decision-critical agreement review
- position DecoDocs as clarity + risk identification before signature, not legal advice
- speak to fundraising time pressure and irreversible downside

Required section sequence:
1. Hero (2-column): clear value prop + 3 micro-benefits + primary CTA (`Upload Your Document`) + secondary CTA (`See Example Breakdown`)
2. `Why It Matters`: emotional pain framing (control/dilution/hidden obligations/time pressure)
3. `How It Works`: 4 explicit steps (Upload, AI Breakdown, Risk Highlights, Clear Summary & Shareable Report)
4. `Common Documents`: expandable cards with one pain sentence and one outcome sentence per document
5. `For Startup Founders`: before/after comparison + outcomes list
6. `Before You Sign`: privacy/security assurances + final CTA (`Analyze My Document`) + FAQ

SEO constraints:
- H1 must include "Decode" or "Understand" and "Investor Agreements" or "Term Sheets"
- Use H2 headings: `How It Works`, `For Startup Founders`, `Common Documents`, `Why It Matters`, `Before You Sign`
- Meta description target:
  - "Understand term sheets, SAFE agreements and investor contracts before signing. Upload your document and get a clear risk breakdown in minutes."
- Include FAQ schema covering:
  - Can DecoDocs replace a lawyer?
  - Is my document secure?
  - What file types are supported?
- Include internal links to `/`, `/uses-cases`, and `/pricing`

Implementation notes:
- dedicated page source: `web/src/pages/use-cases/startup-founders.astro`
- keep generic use-case route for other personas only: `web/src/pages/use-cases/[slug].astro`

## Procurement Teams Use Case Page Blueprint (2026-02-19)

Canonical route:
- `/use-cases/procurement-teams/`

Audience coverage:
- procurement and sourcing managers
- operations managers
- contract administrators
- finance / accounts payable reviewers
- project managers and vendor/partner managers
- small business owners reviewing vendor contracts

Purpose:
- reposition "procurement" as a broader cross-functional contract-review workflow
- make business consequence explicit (cost, deadlines, renewals, penalties, liability)
- increase conversion by mapping pain -> mechanism -> outcome in one page

Required section sequence:
1. Hero with SEO-aligned H1, 3 micro-benefits, primary CTA (`Upload Contract to Understand`), and secondary CTA (`See Example Output`)
2. `Why Contracts Slow Your Team Down` pain framing with emotional payoff
3. `How It Works - Simple, Fast, Transparent` with 4 steps and explicit outcome line per step
4. `Common Contract Scenarios Your Team Will Recognize` expandable scenario cards
5. `Before and After DecoDocs` two-column contrast
6. `Benefits for Procurement, Operations, and Vendor Teams` outcome bullets
7. `Common Questions Teams Ask` objection handling
8. `Trusted by Business Teams` credibility block
9. Final CTA section with upload action and first-review reassurance

SEO constraints:
- H1 must include "contract review" or "contract analysis"
- include role language in section headers (`teams`, `procurement`, `operations`)
- meta description target:
  - "Speed up vendor contract review with DecoDocs. Understand risks, obligations, renewals and penalties before signing. Ideal for procurement, operations and vendor teams."
- include JSON-LD: FAQ, Breadcrumb, and example output (`CreativeWork`)
- include internal links to `/`, `/pricing`, and `/uses-cases`

Implementation notes:
- dedicated page source: `web/src/pages/use-cases/procurement-teams.astro`
- exclude slug from dynamic route generation in `web/src/pages/use-cases/[slug].astro`

## Freelancers & Agencies Use Case Page Blueprint (2026-02-19)

Canonical route:
- `/use-cases/freelancers-agencies/`

Audience coverage:
- freelancers and consultants
- boutique agencies and studios
- client-service delivery teams

Purpose:
- speak in freelancer/agency language (scope creep, revisions, payment terms, IP ownership, liability)
- map contract risk directly to margin, delivery pressure, and cash-flow reality
- increase conversion by making the page feel immediately recognizable to independent service teams

Required section sequence:
1. Hero with practical freelancer promise, micro-benefits, and immediate upload CTA
2. Pain section focused on scope creep, payment delay risk, and IP ambiguity
3. 4-step workflow with explicit outcomes per step
4. Real scenario cards (SOW, retainers, revisions, indemnity, subcontracting, payment terms)
5. Role-fit section for freelancers/agencies/studios
6. Risk signal section (revision caps, IP transfer, liability asymmetry, payment windows)
7. Before/after comparison + outcomes list
8. FAQ + credibility + final CTA

SEO constraints:
- H1 should include "contract review" and audience phrasing (freelancers/agencies)
- include JSON-LD: FAQ, Breadcrumb, and example-output CreativeWork
- include internal links to `/`, `/pricing`, and `/uses-cases`

Implementation notes:
- dedicated page source: `web/src/pages/use-cases/freelancers-agencies.astro`
- exclude slug from dynamic route generation in `web/src/pages/use-cases/[slug].astro`

## Small Business Owners Use Case Page Blueprint (2026-02-19)

Canonical route:
- `/use-cases/small-business-owners/`

Audience coverage:
- owner-operators
- lean SMB leadership teams
- businesses handling supplier/lease/service/finance contracts without in-house legal staff

Purpose:
- use owner language (cash flow, margin pressure, renewal surprise, operational exposure)
- convert by connecting contract terms to direct business outcomes
- provide a practical pre-signature risk workflow for real operating conditions

Required section sequence:
1. Hero with owner-centric value proposition and CTA
2. Pain section around hidden costs, renewals, and time pressure
3. 4-step workflow (upload, breakdown, risk flags, decision summary)
4. Scenario cards (supplier, lease, finance, services, platform terms, franchise/distribution)
5. Role-fit section for owner/operator contexts
6. Risk signal section (auto-renew, escalators, personal guarantees, penalties)
7. Before/after + owner benefits
8. FAQ + credibility + final CTA

SEO constraints:
- H1 should include "contract analysis" and "small business owners"
- include JSON-LD: FAQ, Breadcrumb, and example-output CreativeWork
- include internal links to `/`, `/pricing`, and `/uses-cases`

Implementation notes:
- dedicated page source: `web/src/pages/use-cases/small-business-owners.astro`
- exclude slug from dynamic route generation in `web/src/pages/use-cases/[slug].astro`

Draft landing content lives in:
- `landings/understand-contracts.md`
- `landings/explain-documents.md`
- `landings/find-risky-clauses.md`
- `landings/share-and-sign.md`
- `landings/manage-documents.md`

---

## Problem Page Mapping

| Problem page | Features used |
| --- | --- |
| Understand contracts | explain + translate |
| Find risky clauses | warnings + checks |
| Share and sign | storage + sharing + signing |
| Manage documents | storage + search + reminders |

---

## Long-Term Vision

DecoDocs aims to become:

> The place where freelancers and small businesses
> understand, manage, and confidently act on their documents --
> from first read to final signature and beyond.
