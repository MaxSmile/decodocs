import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import { AuthProvider } from './AuthContext.jsx';
import App from './App.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import { fn } from './firebase.js';
import { crashReporter } from './lib/crashReporter.js';

crashReporter.installGlobalHandlers();
crashReporter.configure({ functions: fn, source: 'admin' });

ReactDOM.createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
