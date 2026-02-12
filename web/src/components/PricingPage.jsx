import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const formatAUD = (amount) => {
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount} AUD`;
  }
};

const FeatureList = ({ items }) => (
  <ul style={{ margin: 0, paddingLeft: 18, color: '#0f172a', lineHeight: 1.7 }}>
    {items.map((t) => (
      <li key={t} style={{ marginBottom: 6 }}>{t}</li>
    ))}
  </ul>
);

export default function PricingPage() {
  const stripeMode = String(import.meta.env.VITE_STRIPE_MODE || 'test').toLowerCase();
  const isSandboxMode = stripeMode !== 'live';
  const navigate = useNavigate();
  const location = useLocation();
  const { authState } = useAuth();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialBilling = search.get('billing') === 'annual' ? 'annual' : 'monthly';
  const [billing, setBilling] = useState(initialBilling); // monthly | annual
  const [checkoutPlan, setCheckoutPlan] = useState(null); // pro | business | null
  const [notice, setNotice] = useState(null);
  const autoCheckoutStartedRef = useRef(false);

  const prices = useMemo(() => {
    const pro = billing === 'annual'
      ? { label: formatAUD(60), suffix: '/year' }
      : { label: formatAUD(5), suffix: '/month' };
    const business = billing === 'annual'
      ? { label: formatAUD(600), suffix: '/year' }
      : { label: formatAUD(50), suffix: '/month' };
    return { pro, business };
  }, [billing]);

  const startCheckout = async (plan, selectedBilling = billing) => {
    setNotice(null);
    setCheckoutPlan(plan);

    // Paid plans require a real account so Stripe entitlements map cleanly.
    if (!authState?.user || authState?.user?.isAnonymous) {
      const qp = new URLSearchParams({
        intent: 'upgrade',
        plan,
        billing: selectedBilling,
      });
      if (isSandboxMode) qp.set('sandbox', '1');
      navigate(`/sign-in?${qp.toString()}`);
      setCheckoutPlan(null);
      return;
    }

    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fns = getFunctions();
      const createSession = httpsCallable(fns, 'stripeCreateCheckoutSession');
      const resp = await createSession({ billing: selectedBilling, plan });
      const url = resp?.data?.url;
      if (!url) throw new Error('No checkout URL returned');
      window.location.assign(url);
    } catch (e) {
      setNotice(`Could not start Stripe checkout: ${e?.message || e}`);
      setCheckoutPlan(null);
    }
  };

  useEffect(() => {
    const stripeState = search.get('stripe');
    if (stripeState === 'cancel') {
      setNotice('Stripe checkout was canceled. Your account was not charged.');
      return;
    }
    if (stripeState === 'success') {
      setNotice('Stripe checkout completed. We are finalizing your subscription status from webhook events.');
      return;
    }
    if (isSandboxMode || search.get('sandbox') === '1') {
      setNotice('Sandbox mode is active. Use Stripe test cards only.');
      return;
    }
    setNotice(null);
  }, [isSandboxMode, search]);

  useEffect(() => {
    if (autoCheckoutStartedRef.current) return;
    if (search.get('autoCheckout') !== '1') return;

    const plan = search.get('plan') === 'business' ? 'business' : 'pro';
    const selectedBilling = search.get('billing') === 'annual' ? 'annual' : 'monthly';

    if (billing !== selectedBilling) {
      setBilling(selectedBilling);
    }
    autoCheckoutStartedRef.current = true;
    startCheckout(plan, selectedBilling);
  }, [authState?.user, billing, search]);

  const goToSignIn = () => navigate('/sign-in');

  const pageStyle = {
    padding: '2.5rem 1.5rem',
    maxWidth: 1100,
    margin: '0 auto',
  };

  const cardStyle = {
    border: '1px solid #e2e8f0',
    borderRadius: 14,
    background: '#fff',
    padding: 18,
  };

  const pillStyle = (active) => ({
    padding: '8px 12px',
    borderRadius: 999,
    border: `1px solid ${active ? '#0f172a' : '#e2e8f0'}`,
    background: active ? '#0f172a' : '#ffffff',
    color: active ? '#ffffff' : '#0f172a',
    fontWeight: 700,
    fontSize: 13,
    cursor: 'pointer',
  });

  return (
    <div style={pageStyle}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0 }}>Pricing</h1>
          <p style={{ marginTop: 10, marginBottom: 0, color: '#334155', lineHeight: 1.6 }}>
            Compare Free, Pro, and Business plans. Enterprise is available for larger teams.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <button type="button" onClick={() => setBilling('monthly')} style={pillStyle(billing === 'monthly')}>
            Monthly
          </button>
          <button type="button" onClick={() => setBilling('annual')} style={pillStyle(billing === 'annual')}>
            Annual
          </button>
        </div>
      </div>

      <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a', lineHeight: 1.65 }}>
        DecoDocs is publicly available for anonymous trial use. You can open a PDF and test the core experience instantly,
        then create a free account when you want higher daily limits and cross-device continuity.
      </div>

      {notice && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
          {notice}
        </div>
      )}

      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {/* Free */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Free</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{formatAUD(0)}<span style={{ color: '#64748b', fontWeight: 600, fontSize: 12 }}>/forever</span></div>
          </div>
          <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>
            Create an account to get a bigger daily budget and manage linked sign-in methods.
          </p>

          <button
            type="button"
            onClick={goToSignIn}
            style={{ width: '100%', marginTop: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
          >
            Continue for free
          </button>

          <div style={{ marginTop: 14 }}>
            <FeatureList items={[
              'AI analysis: 40k tokens/day per uid',
              'Text-only PDFs (no OCR)',
              'No storage with us (browser-only)',
              'Link providers (Google/Email/Apple/Microsoft)',
            ]} />
          </div>
        </div>

        {/* Pro */}
        <div style={{ ...cardStyle, borderColor: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Pro</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{prices.pro.label}<span style={{ color: '#64748b', fontWeight: 600, fontSize: 12 }}>{prices.pro.suffix}</span></div>
          </div>
          <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>
            OCR for scanned PDFs, unlimited analysis (for now), better model, and 5GB storage.
          </p>

          <button
            type="button"
            onClick={() => startCheckout('pro', billing)}
            disabled={checkoutPlan !== null}
            style={{ width: '100%', marginTop: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
          >
            {checkoutPlan === 'pro' ? 'Opening checkout...' : 'Upgrade to Pro'}
          </button>

          <div style={{ marginTop: 14 }}>
            <FeatureList items={[
              'Unlimited AI (until abuse policy exists)',
              'OCR / vision model for scanned PDFs',
              '5GB storage (Contabo VPS)',
              'Receipts + subscription management in /profile',
            ]} />
          </div>
        </div>

        {/* Business */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Business</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{prices.business.label}<span style={{ color: '#64748b', fontWeight: 600, fontSize: 12 }}>{prices.business.suffix}</span></div>
          </div>
          <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>
            Team plan for up to 5 worker accounts with shared billing and team visibility.
          </p>

          <button
            type="button"
            onClick={() => startCheckout('business', billing)}
            disabled={checkoutPlan !== null}
            style={{ width: '100%', marginTop: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
          >
            {checkoutPlan === 'business' ? 'Opening checkout...' : 'Start Business'}
          </button>

          <div style={{ marginTop: 14 }}>
            <FeatureList items={[
              'Everything in Pro',
              'Up to 5 worker accounts',
              'Shared billing + seat management',
              'Admin visibility across team docs',
            ]} />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 18, padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Enterprise</div>
        <div style={{ color: '#475569', lineHeight: 1.7 }}>
          Need more than <strong>5 worker accounts</strong>? Enterprise is for larger teams that need custom security,
          controls, and contracting. Contact us for seat-based pricing.
        </div>
        <div style={{ marginTop: 8 }}>
          <Link to="/contact" style={{ color: '#0f172a', fontWeight: 800 }}>Contact sales</Link>
        </div>
      </div>

      <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/view" style={{ color: '#0f172a', fontWeight: 800 }}>Start anonymous trial</Link>
        <Link to="/profile" style={{ color: '#0f172a', fontWeight: 800 }}>Go to profile</Link>
        <Link to="/terms" style={{ color: '#475569', fontWeight: 700 }}>Terms</Link>
        <Link to="/privacy" style={{ color: '#475569', fontWeight: 700 }}>Privacy</Link>
      </div>

      <div style={{ marginTop: 22, padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Notes</div>
        <div style={{ color: '#475569', lineHeight: 1.7 }}>
          We’ll prompt you to upgrade when you hit limits or when a scanned/OCR-required document is detected. Paid checkout
          requires a non-anonymous account, and account linking is handled via <code>/sign-in</code>.
        </div>
      </div>
    </div>
  );
}
