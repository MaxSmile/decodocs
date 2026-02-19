# DecoDocs Development Guide

## Overview

This guide provides instructions for setting up, developing, and maintaining the DecoDocs application. It covers both frontend and backend development workflows.

## Prerequisites

Before starting development, ensure you have the following installed:

- **Node.js** (version 18 or higher)
- **npm** (comes with Node.js)
- **Firebase CLI** (install with `npm install -g firebase-tools`)
- **Git**
- **A code editor** (VS Code recommended)

## Environment Setup

### Canonical local setup (source of truth)

This repo is designed to run locally with **either**:
- real Firebase project config (default), **or**
- Firebase emulators (recommended for local dev / CI)

### Config strategy (current state)
- We do not use `.env*` files (`.env`, `.env.local`, `.env.production`, etc.).
- The web app has a safe default Firebase config (project `snapsign-au`).
- If a temporary override is needed, pass env values inline in the command or via CI/runtime environment (not via env files).
- For local dev without real credentials, use:
  - Firebase Auth emulator (inline flag), or
  - `window.MOCK_AUTH=true` (test/dev helper)

### 1) Clone the repository

```bash
git clone [repository-url]
cd SnapSign-AU/decodocs
```

### 2) Install dependencies

#### Web app
```bash
cd web
npm install
```

#### Firebase Functions
```bash
cd ../functions
npm install
```

### 3) Runtime overrides (no env files)

Default behavior uses built-in config in `web/src/stores/authStore.ts`.

If needed, pass overrides inline (examples):

```bash
VITE_USE_FIREBASE_EMULATOR=true npm run dev
VITE_FIREBASE_AUTH_EMULATOR_URL=http://localhost:9099 VITE_USE_FIREBASE_EMULATOR=true npm run dev
```

Do not create `.env*` files for these values.

## Development Workflow

### Frontend Development

#### Starting the development server
```bash
cd web
npm run dev
```

This starts Vite on `http://localhost:3000`.

#### Available scripts

- `npm run dev` - Start dev server (Vite)
- `npm run build` - Build production bundle into `web/decodocs.com/`
- `npm run preview` - Preview production build locally
- `npm run test:unit` - Run unit tests (Vitest)
- `npm run test:e2e` - Run end-to-end tests (Playwright)

#### Code Structure

As the codebase grows, prefer moving Firebase callable wrappers and other API glue into `web/src/services/*`.
This keeps large components (especially `DocumentViewer`) from turning into hard-to-maintain “god components”.

```
web/
├── public/                 # Static assets
├── src/
│   ├── components/         # React components
│   │   ├── HomePage.js
│   │   ├── DocumentViewer.js
│   │   └── DocumentEditor.js
│   ├── services/           # API/callable wrappers (Firebase functions, etc.)
│   │   ├── analyzeTextService.js
│   │   ├── preflightService.js
│   │   ├── documentTypeService.js
│   │   └── typeAnalysisService.js
│   ├── __tests__/          # Unit tests
│   ├── setupProxy.js       # Development proxy
│   ├── setupTests.js       # Test setup
│   ├── App.js             # Main application component
│   ├── App.css            # Global styles
│   └── index.js           # Application entry point
├── package.json
└── README.md
```

### Backend Development

#### Starting Firebase emulators

From `decodocs/functions`:
```bash
firebase emulators:start --only functions,auth
```

- Functions emulator: `http://localhost:5001`
- Auth emulator: `http://localhost:9099`

Then, in another terminal, start the web app:

```bash
cd web
VITE_USE_FIREBASE_EMULATOR=true npm run dev
```

#### Available Commands

- `firebase emulators:start --only functions` - Start functions emulator
- `firebase functions:shell` - Interactive shell for testing
- `firebase deploy --only functions` - Deploy functions to production
- `firebase functions:log` - View function logs

#### Code Structure

```
functions/
├── index.js               # Main functions file
├── package.json           # Dependencies
└── node_modules/          # Installed packages
```

## Component Development

### Creating New Components

When creating new React components:

1. Place components in the `src/components/` directory
2. Follow the naming convention: `ComponentName.js`
3. Include prop types validation
4. Write unit tests in `src/__tests__/ComponentName.test.js`
5. Export components properly

Example component structure:
```javascript
import React from 'react';

const MyComponent = ({ propName }) => {
  return (
    <div>
      {/* Component JSX */}
    </div>
  );
};

export default MyComponent;
```

### Component Guidelines

- Use functional components with hooks
- Keep components focused on a single responsibility
- Use descriptive names
- Follow consistent styling patterns
- Include error boundaries where appropriate

## API Development

### Adding New Functions

When adding new Firebase Functions:

1. Define the function in `functions/index.js`
2. Implement proper error handling
3. Add CORS headers for web accessibility
4. Validate input parameters
5. Follow the existing response format

Example function structure:
```javascript
exports.myFunction = functions.https.onRequest(async (req, res) => {
  // Set CORS headers
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');

  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    res.status(204).send('');
    return;
  }

  try {
    // Function logic here
    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error in myFunction:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
});
```

## Testing

See `docs/TESTING.md` for the CI-friendly runbook.

