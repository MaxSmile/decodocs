# DecoDocs - Current Status & Next Steps

## Recent changes (2026-02-01)
- Backend: replaced MVP “free vs pro by AI calls/doc” with tiered token budgets:
  - Anonymous: 20k tokens per uid
  - Free: 40k tokens/day (UTC)
  - Pro: unlimited
  - scanned/OCR-required PDFs are Pro-only
  - docHash ledger stored in Firestore `docshashes` (forever)
- Web: DocumentViewer now shows a non-blocking gating modal (no alert()):
  - scanned PDF → redirect to `/pricing`
  - anonymous token limit → redirect to `/sign-in`
  - free daily limit → redirect to `/pricing`
- Web: DocumentViewer shows detected document type + allows per-user override via searchable selector.
  - override requires confirmation (quick validation popup)
  - override stored locally and persisted server-side per puid+docHash
- DocumentEditor: removed alert-based placeholders for Save/Download/Print.
  - Save now stores a local draft (signatures + annotations) in `localStorage`.
  - Download now downloads the original PDF when available.
  - Print opens the PDF in a new tab and triggers browser print.
- DocumentEditor: removed undefined “Lock Document (Coming Soon)” placeholder.
- Tooling cleanup: removed JSX-in-`.js` parsing issues (coverage tooling), by rewriting:
  - `src/index.js` to avoid JSX
  - `src/components/DocumentUpload.js` to avoid JSX (component is still optional/unwired)

## Current Status (January 2025)

### ✅ Phase 1 - MVP Successfully Launched

The DecoDocs application is now live and functional with:

#### Core Features
- **PDF Support**: Full PDF document analysis capabilities
- **Email-to-Sign Flow**: Stateless processing for Free tier users
- **Tiered Pricing**: Clear Free vs Pro differentiation based on AI call budget
- **Document Storage**: Available for Pro tier users with persistent storage
- **HubSpot Integration**: Ready for integration (kill feature)

#### Technical Infrastructure
- **Frontend**: React-based application with routing (Home, Viewer, Editor)
- **Backend**: Firebase Functions with Google Gemini AI integration
- **AI Processing**: Document analysis, risk identification, plain language conversion
- **Deployment**: Live at https://decodocs-site.web.app

#### Architecture Components
- **Google Drive Integration**: Technical specification complete
- **OneDrive Integration**: Technical specification complete  
- **iCloud Drive Integration**: Technical specification complete
- **Mobile Apps**: iOS and Android specifications ready

## Completed Documentation

### Technical Specifications
1. **[SUBSCRIPTION_TIERS.md]** - Three-tier system (Free, Pro $5/mo, Premium)
2. **[EMAIL_TO_SIGN_FLOW.md]** - Complete email processing specifications
3. **[CLOUD_INTEGRATIONS.md]** - Google Drive, OneDrive, iCloud technical specs
4. **[MOBILE_APPS.md]** - iOS and Android mobile app specifications
5. **[ROADMAP.md]** - Complete phased development roadmap
6. **[API.md]** - Full API endpoint documentation
7. **[ARCHITECTURE.md]** - System architecture overview
8. **[DEVELOPMENT.md]** - Development guidelines
9. **[DEPLOYMENT.md]** - Deployment procedures
10. **[FEATURES.md]** - Feature specifications and roadmap

## Next Steps - Phase 2: Cloud Storage Integrations

### Immediate Priorities

#### 1. Google Drive Integration (Week 1-2)
- Implement OAuth 2.0 authentication
- Create unified cloud storage abstraction
- Implement ephemeral processing (Open mode)
- Add Pro option for persistent storage

#### 2. OneDrive Integration (Week 2-3)
- Microsoft Graph API integration
- Consistent UI/UX with Google Drive
- Cross-platform testing

#### 3. iCloud Drive Integration (Week 3-4)
- Browser-based file selection
- iOS-specific optimizations
- Cross-platform compatibility

### Implementation Approach
Following the principle: "If a feature increases inference cost, storage cost, or support cost → it belongs to Pro or Premium, never Free"

### Success Metrics for Phase 2
- Cloud storage integration adoption rate
- Reduction in document upload friction
- Pro tier conversion from cloud features
- User satisfaction scores

## Phase 3 & 4 Preparation

### Premium Features (Phase 3)
- DOCX support ready for implementation
- Multi-document analysis specifications complete
- Advanced AI processing pipeline defined

### Mobile Apps (Phase 4)
- iOS and Android technical specifications ready
- Share-to-SnapSign integration planned
- Consistent analysis pipeline architecture confirmed

## Resource Requirements

### For Phase 2 (Cloud Integrations)
- 1 Full-stack Developer: 4 weeks
- Focus on OAuth integration and security
- Cross-platform testing and validation

### Quality Assurance
- OAuth security validation
- Cross-browser compatibility
- Performance optimization
- User experience testing

## Risk Mitigation

### Technical Risks
- OAuth provider API changes → Modular architecture design
- Security vulnerabilities → Security-first development practices
- Performance issues → Comprehensive testing protocols
- Scale challenges → Performance monitoring in place

### Business Risks
- User adoption of cloud features → Clear UX and documentation
- Pro tier conversion → Compelling free-to-paid features
- Competition → Focus on unique value proposition

## Timeline
- **Phase 2 Start**: Immediate
- **Google Drive Completion**: Week 2
- **OneDrive Completion**: Week 3  
- **iCloud Drive Completion**: Week 4
- **Phase 2 Complete**: End of Month

## Investment Priority
Following roadmap priority: Focus on **input convenience** and **distribution** rather than new analysis logic. Core SnapSign logic remains unchanged - the focus is on reducing friction for document access and processing.