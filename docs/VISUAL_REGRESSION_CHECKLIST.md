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
  - Hero headline + CTAs visible above the fold
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

## What to record when something breaks

- URL + route
- Device + browser + viewport
- Screenshot (top + broken section)
- If possible: the Git commit hash / deployed version from footer
