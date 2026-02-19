import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Card from './ui/Card.jsx';
import PageSection from './ui/PageSection.jsx';
import Notice from './ui/Notice.jsx';
import { toAuthErrorMessage } from '../lib/authErrorMessages.js';

const inputClass = 'dd-input';
const solidBtnClass = 'dd-btn dd-btn-solid w-full';

export default function ResetPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState({ kind: 'idle', message: '' });

  const onSubmit = async () => {
    setStatus({ kind: 'loading', message: 'Sending reset email…' });
    try {
      if (!email) throw new Error('Enter your email first.');
      await resetPassword(email);
      setStatus({ kind: 'ok', message: 'Password reset email sent (if the account exists).' });
    } catch (e) {
      setStatus({ kind: 'error', message: toAuthErrorMessage(e, 'Password reset failed.') });
    }
  };

  return (
    <PageSection size="lg">
      <h1 className="dd-title">Reset password</h1>
      <p className="dd-lead">Enter your account email and we will send a reset link.</p>

      {status.kind !== 'idle' ? (
        <Notice tone={status.kind === 'error' ? 'error' : status.kind === 'ok' ? 'success' : 'neutral'} className="mt-3.5">
          {status.message}
        </Notice>
      ) : null}

      <div className="mt-4 max-w-xl">
        <Card>
          <div className="font-black">Email</div>
          <div className="mt-2.5 grid gap-2.5">
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              className={inputClass}
            />
            <button type="button" onClick={onSubmit} className={solidBtnClass}>
              Send reset email
            </button>
          </div>
        </Card>
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/sign-in" className="dd-link-strong">Back to sign in</Link>
        <Link to="/" className="dd-link-muted">Home</Link>
      </div>
    </PageSection>
  );
}
