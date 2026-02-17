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

const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

export default function SignUpPage() {
  const {
    authState,
    auth,
    signInWithGoogle,
    signInWithMicrosoft,
    signInWithApple,
    signUpWithEmail,
  } = useAuth();
  const navigate = useNavigate();
  const q = useQuery();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
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

  useEffect(() => {
    if (authState.status === 'authenticated' && !isAnon) {
      navigate(postAuthPath, { replace: true });
    }
  }, [authState.status, isAnon, navigate, postAuthPath]);

  if (authState.status === 'authenticated' && !isAnon) {
    return <PageSection size="lg">Redirecting...</PageSection>;
  }

  const doEmailSignUp = async () => {
    setStatus({ kind: 'loading', message: 'Creating account…' });
    try {
      if (!email || !password || !confirmPassword) throw new Error('Email and passwords are required.');
      if (password !== confirmPassword) throw new Error('Passwords do not match.');
      if (String(password).length < 10) throw new Error('Password must be at least 10 characters.');
      if (auth.currentUser && isAnon) {
        const credential = EmailAuthProvider.credential(email, password);
        await linkWithCredential(auth.currentUser, credential);
        setStatus({ kind: 'ok', message: 'Account created and linked.' });
      } else {
        await signUpWithEmail(email, password);
        setStatus({ kind: 'ok', message: 'Account created.' });
      }
      navigate(postAuthPath);
    } catch (e) {
      setStatus({ kind: 'error', message: toAuthErrorMessage(e, 'Account creation failed.') });
    }
  };

  return (
    <PageSection size="lg">
      <h1 className="dd-title">Sign up</h1>
      <p className="dd-lead">Create your DecoDocs account to get started.</p>
      {intent === 'upgrade' ? (
        <p className="mt-2 leading-relaxed text-blue-800">
          Next step after sign-up: start {upgradePlan === 'business' ? 'Business' : 'Pro'} checkout ({upgradeBilling}{' '}
          billing).
        </p>
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
          <div className="font-black">Create account</div>
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
            <input
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm password"
              type="password"
              className={inputClass}
            />

            <button type="button" onClick={doEmailSignUp} className={solidBtnClass}>
              Create account
            </button>
          </div>

          <p className="mt-2.5 text-sm leading-relaxed text-slate-500">
            Recommended password minimum: 10 chars. If an email already exists and linking fails, sign out then sign in
            using that email.
          </p>
        </Card>
      </div>

      {status.kind !== 'idle' ? (
        <Notice tone={status.kind === 'error' ? 'error' : status.kind === 'ok' ? 'success' : 'neutral'} className="mt-3.5">
          {status.message}
        </Notice>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/pricing" className="dd-link-strong">Back to pricing</Link>
        <Link to="/" className="dd-link-muted">Home</Link>
      </div>

      <Card className="mt-4 bg-slate-50">
        <div className="mb-1.5 font-black">Current session</div>
        <div className="leading-7 text-slate-600">
          Status: <strong>{authState?.status}</strong>
          <br />
          UID: <code>{user?.uid || 'n/a'}</code>
          <br />
          Anonymous: <strong>{String(isAnon)}</strong>
        </div>
      </Card>
    </PageSection>
  );
}
