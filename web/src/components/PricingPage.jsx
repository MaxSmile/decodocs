import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const { authState } = useAuth();
  const [billing, setBilling] = useState('monthly'); // monthly | annual
  const [notice, setNotice] = useState(null);

  const proPrice = useMemo(() => {
    if (billing === 'annual') return { label: formatAUD(60), suffix: '/year' }; // 5*12; discount can be introduced later
    return { label: formatAUD(5), suffix: '/month' };
  }, [billing]);

  const startUpgrade = async () => {
    setNotice(null);

    // We always try to keep an anonymous uid around; if auth failed, fall back to sign-in.
    if (!authState?.user) {
      navigate('/sign-in?intent=upgrade');
      return;
    }

    try {
      const { getFunctions, httpsCallable } = await import('firebase/functions');
      const fns = getFunctions();
      const createSession = httpsCallable(fns, 'stripeCreateCheckoutSession');
      const resp = await createSession({ billing });
      const url = resp?.data?.url;
      if (!url) throw new Error('No checkout URL returned');
      window.location.assign(url);
    } catch (e) {
      setNotice(`Could not start Stripe checkout: ${e?.message || e}`);
    }
  };

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
            Three user types, one rule: pay only when your usage costs us money.
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

      {notice && (
        <div style={{ marginTop: 16, padding: 12, borderRadius: 12, background: '#fff7ed', border: '1px solid #fed7aa', color: '#9a3412' }}>
          {notice}
        </div>
      )}

      <div style={{ marginTop: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14 }}>
        {/* Anonymous */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontWeight: 800, fontSize: 16 }}>Anonymous</div>
            <div style={{ fontWeight: 800, fontSize: 18 }}>{formatAUD(0)}<span style={{ color: '#64748b', fontWeight: 600, fontSize: 12 }}>/forever</span></div>
          </div>
          <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>
            Try DecoDocs instantly. Minimal AI budget. No OCR. No storage.
          </p>

          <button
            type="button"
            onClick={() => navigate('/view')}
            style={{ width: '100%', marginTop: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #e2e8f0', background: '#fff', fontWeight: 800, cursor: 'pointer' }}
          >
            Start now
          </button>

          <div style={{ marginTop: 14 }}>
            <FeatureList items={[
              'AI analysis: 20k tokens per uid session',
              'Text-only PDFs (no OCR)',
              'No storage (browser-only)',
            ]} />
          </div>
        </div>

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
              'Link multiple providers (Google/Email/Apple/Microsoft)',
            ]} />
          </div>
        </div>

        {/* Pro */}
        <div style={{ ...cardStyle, borderColor: '#0f172a' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
            <div style={{ fontWeight: 900, fontSize: 16 }}>Pro</div>
            <div style={{ fontWeight: 900, fontSize: 18 }}>{proPrice.label}<span style={{ color: '#64748b', fontWeight: 600, fontSize: 12 }}>{proPrice.suffix}</span></div>
          </div>
          <p style={{ marginTop: 10, color: '#475569', lineHeight: 1.6 }}>
            OCR for scanned PDFs, unlimited analysis (for now), better model, and 5GB storage.
          </p>

          <button
            type="button"
            onClick={startUpgrade}
            style={{ width: '100%', marginTop: 8, padding: '10px 14px', borderRadius: 12, border: '1px solid #0f172a', background: '#0f172a', color: '#fff', fontWeight: 900, cursor: 'pointer' }}
          >
            Upgrade
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
      </div>

      <div style={{ marginTop: 22, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link to="/profile" style={{ color: '#0f172a', fontWeight: 800 }}>Go to profile</Link>
        <Link to="/terms" style={{ color: '#475569', fontWeight: 700 }}>Terms</Link>
        <Link to="/privacy" style={{ color: '#475569', fontWeight: 700 }}>Privacy</Link>
      </div>

      <div style={{ marginTop: 22, padding: 16, borderRadius: 12, background: '#f8fafc', border: '1px solid #e2e8f0' }}>
        <div style={{ fontWeight: 900, marginBottom: 8 }}>Notes</div>
        <div style={{ color: '#475569', lineHeight: 1.7 }}>
          We’ll prompt you to upgrade when you hit limits or when a scanned/OCR-required document is detected.
          Upgrade redirects to <code>/pricing</code>, and account linking is handled via <code>/sign-in</code>.
        </div>
      </div>
    </div>
  );
}
