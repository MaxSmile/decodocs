import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Card from './ui/Card.jsx';
import PageSection from './ui/PageSection.jsx';
import Notice from './ui/Notice.jsx';

const formatAUD = (amount) => {
  try {
    return new Intl.NumberFormat('en-AU', { style: 'currency', currency: 'AUD', maximumFractionDigits: 0 }).format(amount);
  } catch {
    return `$${amount} AUD`;
  }
};

const primaryBtnClass = 'dd-btn dd-btn-solid mt-2 w-full';

const billingPillClass = (active) => [
  'dd-pill',
  active ? 'dd-pill-active' : '',
].join(' ');

const FeatureList = ({ items }) => (
  <ul className="m-0 list-disc pl-5 text-slate-900 leading-7">
    {items.map((text) => (
      <li key={text} className="mb-1.5">{text}</li>
    ))}
  </ul>
);

export default function PricingPage() {
  const stripeMode = String(import.meta.env.VITE_STRIPE_MODE || 'test').toLowerCase();
  const isSandboxMode = stripeMode !== 'live';
  const navigate = useNavigate();
  const location = useLocation();
  const { authState, app } = useAuth();
  const search = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const initialBilling = search.get('billing') === 'annual' ? 'annual' : 'monthly';
  const [billing, setBilling] = useState(initialBilling);
  const [checkoutPlan, setCheckoutPlan] = useState(null);
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
      const fns = app ? getFunctions(app) : null;
      if (!fns) throw new Error('Checkout unavailable (Firebase not ready).');
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

  return (
    <PageSection size="xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="dd-title">Pricing</h1>
          <p className="dd-lead mb-0">
            Compare Free, Pro, and Business plans. Enterprise is available for larger teams.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button type="button" onClick={() => setBilling('monthly')} className={billingPillClass(billing === 'monthly')}>
            Monthly
          </button>
          <button type="button" onClick={() => setBilling('annual')} className={billingPillClass(billing === 'annual')}>
            Annual
          </button>
        </div>
      </div>

      <Notice tone="info" className="mt-4 text-base">
        DecoDocs is publicly available for anonymous trial use. You can open a PDF and test the core experience instantly,
        then create a free account when you want higher daily limits and cross-device continuity.
      </Notice>

      {notice ? (
        <Notice tone="warning" className="mt-4">{notice}</Notice>
      ) : null}

      <div className="mt-5 grid grid-cols-1 gap-3.5 md:grid-cols-2 xl:grid-cols-3">
        <Card>
          <div className="flex items-baseline justify-between">
            <div className="text-base font-extrabold">Free</div>
            <div className="text-lg font-extrabold">
              {formatAUD(0)}
              <span className="ml-0.5 text-xs font-semibold text-slate-500">/forever</span>
            </div>
          </div>
          <p className="mt-2.5 leading-relaxed text-slate-600">
            Create an account to get a bigger daily budget and manage linked sign-in methods.
          </p>

          <button type="button" onClick={goToSignIn} className={primaryBtnClass}>
            Continue for free
          </button>

          <div className="mt-3.5">
            <FeatureList
              items={[
                'AI analysis budget: 40k tokens/day per uid',
                'Text-only PDFs (no OCR)',
                'No storage with us (browser-only)',
                'Link providers (Google/Email/Apple/Microsoft)',
              ]}
            />
          </div>
        </Card>

        <Card className="border-slate-900">
          <div className="flex items-baseline justify-between">
            <div className="text-base font-black">Pro</div>
            <div className="text-lg font-black">
              {prices.pro.label}
              <span className="ml-0.5 text-xs font-semibold text-slate-500">{prices.pro.suffix}</span>
            </div>
          </div>
          <p className="mt-2.5 leading-relaxed text-slate-600">
            OCR for scanned PDFs, no token cap enforced today (fair use), better model, and 5GB storage.
          </p>

          <button
            type="button"
            onClick={() => startCheckout('pro', billing)}
            disabled={checkoutPlan !== null}
            className={primaryBtnClass}
          >
            {checkoutPlan === 'pro' ? 'Opening checkout...' : 'Upgrade to Pro'}
          </button>

          <div className="mt-3.5">
            <FeatureList
              items={[
                'No token cap enforced today (fair use)',
                'OCR / vision model for scanned PDFs',
                '5GB storage (Contabo VPS)',
                'Receipts + subscription management in /profile',
              ]}
            />
          </div>
        </Card>

        <Card>
          <div className="flex items-baseline justify-between">
            <div className="text-base font-black">Business</div>
            <div className="text-lg font-black">
              {prices.business.label}
              <span className="ml-0.5 text-xs font-semibold text-slate-500">{prices.business.suffix}</span>
            </div>
          </div>
          <p className="mt-2.5 leading-relaxed text-slate-600">
            Team plan for up to 5 worker accounts with shared billing and team visibility.
          </p>

          <button
            type="button"
            onClick={() => startCheckout('business', billing)}
            disabled={checkoutPlan !== null}
            className={primaryBtnClass}
          >
            {checkoutPlan === 'business' ? 'Opening checkout...' : 'Start Business'}
          </button>

          <div className="mt-3.5">
            <FeatureList
              items={[
                'Everything in Pro',
                'Up to 5 worker accounts',
                'Shared billing + seat management',
                'Admin visibility across team docs',
              ]}
            />
          </div>
        </Card>
      </div>

      <Card className="mt-4 bg-slate-50">
        <div className="mb-2 font-black">Enterprise</div>
        <div className="leading-7 text-slate-600">
          Need more than <strong>5 worker accounts</strong>? Enterprise is for larger teams that need custom security,
          controls, and contracting. Contact us for seat-based pricing.
        </div>
        <div className="mt-2">
          <Link to="/contact" className="dd-link-strong">Contact sales</Link>
        </div>
      </Card>

      <div className="mt-5 flex flex-wrap gap-3">
        <Link to="/view" className="dd-link-strong">Start anonymous trial</Link>
        <Link to="/profile" className="dd-link-strong">Go to profile</Link>
        <a href="/terms" className="dd-link-muted">Terms</a>
        <a href="/privacy" className="dd-link-muted">Privacy</a>
      </div>

      <Card className="mt-5 bg-slate-50">
        <div className="mb-2 font-black">Notes</div>
        <div className="leading-7 text-slate-600">
          Anonymous trial use is limited to 20k tokens per uid (total). Free accounts have a 40k tokens/day budget.
          Limits are token-based (not per-click). Larger documents consume more of your budget, so the number of full
          analyses you can run varies by size. We&apos;ll prompt you to upgrade when you hit limits or when a scanned/OCR
          document is detected. Paid checkout requires a non-anonymous account, and account linking is handled via{' '}
          <code>/sign-in</code>.
        </div>
      </Card>
    </PageSection>
  );
}
