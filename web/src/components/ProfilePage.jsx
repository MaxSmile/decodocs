import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext.jsx';
import Card from './ui/Card.jsx';
import PageSection from './ui/PageSection.jsx';
import Notice from './ui/Notice.jsx';

const solidBtnClass = 'dd-btn dd-btn-solid';
const outlineBtnClass = 'dd-btn dd-btn-outline';
const subtleBtnClass = 'dd-btn dd-btn-subtle';

export default function ProfilePage() {
  const { authState, auth } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);

  const user = authState?.user;
  const [notice, setNotice] = useState(null);

  useEffect(() => {
    const stripeState = search.get('stripe');
    if (stripeState === 'success') {
      setNotice('Stripe checkout completed. If billing status does not update yet, wait a few seconds for webhook sync and refresh.');
      return;
    }
    if (stripeState === 'cancel') {
      setNotice('Stripe checkout was canceled.');
      return;
    }
    setNotice(null);
  }, [search]);

  const doSignOut = async () => {
    if (!auth) return;
    await signOut(auth);
    window.location.reload();
  };

  const openBillingPortal = async () => {
    setNotice(null);
    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fns = getFunctions();
      const createPortal = httpsCallable(fns, 'stripeCreatePortalSession');
      const resp = await createPortal({});
      const url = resp?.data?.url;
      if (!url) throw new Error('No portal URL returned');
      window.location.assign(url);
    } catch (e) {
      setNotice(`Could not open Stripe portal: ${e?.message || e}`);
    }
  };

  return (
    <PageSection size="lg">
      <h1 className="dd-title">Profile</h1>
      <p className="dd-lead">
        Manage linked accounts and subscription. Receipts and subscription management use Stripe Customer Portal.
      </p>

      {notice ? (
        <Notice tone="warning" className="mt-4">{notice}</Notice>
      ) : null}

      <Card className="mt-4">
        <div className="font-black">Session</div>
        <div className="mt-2.5 leading-7 text-slate-900">
          Status: <strong>{authState?.status}</strong>
          <br />
          UID: <code>{user?.uid || 'n/a'}</code>
          <br />
          Anonymous: <strong>{String(!!user?.isAnonymous)}</strong>
        </div>

        <div className="mt-3 text-slate-600">
          Linked providers:{' '}
          {user?.providerData?.length ? (
            <ul className="mb-0 mt-1.5 list-disc pl-5">
              {user.providerData.map((provider) => (
                <li key={provider.providerId}>
                  <code>{provider.providerId}</code>
                  {provider.email ? ` — ${provider.email}` : ''}
                </li>
              ))}
            </ul>
          ) : (
            <span>none (anonymous)</span>
          )}
        </div>

        <div className="mt-3.5 flex flex-wrap gap-2.5">
          <button type="button" onClick={() => navigate('/sign-in')} className={solidBtnClass}>
            Link accounts
          </button>
          <button type="button" onClick={openBillingPortal} className={outlineBtnClass}>
            Billing & receipts
          </button>
          <button type="button" onClick={doSignOut} className={subtleBtnClass}>
            Sign out
          </button>
        </div>
      </Card>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link to="/pricing" className="dd-link-strong">Pricing</Link>
        <Link to="/view" className="dd-link-muted">Analyze a PDF</Link>
      </div>
    </PageSection>
  );
}
