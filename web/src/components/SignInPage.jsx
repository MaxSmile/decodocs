import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GoogleAuthProvider,
  OAuthProvider,
  EmailAuthProvider,
  linkWithPopup,
  linkWithCredential,
} from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';
import { AiFillApple } from 'react-icons/ai';
import { FaMicrosoft } from 'react-icons/fa';
import { MdEmail } from 'react-icons/md';
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
  const {
    authState,
    auth,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithApple,
    signInWithEmail,
    signUpWithEmail,
    resetPassword,
  } = useAuth();
  const navigate = useNavigate();
  const q = useQuery();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState({ kind: 'idle', message: '' });

  const user = authState?.user || null;
  const isAnon = !!user?.isAnonymous;

  const intent = q.get('intent');
  const upgradePlan = q.get('plan') === 'business' ? 'business' : 'pro';
  const upgradeBilling = q.get('billing') === 'annual' ? 'annual' : 'monthly';
  const sandbox = q.get('sandbox') === '1' ? '1' : null;
  const postAuthPath = useMemo(() => {
    if (intent !== 'upgrade') return '/profile';
    const qp = new URLSearchParams({
      autoCheckout: '1',
      plan: upgradePlan,
      billing: upgradeBilling,
    });
    if (sandbox) qp.set('sandbox', sandbox);
    return `/pricing?${qp.toString()}`;
  }, [intent, sandbox, upgradeBilling, upgradePlan]);

  const runProvider = async (provider, directSignIn) => {
    setStatus({ kind: 'loading', message: 'Opening sign-in…' });

    try {
      if (!auth) throw new Error('Auth is not available');

      // If we already have a user session (usually anonymous), we link.
      // Linking is universal: providers become aliases under the same identity.
      if (auth.currentUser) {
        await linkWithPopup(auth.currentUser, provider);
      } else if (directSignIn) {
        await directSignIn();
      } else {
        // Fallback: should rarely happen because AuthProvider creates an anonymous user.
        throw new Error('No active session. Refresh and try again.');
      }

      setStatus({ kind: 'ok', message: 'Signed in. Your accounts are linked.' });
      navigate(postAuthPath);
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

  const doEmailSignIn = async () => {
    setStatus({ kind: 'loading', message: 'Signing in…' });
    try {
      if (!email || !password) throw new Error('Email and password are required.');
      if (auth.currentUser && isAnon) {
        // Link to anonymous account
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        setStatus({ kind: 'ok', message: 'Email linked and signed in.' });
      } else {
        await signInWithEmail(email, password);
        setStatus({ kind: 'ok', message: 'Signed in.' });
      }
      navigate(postAuthPath);
    } catch (e) {
      setStatus({ kind: 'error', message: e?.message || 'Email sign-in failed.' });
    }
  };

  const doEmailSignUp = async () => {
    setStatus({ kind: 'loading', message: 'Creating account…' });
    try {
      if (!email || !password) throw new Error('Email and password are required.');
      if (String(password).length < 10) throw new Error('Password must be at least 10 characters.');
      await signUpWithEmail(email, password);
      setStatus({ kind: 'ok', message: 'Account created and signed in.' });
      navigate(postAuthPath);
    } catch (e) {
      setStatus({ kind: 'error', message: e?.message || 'Email sign-up failed.' });
    }
  };

  const doResetPassword = async () => {
    setStatus({ kind: 'loading', message: 'Sending reset email…' });
    try {
      if (!email) throw new Error('Enter your email first.');
      await resetPassword(email);
      setStatus({ kind: 'ok', message: 'Password reset email sent (if the account exists).' });
    } catch (e) {
      setStatus({ kind: 'error', message: e?.message || 'Password reset failed.' });
    }
  };

  const header = intent === 'upgrade' ? 'Sign in to upgrade' : 'Sign in';

  useEffect(() => {
    if (authState.status === 'authenticated' && !isAnon) {
      navigate(postAuthPath, { replace: true });
    }
  }, [authState.status, isAnon, navigate, postAuthPath]);

  if (authState.status === 'authenticated' && !isAnon) {
    return <div>Redirecting...</div>;
  }

  return (
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>{header}</h1>
      <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>
        We support Google, Email, Apple, and Microsoft. Linking is universal — you can attach multiple providers to one account.
      </p>
      {intent === 'upgrade' && (
        <p style={{ marginTop: 8, color: '#1e3a8a', lineHeight: 1.6 }}>
          Next step after sign-in: start {upgradePlan === 'business' ? 'Business' : 'Pro'} checkout ({upgradeBilling} billing).
        </p>
      )}

      {status.kind !== 'idle' && (
        <div
          className="error"
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginTop: 16 }}>
        <Card>
          <div style={{ fontWeight: 900 }}>Continue with a provider</div>
          <div style={{ marginTop: 12, display: 'grid', gap: 10 }}>
            <button
              type="button"
              onClick={() => runProvider(new GoogleAuthProvider(), signInWithGoogle)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => runProvider(new OAuthProvider('apple.com'), signInWithApple)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <AiFillApple size={20} />
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={() => runProvider(new OAuthProvider('microsoft.com'), signInWithMicrosoft)}
              style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', color: '#0f172a', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
            >
              <FaMicrosoft size={20} />
              Continue with Microsoft
            </button>
          </div>
        </Card>

        <Card>
          <div style={{ fontWeight: 900 }}>Sign in with email</div>
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

            <div style={{ display: 'grid', gap: 10 }}>
              <button
                type="button"
                onClick={doEmailSignIn}
                style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
              >
                Sign In
              </button>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                <button
                  type="button"
                  onClick={doEmailSignUp}
                  style={{ background: 'none', border: 'none', color: '#0f172a', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                >
                  Create account
                </button>
                <button
                  type="button"
                  onClick={doResetPassword}
                  style={{ background: 'none', border: 'none', color: '#0f172a', textDecoration: 'underline', cursor: 'pointer', fontWeight: 600 }}
                >
                  Reset password
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

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
