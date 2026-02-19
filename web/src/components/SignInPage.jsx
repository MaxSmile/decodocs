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
import { useAuth } from '../context/AuthContext.jsx';
import Card from './ui/Card.jsx';
import PageSection from './ui/PageSection.jsx';
import Notice from './ui/Notice.jsx';
import { toAuthErrorMessage } from '../lib/authErrorMessages.js';
import { trackAuthEvent } from '../lib/authTelemetry.js';

const providerBtnClass = 'dd-btn dd-btn-provider w-full justify-start';
const inputClass = 'dd-input';
const solidBtnClass = 'dd-btn dd-btn-solid w-full';
const textBtnClass =
  'bg-transparent text-sm font-semibold text-slate-900 underline decoration-slate-400 underline-offset-2 hover:text-slate-700';

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export default function SignInPage() {
  const {
    authState,
    auth,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithApple,
    signInWithEmail,
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

  const createGoogleProvider = () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  };

  const createAppleProvider = () => {
    const provider = new OAuthProvider('apple.com');
    provider.addScope('email');
    provider.addScope('name');
    return provider;
  };

  const createMicrosoftProvider = () => {
    const provider = new OAuthProvider('microsoft.com');
    provider.addScope('openid');
    provider.addScope('email');
    provider.addScope('profile');
    provider.setCustomParameters({ prompt: 'select_account' });
    return provider;
  };

  const runProvider = async (providerKey, provider, directSignIn) => {
    setStatus({ kind: 'loading', message: 'Opening sign-in…' });
    if (providerKey === 'google') {
      trackAuthEvent('auth_google_click');
    }

    try {
      if (!auth) throw new Error('Auth is not available');

      if (auth.currentUser) {
        await linkWithPopup(auth.currentUser, provider);
      } else if (directSignIn) {
        await directSignIn();
      } else {
        throw new Error('No active session. Refresh and try again.');
      }

      if (providerKey === 'google') {
        trackAuthEvent('auth_google_success');
      }
      setStatus({ kind: 'ok', message: 'Signed in. Your accounts are linked.' });
      navigate(postAuthPath);
    } catch (e) {
      const code = e?.code || '';
      if (code === 'auth/credential-already-in-use' || code === 'auth/email-already-in-use') {
        setStatus({
          kind: 'error',
          message:
            'That account is already used elsewhere. Please sign out and sign in with that provider, then link the others from your profile.',
        });
        return;
      }

      if (providerKey === 'google') {
        trackAuthEvent('auth_google_error', {
          auth_error_code: typeof code === 'string' ? code : 'unknown',
        });
      }
      setStatus({ kind: 'error', message: toAuthErrorMessage(e, 'Provider sign-in failed.') });
    }
  };

  const doEmailSignIn = async () => {
    setStatus({ kind: 'loading', message: 'Signing in…' });
    try {
      if (!email || !password) throw new Error('Email and password are required.');
      if (auth.currentUser && isAnon) {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        setStatus({ kind: 'ok', message: 'Email linked and signed in.' });
      } else {
        await signInWithEmail(email, password);
        setStatus({ kind: 'ok', message: 'Signed in.' });
      }
      navigate(postAuthPath);
    } catch (e) {
      const code = e?.code || '';
      if (
        code === 'auth/email-already-in-use' ||
        code === 'auth/account-exists-with-different-credential' ||
        code === 'auth/credential-already-in-use'
      ) {
        setStatus({
          kind: 'error',
          message: 'This email already has an account. Sign in with the existing method, then link providers in Profile.',
        });
        return;
      }
      setStatus({ kind: 'error', message: toAuthErrorMessage(e, 'Email sign-in failed.') });
    }
  };

  const header = intent === 'upgrade' ? 'Sign in to upgrade' : 'Sign in';

  useEffect(() => {
    if (authState.status === 'authenticated' && !isAnon) {
      navigate(postAuthPath, { replace: true });
    }
  }, [authState.status, isAnon, navigate, postAuthPath]);

  if (authState.status === 'authenticated' && !isAnon) {
    return <PageSection size="lg">Redirecting...</PageSection>;
  }

  return (
    <PageSection size="lg">
      <h1 className="dd-title">{header}</h1>
      <p className="dd-lead">
        We support Google, Email, Apple, and Microsoft. Linking is universal, you can attach multiple providers to one
        account.
      </p>
      {intent === 'upgrade' ? (
        <p className="mt-2 leading-relaxed text-blue-800">
          Next step after sign-in: start {upgradePlan === 'business' ? 'Business' : 'Pro'} checkout ({upgradeBilling}{' '}
          billing).
        </p>
      ) : null}

      {status.kind !== 'idle' ? (
        <Notice tone={status.kind === 'error' ? 'error' : status.kind === 'ok' ? 'success' : 'neutral'} className="mt-3.5">
          {status.message}
        </Notice>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-3.5 md:grid-cols-2">
        <Card>
          <div className="font-black">Continue with a provider</div>
          <div className="mt-3 grid gap-2.5">
            <button
              type="button"
              onClick={() => runProvider('google', createGoogleProvider(), signInWithGoogle)}
              className={providerBtnClass}
            >
              <FcGoogle size={20} />
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => runProvider('apple', createAppleProvider(), signInWithApple)}
              className={providerBtnClass}
            >
              <AiFillApple size={20} />
              Continue with Apple
            </button>
            <button
              type="button"
              onClick={() => runProvider('microsoft', createMicrosoftProvider(), signInWithMicrosoft)}
              className={providerBtnClass}
            >
              <FaMicrosoft size={20} />
              Continue with Microsoft
            </button>
          </div>
        </Card>

        <Card>
          <div className="font-black">Sign in with email</div>
          <div className="mt-2.5 grid gap-2.5">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              className={inputClass}
            />

            <div className="grid gap-2.5">
              <button type="button" onClick={doEmailSignIn} className={solidBtnClass}>
                Sign In
              </button>

              <div className="flex justify-end text-sm">
                <button type="button" onClick={() => navigate('/reset-password')} className={textBtnClass}>
                  Reset password
                </button>
              </div>
            </div>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/pricing" className="dd-link-strong">Back to pricing</Link>
        <Link to="/" className="dd-link-muted">Home</Link>
      </div>

      <Card className="mt-4 bg-slate-50">
        <details>
          <summary className="cursor-pointer font-black text-slate-900">Debug info</summary>
          <div className="mt-2 leading-7 text-slate-600">
            Status: <strong>{authState?.status}</strong>
            <br />
            UID: <code>{user?.uid || 'n/a'}</code>
            <br />
            Anonymous: <strong>{String(isAnon)}</strong>
          </div>
        </details>
      </Card>
    </PageSection>
  );
}
