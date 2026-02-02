import React from 'react';
import { useAuth } from '../AuthContext.jsx';
import Button from '../components/Button.jsx';

export default function AccessDenied() {
  const { state, logout } = useAuth();
  const email = state.user?.email || '';

  return (
    <div style={{ maxWidth: 520, margin: '40px auto', padding: 24 }}>
      <h1 style={{ margin: 0, color: '#991b1b' }}>Access denied</h1>
      <p style={{ marginTop: 10, color: '#475569' }}>
        This admin portal is restricted to <strong>@snapsign.com.au</strong> accounts.
      </p>
      <div style={{ marginTop: 12, padding: 12, borderRadius: 10, border: '1px solid #e2e8f0', background: '#fff' }}>
        Signed in as: <strong>{email || '(unknown)'}</strong>
      </div>
      <div style={{ marginTop: 14, maxWidth: 260 }}>
        <Button variant="secondary" onClick={() => logout()}>
          Sign out
        </Button>
      </div>
    </div>
  );
}
