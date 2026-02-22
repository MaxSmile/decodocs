# Visual Regression Checklist (Quick Manual)

Use this checklist after any CSS/layout changes. Target: **5–10 minutes**.

## Devices / viewports

- Android Chrome (real device preferred)
- iOS Safari (real device preferred)

If using DevTools:
- Mobile: 390×844 (iPhone 12/13/14-ish)
- Desktop: 1440×900

## Pages to check

### 1) Landing / Home
- URL: `https://decodocs.com/`
- Mobile:
  - Header logo not oversized; nav buttons visible
  - Hero headline + CTAs visible above the fold (`Analyse a PDF Document`, `Correct a PDF Document`) 
  - No horizontal scrolling
  - Pricing section renders when scrolling

### 2) Pricing
- URL: `https://decodocs.com/pricing`
- Mobile:
  - Pricing cards stack cleanly
  - CTA buttons not clipped
  - No horizontal scrolling

### 3) Viewer
- URL: `https://decodocs.com/view`
- Mobile:
  - Viewer controls fit (buttons wrap, no overlap)
  - PDF area and analysis toolbox **stack vertically**
  - No horizontal scrolling
  - Footer remains readable

### 4) Auth pages
- URL: `https://decodocs.com/sign-in`
- Mobile:
  - Sign-in buttons not clipped; inputs usable
  - Error messages don’t overflow

### 5) Footer links
From any page footer, open:
- `https://decodocs.com/privacy`
- `https://decodocs.com/terms`
- `https://decodocs.com/about`
- `https://decodocs.com/contact`

All should:
- Load without console errors
- Be readable on mobile

## Header Sticky Check (Post-CSS Changes)

**CRITICAL**: After any header/layout CSS changes, verify that no headers, sidebars, or navigation are sticky:
- Scroll any page and confirm:
  - All headers scroll naturally with page content (not fixed or sticky to viewport)
  - This applies to all projects (snapsign.com.au, decodocs.com, admin.decodocs.com, docs.decodocs.com)
  - Sidebars (e.g., docs.decodocs.com) should scroll with content, not remain fixed
- Use DevTools → Inspect → check computed `position` property is **NOT** `sticky` or `fixed` for header/nav/sidebar elements

## Cache note (when checking production)

If you suspect you’re seeing an old build on mobile:
- do a hard refresh, or
- open the URL once with a cache-busting query (e.g. `?ts=1`), or
- clear site data for `decodocs.com`.

## What to record when something breaks

- URL + route
- Device + browser + viewport
- Screenshot (top + broken section)
- If possible: the Git commit hash / deployed version from footer
