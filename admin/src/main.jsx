import React from 'react';
import ReactDOM from 'react-dom/client';

const App = () => {
  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif', padding: 24 }}>
      <h1 style={{ margin: 0 }}>DecoDocs Admin</h1>
      <p style={{ marginTop: 8, color: '#475569' }}>
        Admin portal scaffold is live. Next: Google sign-in + allowlist (@snapsign.com.au) + editors for
        <code> admin/stripe</code>, <code>admin/plans</code>, <code>admin/flags</code>, <code>admin/policies</code>.
      </p>
      <p style={{ marginTop: 16 }}>
        This is a placeholder build to claim the hosting site.
      </p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
