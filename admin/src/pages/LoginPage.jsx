import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext.jsx';
import Button from '../components/Button.jsx';
import TextField from '../components/TextField.jsx';

export default function LoginPage() {
  const { signIn } = useAuth();
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
      await signIn(email.trim(), password);
      nav('/');
    } catch (e) {
      setError(e?.message || 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto', padding: 24 }}>
      <h1 style={{ margin: 0 }}>DecoDocs Admin</h1>
      <p style={{ marginTop: 8, color: '#475569' }}>Sign in with email/password.</p>

      <form onSubmit={onSubmit}>
        <TextField label="Email" value={email} onChange={setEmail} autoComplete="email" />
        <TextField label="Password" type="password" value={password} onChange={setPassword} autoComplete="current-password" />
        {error ? (
          <div style={{ marginTop: 12, color: '#991b1b', fontSize: 13, background: '#fef2f2', padding: 10, borderRadius: 10, border: '1px solid #fecaca' }}>
            {error}
          </div>
        ) : null}
        <div style={{ marginTop: 14 }}>
          <Button type="submit" disabled={busy || !email || !password}>
            {busy ? 'Signing in…' : 'Sign in'}
          </Button>
        </div>
      </form>

      <p style={{ marginTop: 14, fontSize: 13, color: '#475569' }}>
        No account? <Link to="/register">Create one</Link>
      </p>

      <p style={{ marginTop: 18, fontSize: 12, color: '#64748b' }}>
        Access to admin features is restricted to <strong>@snapsign.com.au</strong> accounts.
      </p>
    </div>
  );
}
