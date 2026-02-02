import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Button from '../components/Button.jsx';
import TextField from '../components/TextField.jsx';

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await register(email.trim(), password);
      nav('/');
    } catch (e) {
      setError(e?.message || 'Registration failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 24 }}>
      <h1 style={{ margin: 0 }}>Create Admin Account</h1>
      <p style={{ marginTop: 8, color: '#475569' }}>
        This creates a standard Firebase account. Only <strong>@snapsign.com.au</strong> emails can access admin features.
      </p>

      <form onSubmit={onSubmit}>
        <TextField label="Email" value={email} onChange={setEmail} autoComplete="email" />
        <TextField label="Password" type="password" value={password} onChange={setPassword} autoComplete="new-password" />
        {error ? (
          <div style={{ marginTop: 12, color: '#991b1b', fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 10, border: '1px solid #fecaca' }}>
            {error}
          </div>
        ) : null}
        <div style={{ marginTop: 14 }}>
          <Button type="submit" disabled={busy || !email || !password || password.length < 10}>
            {busy ? 'Creating…' : 'Create account'}
          </Button>
        </div>
      </form>

      <p style={{ marginTop: 14, fontSize: 13, color: '#475569' }}>
        Already have an account? <Link to="/login">Sign in</Link>
      </p>

      <p style={{ marginTop: 8, fontSize: 12, color: '#64748b' }}>
        Password must be at least 10 characters.
      </p>
    </div>
  );
}
