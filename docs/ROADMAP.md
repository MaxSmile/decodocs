# DecoDocs Roadmap

## Overview
This roadmap outlines the phased development of DecoDocs, prioritizing input convenience and distribution rather than new analysis logic. The core SnapSign logic remains unchanged throughout all phases.

---

## Phase 1 — MVP (Launched)

### Completed Features
- ✅ PDF support
- ✅ Email-to-sign (stateless for Free tier)
- ✅ Free vs Pro differentiation based on AI call budget
- ✅ Document storage for Pro tier
- ✅ HubSpot integration (kill feature)
- ✅ Core analysis pipeline
- ✅ Firebase Functions with Gemini AI
- ✅ React frontend with routing
- ✅ Technical documentation

### Technical Foundation
- Firebase Hosting and Functions
- Google Generative AI SDK integration
- Three-tier subscription model (Free/Pro/Premium)
- Preflight analyzer for document classification
- Stateless processing for Free tier
- Persistent storage for Pro tier

---

## Phase 2 — Cloud Storage Integrations

### Goal
Reduce friction of "getting the document in" without increasing storage liability.

### Target Completion
Q2 2025

### Google Drive
- OAuth-based, read-only access
- Default mode: **open (ephemeral)**
- Optional: user explicitly chooses "save to Decodocs" (Pro)
- No automatic import
- No background sync
- No file mirroring

### OneDrive
- Same model as Google Drive
- Read-only access
- No background indexing
- No file replication unless user explicitly uploads (Pro)

### iCloud Drive
- User-initiated file selection
- No continuous access
- Treated as local open, not upload

### Technical Requirements
- OAuth 2.0 integration for each provider
- Secure token management
- Unified cloud storage abstraction layer
- Consistent UI/UX across providers
- Temporary file processing pipeline

### Implementation Principles
- If a feature increases inference cost → belongs to Pro or Premium
- If a feature increases storage cost → belongs to Pro or Premium
- If a feature increases support cost → belongs to Pro or Premium

---

## Phase 3 — Premium Features

### Target Completion
Q3 2025

### DOCX Support (Premium only)
- Conversion to internal canonical format
- Normalization & cleanup
- Counts as multiple AI calls
- No partial support

### Advanced Multi-Document Analysis
- Annex-heavy contracts
- Bundled documents
- Cross-document references
- Cross-document contradiction detection
- Version diff / compare capabilities

### Implementation Requirements
- Advanced document parsing
- Multi-document correlation algorithms
- Enhanced AI processing pipeline
- Extended storage capabilities

---

## Phase 4 — Mobile Apps

### Goal
Make SnapSign usable at the moment of signing.

### Target Completion
Q4 2025

### Mobile Platforms
- iOS native application
- Android native application

### Capabilities
- Open PDF from:
  - Mail attachments
  - Device files
  - Google Drive / OneDrive / iCloud
- Run same analysis pipeline as web/email
- Share-to-SnapSign entry point
- View explanation before signing elsewhere

### Technical Constraints (v1)
- No on-device LLM inference (all processing server-based)
- No offline analysis
- No full document editing
- No native e-signature (separate phase)

### Platform Requirements
- iOS: iOS 13.0+, Xcode 12.0+
- Android: Android 7.0 (API level 24)+
- Firebase SDK integration
- Cloud storage provider SDKs

---

## Phase 5 — Signing & Verification (Future)

### Scope
Out of MVP scope, but enabled by prior steps:

### Planned Features
- Append-only signatures in envelope
- Signature integrity checks
- Timeline & audit export
- Advanced signing workflows
- Legal compliance features

### Timeline
Q1 2026 (subject to regulatory requirements)

---

## Guiding Principles for All Phases

### Cost-Based Feature Assignment
If a feature:
- increases inference cost
- increases storage cost
- increases support cost

→ it belongs to **Pro or Premium**, never Free.

### User Experience Priorities
- Reduce friction for document input
- Maintain consistent analysis quality
- Preserve privacy and security
- Enable use at moment of decision

### Technical Standards
- Consistent API interfaces
- Secure token management
- Reliable error handling
- Scalable infrastructure

---

## Roadmap Non-Goals

### Explicitly Excluded Features
- ERP-style document management
- Auto-sync from cloud drives
- Background scanning of user files
- "Unlimited" anything
- Complex analysis algorithm changes
- On-device AI processing (Phase 1)

---

## Success Metrics

### Phase 2 Success Criteria
- Cloud storage integration adoption rate
- Reduction in document upload friction
- User satisfaction with file access
- Pro tier conversion from cloud features

### Phase 3 Success Criteria
- Premium tier adoption rate
- Multi-document analysis usage
- Customer satisfaction with advanced features

### Phase 4 Success Criteria
- Mobile app download and retention
- Share-to-SnapSign usage rate
- Mobile vs web feature parity
- User engagement at point of signing

---

## Risk Management

### Technical Risks
- Cloud provider API changes
- Mobile platform evolution
- Security vulnerability exposure
- Performance degradation with scale

### Mitigation Strategies
- Modular architecture design
- Comprehensive testing protocols
- Security-first development practices
- Performance monitoring and optimization

---

## Resource Allocation

### Phase 2 Resources
- 2 full-stack developers
- 1 mobile developer (part-time)
- 1 DevOps engineer
- 2 weeks development time

### Phase 3 Resources
- 1 backend developer
- 1 AI/ML specialist
- 1 full-stack developer
- 3 weeks development time

### Phase 4 Resources
- 1 iOS developer
- 1 Android developer
- 1 backend developer
- 4 weeks development time