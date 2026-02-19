import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import SupportUkraineBanner from 'react-support-ukraine-banner';
import './index.css';
import './App.css';
import { crashReporter } from './services/crashReporter.js';

crashReporter.installGlobalHandlers();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <SupportUkraineBanner />
    <App />
  </React.StrictMode>,
);
