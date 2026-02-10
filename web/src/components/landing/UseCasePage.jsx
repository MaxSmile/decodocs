import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { HiCheckCircle, HiDocumentText, HiExclamation, HiShieldCheck, HiSparkles } from 'react-icons/hi';
import { useCases } from '../../lib/landingData.js';
import LandingLayout from './Layout.jsx';
import Button from '../ui/Button.jsx';

const UseCasePage = () => {
  const { slug } = useParams();
  const useCase = useCases.find((uc) => {
    const generatedSlug = uc.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    return uc.slug === slug || generatedSlug === slug;
  });
  const relatedUseCases = useCases.filter((uc) => uc.slug !== useCase?.slug).slice(0, 3);

  if (!useCase) {
    return (
      <LandingLayout>
        <div className="px-6 py-20">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-slate-900 mb-4">Use Case Not Found</h1>
            <p className="text-lg text-slate-600">The requested use case could not be found.</p>
            <div className="mt-10 grid gap-4 text-left sm:grid-cols-2">
              {useCases.map((entry) => (
                <Link
                  key={entry.slug || entry.title}
                  to={`/use-cases/${entry.slug || entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 no-underline transition hover:border-slate-300 hover:shadow-lg"
                >
                  <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">{entry.audience || 'Use case'}</p>
                  <p className="mt-1 text-lg font-semibold text-slate-900">{entry.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{entry.description}</p>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </LandingLayout>
    );
  }

  return (
    <LandingLayout>
      <div className="relative overflow-hidden px-6 pb-20 pt-12">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -right-20 -top-24 h-64 w-64 rounded-full bg-amber-200/40 blur-3xl" />
          <div className="absolute -left-24 top-56 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />
        </div>

        <div className="relative mx-auto flex w-full max-w-6xl flex-col gap-16">
          <section className="grid gap-8 rounded-3xl border border-slate-200/80 bg-white/85 p-8 shadow-xl shadow-slate-900/5 backdrop-blur-sm lg:grid-cols-[1.2fr_0.8fr] lg:p-12">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-slate-500">{useCase.audience}</p>
              <h1 className="mt-4 text-4xl font-bold leading-tight text-slate-900 lg:text-5xl">{useCase.heroTitle || useCase.title}</h1>
              <p className="mt-5 max-w-2xl text-lg leading-relaxed text-slate-600">{useCase.heroDescription || useCase.description}</p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button size="md" to={useCase.cta?.primaryTo || '/view'}>{useCase.cta?.primaryLabel || 'Open viewer'}</Button>
                <Button variant="outline" size="md" to={useCase.cta?.secondaryTo || '/contact'}>{useCase.cta?.secondaryLabel || 'Contact us'}</Button>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                <HiDocumentText className="h-5 w-5 text-slate-500" />
                Best document fit
              </div>
              <ul className="mt-4 space-y-3 list-none p-0">
                {useCase.documentTypes.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          <section className="grid gap-4 md:grid-cols-3">
            {useCase.highlights.map((item) => (
              <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{item.label}</p>
                <p className="mt-2 text-lg font-semibold text-slate-900">{item.value}</p>
              </div>
            ))}
          </section>

          <section>
            <div className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <HiExclamation className="h-5 w-5 text-amber-500" />
              Where teams get blocked
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {useCase.painPoints.map((point) => (
                <div key={point} className="rounded-2xl border border-slate-200 bg-white p-5 text-slate-700 shadow-sm">
                  {point}
                </div>
              ))}
            </div>
          </section>

          <section>
            <div className="mb-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
              <HiSparkles className="h-5 w-5 text-indigo-500" />
              Recommended workflow
            </div>
            <div className="grid gap-4 lg:grid-cols-3">
              {useCase.workflow.map((item, index) => (
                <div key={item.step} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Step {index + 1}</p>
                  <h3 className="mt-3 text-lg font-semibold text-slate-900">{item.step}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">{item.detail}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-8 lg:grid-cols-[1fr_1fr]">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-slate-500">
                <HiShieldCheck className="h-5 w-5 text-emerald-600" />
                What your team delivers
              </div>
              <ul className="mt-5 space-y-3 list-none p-0">
                {useCase.deliverables.map((item) => (
                  <li key={item} className="flex items-start gap-2 text-sm text-slate-700">
                    <HiCheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <p className="text-sm font-semibold text-slate-900">Need this workflow adapted to your team?</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-600">
                We can help shape your review flow around your real document mix and approval process.
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button size="sm" to="/contact">Talk to us</Button>
                <Button variant="outline" size="sm" to="/pricing">View pricing</Button>
              </div>
            </div>
          </section>

          <section>
            <p className="text-sm font-bold uppercase tracking-wider text-slate-500">Related use cases</p>
            <div className="mt-5 grid gap-4 md:grid-cols-3">
              {relatedUseCases.map((item) => (
                <Link
                  key={item.slug || item.title}
                  to={`/use-cases/${item.slug || item.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`}
                  className="rounded-2xl border border-slate-200 bg-white p-5 no-underline transition hover:border-slate-300 hover:shadow-lg"
                >
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{item.audience || 'Use case'}</p>
                  <p className="mt-2 text-lg font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-2 text-sm text-slate-600">{item.description}</p>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </div>
    </LandingLayout>
  );
};

export default UseCasePage;
