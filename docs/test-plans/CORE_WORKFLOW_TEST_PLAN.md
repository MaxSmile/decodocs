# Core Document Workflow Test Plan

IMPORTANT: when run playwrite do it with report list key, like:  npx playwright test --reporter=list

## 1. Overview
This test plan focuses on the central value proposition of DecoDocs: **Document Ingestion → AI Analysis → Results Visualization**. It breaks down the workflow into granular, observable UI states and user interactions available in the production environment.

**Scope:**
- PDF Upload/Opening via `DocumentViewer`.
- Analysis Triggering via Toolbox buttons.
- Result Presentation (Badges, Panels, Text).
- Authentication State enforcement.

---

## 2. Test Environment
- **URL**: `https://decodocs-site.web.app` (Production)
- **Test Users**:
  - `Guest` (Unauthenticated / Anonymous)
  - `Pro User` (Authenticated with subscription)
- **Test Data**:
  - `clean_contract.pdf` (Simple, low risk)
  - `risky_contract.pdf` (Complex, multiple risk clauses)

---

## 3. Detailed Test Scenarios

### 3.1 Document Ingestion (Prerequisite)

| ID | Feature / Component | Action / State | Expected Observable Result | Pass/Fail |
|----|---------------------|----------------|----------------------------|-----------|
| **ING-01** | **Initial State** | Navigate to `/view`. | The PDF placeholder is visible containing text like: *"No PDF selected..."* | |
| **ING-02** | **File Selection** | Click "Open Different PDF". | System file picker dialog opens. | |
| **ING-03** | **Loading State** | Select a valid PDF file. | Loading indicator appears (spinner / "Loading PDF..."). | |
| **ING-04** | **Render Success** | Wait for load completion. | A `<canvas>` is visible and renders the PDF. Placeholder is hidden. | |
| **ING-05** | **File Name Display** | Check header controls. | UI shows the selected filename. | |
| **ING-06** | **Zoom Controls** | Click "Zoom In". | Zoom % increases and canvas re-renders. | |
| **ING-07** | **Pagination** | Load multi-page PDF. Click "Next ›". | "Page X of Y" updates and canvas content changes. | |

---

### 3.2 Feature: Toolbox & Analysis Triggering

*Pre-condition: Document loaded (ING-04 passed).*

| ID | Feature / Component | Action / State | Expected Observable Result | Pass/Fail |
|----|---------------------|----------------|----------------------------|-----------|
| **BTN-01** | **Disabled-state UX (Guest)** | As unauthenticated user, open a PDF and inspect the toolbox. | Buttons are disabled and a visible message explains *why* + provides CTAs: **Sign in** and **See Free vs Pro**. | |
| **BTN-02** | **Enabled-state UX (Authenticated)** | As authenticated user, open a PDF and inspect the toolbox. | Analysis buttons become enabled. | |
| **ANL-01** | **Analyze Trigger** | Click **"Type-specific analysis (recommended)"** (or legacy analysis). | Results panel immediately shows a **loading** state (spinner / "Analyzing…"). | |
| **ANL-02** | **Analysis Completion** | Wait for API response. | Results panel transitions to **success** (summary/risk list) OR shows a **gate/error** message (e.g. Pro required / token limit). | |

---

### 3.3 Feature: Results Visualization (Hardened states)

*Pre-condition: Document loaded (ING-04 passed).*

| ID | State | Action / State | Expected Observable Result | Pass/Fail |
|----|-------|----------------|----------------------------|-----------|
| **RES-00** | **Empty** | After opening a PDF but before analysis. | Results panel is present and shows an empty-state message (e.g. "No analysis yet"). | |
| **RES-01** | **Loading** | Trigger analysis. | Results panel shows a loading spinner/message; partial/stale content is not shown as a “success”. | |
| **RES-02** | **Success** | On successful analysis. | Panel shows "Analysis Results" header + a non-empty summary; risks/recommendations appear when returned. | |
| **RES-03** | **Error / Gate** | Use a scanned PDF or exceed plan limits. | Panel shows a clear error/gate message (and optional CTA via modal to `/pricing` or `/sign-in`). | |

---

### 3.4 Feature: Canvas Annotations (Optional / implementation-dependent)

This is optional because overlays can vary as rendering code evolves.

| ID | Feature | Action / State | Expected Observable Result | Pass/Fail |
|----|---------|----------------|----------------------------|-----------|
| **OVL-01** | **Risk badges / highlights** | After successful analysis. | Visual overlays may appear; absence should not block core workflow as long as results panel renders correctly. | |

---

### 3.5 Feature: Specific Tools

*Pre-condition: Authenticated User, Document Loaded.*

| ID | Feature / Component | Action / State | Expected Observable Result | Pass/Fail |
|----|---------------------|----------------|----------------------------|-----------|
| **TOOL-01**| **Plain English** | Click "Translate to Plain English". | Browser `alert()` appears containing: *"Original: ... Plain English: ..."*. | |
| **TOOL-02**| **Highlight Risks** | Click "Highlight Risks" button. | (If risks found) Browser `alert()` appears: *"Found X risks..."*. New badges render on canvas. | |
| **TOOL-03**| **Explain Section** | Select text (if possible) -> Click "Explain Selection". | Browser `alert()` with explanation. | |

---

## 4. Automation Strategy (Playwright)

To convert this plan into code, we will implement `core-workflow.spec.js`:

1.  **Mocking (Stage 1)**: Verify UI states transition correctly (Loading -> Success) using mocked API responses.
2.  **Integration (Stage 2)**:
    *   Use `page.setInputFiles` to upload a real dummy PDF.
    *   Wait for `canvas` element to ensure PDF.js rendered.
    *   Intercept network requests to `cloudfunctions.net` to verify call payload.
    *   Verify response UI text contains "Summary" or "Risk".

## 5. Manual Smoke Test Checklist
*Run before every deployment.*

- [ ] Open PDF from local disk.
- [ ] Render verify (can read text).
- [ ] Click "Analyze Document" -> Wait for result.
- [ ] Check text explanation makes sense (sanity check).
- [ ] Refresh page -> App reloads cleanly.