### Unit Testing

Unit tests are written using **Vitest** and React Testing Library.

Run once (CI-friendly):
```bash
cd web
npm run test:unit
```

Watch mode (local dev):
```bash
cd web
npm test
```

### E2E Testing

E2E tests are written using **Playwright**.

```bash
cd web
npm run test:e2e
```

import MyComponent from '../components/MyComponent';

describe('MyComponent', () => {
  test('renders correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected text')).toBeInTheDocument();
  });
});
```

### End-to-End Testing

End-to-end tests use Playwright and are located in the `e2e-tests/` directory.

#### Running E2E Tests

Run Playwright locally:

```bash
npm run test:e2e
```

Run tests against the built preview (recommended for route / static-file assertions):

```bash
E2E_USE_PREVIEW=1 npm run test:e2e
```

Note: CI uses the same preview-mode approach so route-dependent specs run reliably in automated checks.

## Styling / Tailwind (important)

The marketing/landing UI relies on Tailwind utilities.

This project uses **Tailwind v4**. The correct entrypoint is:

```css
/* web/src/index.css */
@import "tailwindcss";
```

Do **not** use the Tailwind v3 directives (`@tailwind base; @tailwind components; @tailwind utilities;`) in this repo.

If Tailwind isn’t being loaded correctly, symptoms include:
- header logo rendering at an incorrect size
- missing padding/spacing utilities (e.g. `px-6`, `py-4`)
- landing sections looking "flattened" / unstyled on mobile

### Guardrail: legacy global CSS

`web/src/App.css` contains legacy styles from the pre-Tailwind UI. Keep any element selectors (e.g. `main`, `footer`) **scoped under `.App:not(.homepage-app)`** so they don’t leak into the Tailwind landing/app `Layout`.

## Styling Guidelines

### CSS Architecture

- Use modular CSS with scoped styles
- Follow BEM methodology for class naming
- Maintain consistent spacing and typography
- Ensure responsive design for all screen sizes
- Use CSS variables for consistent theming

### Naming Conventions

- Use kebab-case for CSS classes: `.my-component`
- Use descriptive names that reflect purpose
- Group related styles together
- Use utility classes sparingly

## State Management

### React Hooks

Use React's built-in hooks for state management:

- `useState` for component state
- `useEffect` for side effects
- `useContext` for global state (when needed)
- `useReducer` for complex state logic

### Best Practices

- Keep state as close to where it's used as possible
- Avoid unnecessary state updates
- Use memoization when appropriate
- Handle loading and error states consistently

## Error Handling

### Frontend Error Handling

- Implement error boundaries for catching component errors
- Show user-friendly error messages
- Log errors for debugging
- Provide recovery options when possible

### Backend Error Handling

- Always include try-catch blocks for async operations
- Log errors with sufficient context
- Return appropriate HTTP status codes
- Don't expose internal error details to clients

## Performance Optimization

### Frontend Optimization

- Use React.memo for components that rarely change
- Implement virtual scrolling for large datasets
- Optimize images and assets
- Code splitting for faster initial loads
- Lazy loading for non-critical components

### Backend Optimization

- Optimize API responses to minimize payload size
- Implement caching strategies
- Monitor function execution times
- Use efficient data structures

## Security Considerations

### Input Validation

- Validate all user inputs on both frontend and backend
- Sanitize data before processing
- Use parameterized queries for database interactions
- Implement proper authentication when added

### Data Protection

- Encrypt sensitive data in transit and at rest
- Follow least privilege principle
- Regularly update dependencies
- Monitor for security vulnerabilities

## Deployment

### Pre-deployment Checklist

- [ ] Run all tests successfully
- [ ] Build the application without errors
- [ ] Update documentation if needed
- [ ] Review code changes
- [ ] Test in staging environment (when available)

### Frontend Deployment

```bash
npm run build
# Then deploy using Firebase Hosting
firebase deploy --only hosting:decodocs
```

### Backend Deployment

```bash
# Deploy functions
firebase deploy --only functions
```

## Troubleshooting

### Common Issues

#### Frontend Issues
- **Module not found errors**: Run `npm install` to reinstall dependencies
- **Hot reload not working**: Restart the development server
- **Build failures**: Check for syntax errors and missing dependencies

#### Backend Issues
- **Functions not deploying**: Check billing setup on Firebase
- **Emulator not starting**: Ensure Firebase CLI is updated
- **CORS errors**: Verify CORS headers are properly set

### Debugging Tips

- Use browser developer tools for frontend debugging
- Check Firebase console for function logs
- Use console.log statements strategically
- Monitor network requests for API calls

## Contributing

### Pull Request Process

1. Create a feature branch from `main`
2. Make your changes following the guidelines above
3. Add or update tests as needed
4. Update documentation if applicable
5. Submit a pull request with a clear description
6. Address review comments
7. Merge after approval

### Code Review Checklist

- [ ] Code follows established patterns
- [ ] Tests are included and passing
- [ ] Documentation is updated
- [ ] Performance considerations are addressed
- [ ] Security best practices are followed
- [ ] Error handling is implemented
