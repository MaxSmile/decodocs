# DecoDocs Docs

This folder is the canonical home for product and technical documentation.
It summarizes the current direction and constraints based on project files,
including the **Understand -> Manage -> Act** model for freelancers and SMBs.

## Source of Truth
- Product vision and positioning: `README.md`
- Web architecture and boundaries: `web/AGENTS.md` (ReactJS + Firebase Hosting)
- Infrastructure rules and topology: `infra/AGENTS.md`, `infra/README.md`
- Mobile approach: `mobile/README.md`

## What Lives Here
- `PRODUCT.md`: product goals, value, pillars, and principles
- `MVP.md`: MVP scope and exclusions
- `TERMINOLOGY.md`: shared language
- `USER_FLOWS.md`: key user journeys
- `SECURITY.md`: non-negotiable security rules
- `DECISIONS.md`: active architectural/product decisions
- `ROADMAP.md`: phase-based roadmap
- `../LANDING_INSTRUCTIONS.md`: landing page principles and funnel rules
- `../landings/`: landing page drafts
- `../HUBSPOT_SETUP_INSTRUCTIONS.md`: HubSpot setup for marketing intelligence

The purpose of `/docs` is to:
- preserve product intent
- prevent architectural and product drift
- make decisions explicit and reviewable
- help future contributors (including future-you) understand the system

This folder is not marketing, not API reference, and not random notes.

---

## How to use these docs

- Start with **PRODUCT.md** to understand what DecoDocs is.
- Read **DECISIONS.md** to understand *why* things are built the way they are.
- Use **MVP.md** to avoid feature creep.
- Update docs **before or together with** major changes.

If something important is not written here, it is not a stable assumption.
