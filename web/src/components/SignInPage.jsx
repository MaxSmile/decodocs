import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GoogleAuthProvider,
  OAuthProvider,
  EmailAuthProvider,
  linkWithPopup,
  linkWithCredential,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import { useAuth } from '../context/AuthContext.jsx';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const Card = ({ children }) => (
  <div style={{ border: '1px solid #e2e8f0', borderRadius: 14, background: '#fff', padding: 18 }}>
    {children}
  </div>
);

export default function SignInPage() {
  const { authState, auth } = useAuth();
  const navigate = useNavigate();
  const q = useQuery();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ kind: 'idle', message: '' });

  const user = authState?.user || null;
  const isAnon = !!user?.isAnonymous;

  const intent = q.get('intent');

  const runProvider = async (provider) => {
    setStatus({ kind: 'loading', message: 'Opening sign-in…' });

    try {
      if (!auth) throw new Error('Auth is not available');

      // If we already have a user session (usually anonymous), we link.
      // Linking is universal: providers become aliases under the same identity.
      if (auth.currentUser) {
        await linkWithPopup(auth.currentUser, provider);
      } else {
        await signInWithPopup(auth, provider);
      }

      setStatus({ kind: 'ok', message: 'Signed in. Your accounts are linked.' });
      navigate('/profile');
    } catch (e) {
      // Common case: trying to link a provider that already exists on another account.
      const code = e?.code || '';
      if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
        setStatus({
          kind: 'error',
          message:
            'That account is already used elsewhere. Please sign out and sign in with that provider, then link the others from your profile.',
        });
        return;
      }

      setStatus({ kind: 'error', message: e?.message || 'Sign-in failed.' });
    }
  };

  const linkEmailPassword = async (mode) => {
    setStatus({ kind: 'loading', message: mode === 'signup' ? 'Creating account…' : 'Signing in…' });

    try {
      if (!auth) throw new Error('Auth is not available');
      if (!auth.currentUser) throw new Error('No active session. Refresh and try again.');
      if (!email || !password) throw new Error('Email and password are required.');

      // We always link email/password to the current user.
      // For anonymous users, this upgrades them to a permanent account.
      const credential = EmailAuthProvider.credential(email, password);
      await linkWithCredential(auth.currentUser, credential);

      setStatus({ kind: 'ok', message: 'Email sign-in linked.' });
      navigate('/profile');
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/email-already-in-use') {
        setStatus({ kind: 'error', message: 'Email already exists. Use “Sign out” then sign in with that email, and link providers from /profile.' });
        return;
      }
      setStatus({ kind: 'error', message: e?.message || 'Email sign-in failed.' });
    }
  };

  const doSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    setStatus({ kind: 'ok', message: 'Signed out. Refreshing…' });
    window.location.reload();
  };

  const header = intent === 'upgrade' ? 'Sign in to upgrade' : 'Sign in';

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>{header}</h1>
      <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>
        We support Google, Email, Apple, and Microsoft. Linking is universal — you can attach multiple providers to one account.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 16 }}>
        <Card>
          <div style={{ fontWeight: 900 }}>Continue with a provider</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <button
              type="button"
              onClick={() => runProvider(new GoogleAuthProvider())}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer' }}
            >
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => runProvider(new OAuthProvider('apple.com'))}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer' }}
            >
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={() => runProvider(new OAuthProvider('microsoft.com'))}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer' }}
            >
              Continue with Microsoft
            </button>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 900 }}>Email + password</div>
          <div style={{ marginTop: 10, display: 'grid', gap: 10 }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              style={{ padding: 10, borderRadius: 12, border: '1px solid #e2e8f0' }}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              style={{ padding: 10, borderRadius: 12, border: '1px solid #e2e8f0' }}
            />
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => linkEmailPassword('signup')}
                style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer', flex: 1 }}
              >
                Link Email
              </button>
              <button
                type="button"
                onClick={doSignOut}
                style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 900, cursor: 'pointer' }}
              >
                Sign out
              </button>
            </div>
            <div style={{ color: '#64748b', fontSize: 13, lineHeight: 1.5 }}>
              This links email/password to your current session (anonymous or not). If the email already exists, sign out and sign in fresh.
            </div>
          </div>
        </Card>
      </div>

      {status.kind !== 'idle' && (
        <div
          style={{
            marginTop: 14,
            padding: 12,
            borderRadius: 12,
            border: '1px solid ' + (status.kind === 'error' ? '#fecaca' : '#bbf7d0'),
            background: status.kind === 'error' ? '#fef2f2' : '#f0fdf4',
            color: status.kind === 'error' ? '#991b1b' : '#166534',
          }}
        >
          {status.message}
        </div>
      )}

      <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/pricing" style={{ color: '#0f172a', fontWeight: 800 }}>Back to pricing</Link>
        <Link to="/" style={{ color: '#475569', fontWeight: 700 }}>Home</Link>
      </div>

      <div style={{ marginTop: 18, padding: 14, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 900, marginBottom: 6 }}>Current session</div>
        <div style={{ color: '#475569', lineHeight: 1.7 }}>
          Status: <strong>{authState?.status}</strong>
          <br />
          UID: <code>{user?.uid || 'n/a'}</code>
          <br />
          Anonymous: <strong>{String(isAnon)}</strong>
        </div>
      </div>
    </div>
  );
}
