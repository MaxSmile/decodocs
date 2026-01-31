import React from 'react';
import { Link } from 'react-router-dom';

const Hero = ({ onOpenPdf }) => {
  return (
    <section className="px-6 pt-20 pb-16">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-6">
          <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-slate-500">
            Modern document intelligence
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-slate-900 md:text-5xl">
            Decode documents before you sign them.
          </h1>
          <p className="text-lg text-slate-600">
            DecoDocs turns dense PDFs into clear decisions with AI summaries, risk flags, and
            evidence-backed explanations.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={onOpenPdf}
              className="rounded-full bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/25 transition hover:-translate-y-0.5"
            >
              Open a PDF
            </button>
            <Link
              to="/view"
              className="rounded-full border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 shadow-sm"
            >
              View the app
            </Link>
          </div>
          <div className="flex flex-wrap gap-4 text-sm text-slate-500">
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Free mode never stores files
            </span>
            <span className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-slate-900" />
              Pro adds private vaults
            </span>
          </div>
        </div>
        <div className="relative">
          <div className="absolute -left-6 top-6 h-24 w-24 rounded-2xl bg-[#fbd1b7] opacity-70" />
          <div className="relative rounded-3xl border border-white/60 bg-white/90 p-6 shadow-2xl shadow-slate-900/10">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>Contract Review</span>
              <span>12 pages</span>
            </div>
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-800">
                  <span className="font-semibold">Risk flagged:</span> Termination clause requires
                  90-day notice and carries a 3x fee.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4">
                <p className="text-sm text-slate-600">
                  Plain language: You must give three months notice or pay a penalty equal to three
                  months of fees.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-4 text-white">
                <p className="text-sm">
                  Suggested action: renegotiate the termination period or cap the penalty.
                </p>
              </div>
            </div>
            <div className="mt-6 flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs text-slate-500">
              <span>AI decode complete</span>
              <span className="font-semibold text-slate-900">Ready to review</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
