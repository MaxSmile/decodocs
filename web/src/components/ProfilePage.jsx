import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { useAuth } from '../context/AuthContext.jsx';

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
    <div style={{ padding: '2.5rem 1.5rem', maxWidth: 900, margin: '0 auto' }}>
      <h1 style={{ marginTop: 0 }}>Profile</h1>
      <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>
        Manage linked accounts and subscription. Receipts and subscription management use Stripe Customer Portal.
      </p>

      {notice && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
          {notice}
        </div>
      )}

      <div style={{ marginTop: 16, padding: 16, borderRadius: 14, border: '1px solid #e2e8f0', background: '#fff' }}>
        <div style={{ fontWeight: 900 }}>Session</div>
        <div style={{ marginTop: 10, color: '#0f172a', lineHeight: 1.7 }}>
          Status: <strong>{authState?.status}</strong>
          <br />
          UID: <code>{user?.uid || 'n/a'}</code>
          <br />
          Anonymous: <strong>{String(!!user?.isAnonymous)}</strong>
        </div>

        <div style={{ marginTop: 12, color: '#475569' }}>
          Linked providers: {user?.providerData?.length ? (
            <ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>
              {user.providerData.map((p) => (
                <li key={p.providerId}><code>{p.providerId}</code>{p.email ? ` — ${p.email}` : ''}</li>
              ))}
            </ul>
          ) : (
            <span>none (anonymous)</span>
          )}
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => navigate('/sign-in')}
            style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
          >
            Link accounts
          </button>
          <button
            type="button"
            onClick={openBillingPortal}
            style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #0f172a', background: '#fff', fontWeight: 900, cursor: 'pointer' }}
          >
            Billing & receipts
          </button>
          <button
            type="button"
            onClick={doSignOut}
            style={{ padding: '10px 12px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 900, cursor: 'pointer' }}
          >
            Sign out
          </button>
        </div>
      </div>

      <div style={{ marginTop: 18, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/pricing" style={{ color: '#0f172a', fontWeight: 800 }}>Pricing</Link>
        <Link to="/view" style={{ color: '#475569', fontWeight: 700 }}>Analyze a PDF</Link>
      </div>
    </div>
  );
}
