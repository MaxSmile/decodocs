import React, { useMemo, useState } from 'react';
import SectionHeader from './SectionHeader.jsx';
import { pricingPlans } from '../../lib/landingData.js';

const formatPrice = (price) => {
  if (price === 0) return 'Free';
  return `$${price}`;
};

const Pricing = () => {
  const [billingCycle, setBillingCycle] = useState('monthly');

  const plans = useMemo(() => {
    return pricingPlans.map((plan) => {
      const price = billingCycle === 'monthly' ? plan.monthlyPrice : plan.annualPrice;
      return {
        ...plan,
        price,
        label:
          billingCycle === 'monthly'
            ? `${formatPrice(price)}/mo`
            : `${formatPrice(price)}/mo`
      };
    });
  }, [billingCycle]);

  return (
    <section id="pricing" className="px-6 py-16">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-10">
        <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
          <SectionHeader
            eyebrow="Pricing"
            title="Simple plans that scale with your review workload"
            description="Switch between monthly and annual billing. Annual plans include a discount for teams reviewing weekly."
            align="left"
          />
          <div className="flex items-center rounded-full border border-slate-200 bg-white p-1">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                billingCycle === 'monthly'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('annual')}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                billingCycle === 'annual'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-500'
              }`}
            >
              Annual
            </button>
          </div>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative flex h-full flex-col rounded-3xl border p-6 shadow-xl shadow-slate-900/5 ${
                plan.isPopular
                  ? 'border-slate-900 bg-slate-900 text-white'
                  : 'border-slate-100 bg-white'
              }`}
            >
              {plan.isPopular ? (
                <span className="absolute -top-4 left-6 rounded-full bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-900">
                  Most popular
                </span>
              ) : null}
              <h3 className="text-xl font-semibold">{plan.name}</h3>
              <p className={`mt-2 text-sm ${plan.isPopular ? 'text-white/80' : 'text-slate-500'}`}>
                {plan.description}
              </p>
              <div className="mt-6">
                <div className="flex items-end gap-2">
                  <span className="text-3xl font-semibold">{plan.label}</span>
                  {plan.price > 0 ? (
                    <span className={`text-xs ${plan.isPopular ? 'text-white/70' : 'text-slate-400'}`}>
                      billed {billingCycle}
                    </span>
                  ) : null}
                </div>
                {billingCycle === 'annual' && plan.price > 0 ? (
                  <p className={`mt-2 text-xs ${plan.isPopular ? 'text-white/70' : 'text-slate-400'}`}>
                    Save 20% with annual billing
                  </p>
                ) : null}
              </div>
              <ul className="mt-6 space-y-3 text-sm">
                {plan.highlights.map((feature) => (
                  <li key={feature} className="flex items-start gap-2">
                    <span className="mt-1 h-1.5 w-1.5 rounded-full bg-current" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className={`mt-8 w-full rounded-full px-4 py-3 text-sm font-semibold ${
                  plan.isPopular
                    ? 'bg-white text-slate-900'
                    : 'bg-slate-900 text-white'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
