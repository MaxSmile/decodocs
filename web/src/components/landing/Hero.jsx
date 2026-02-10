import React from 'react';
import { Link } from 'react-router-dom';
import Button from '../ui/Button';

const Hero = ({ onOpenPdf }) => {
  return (
    <section id="hero" className="px-6 pt-24 pb-20 lg:pt-32 lg:pb-24">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-16 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="flex flex-col gap-8">
          <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm">
            Modern document intelligence
          </span>
          <h1 className="text-5xl font-bold tracking-tight text-slate-900 md:text-6xl leading-[1.1]">
            Decode documents <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
              before you sign.
            </span>
          </h1>
          <p className="text-xl text-slate-600 leading-relaxed max-w-xl">
            DecoDocs turns dense PDFs into clear decisions with AI summaries, risk flags, and
            evidence-backed explanations.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
            <Button
              variant="primary"
              size="lg"
              onClick={onOpenPdf}
              className="w-full sm:w-auto"
            >
              Analyze a Document
            </Button>
            <Button
              variant="secondary"
              size="lg"
              to="/view"
              className="w-full sm:w-auto"
            >
              View Demo
            </Button>
          </div>
          <div className="flex flex-wrap gap-6 text-sm font-medium text-slate-500 mt-2">
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
              Free mode never stores files
            </span>
            <span className="flex items-center gap-2.5">
              <span className="h-2.5 w-2.5 rounded-full bg-slate-900" />
              Pro includes vaults & history
            </span>
          </div>
        </div>

        <div className="relative">
          {/* Decorative blobs */}
          <div className="absolute -top-12 -right-12 h-64 w-64 rounded-full bg-purple-100 blur-3xl opacity-60 animate-float-slow" />
          <div className="absolute -bottom-12 -left-12 h-64 w-64 rounded-full bg-amber-100 blur-3xl opacity-60 animate-float-slow" style={{ animationDelay: '2s' }} />

          <div className="relative rounded-3xl border border-white/60 bg-white/80 backdrop-blur-xl p-8 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 transition-transform hover:scale-[1.01] duration-500">
            <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase tracking-wider mb-6">
              <span>Contract Review</span>
              <span>12 pages</span>
            </div>
            <div className="space-y-5">
              <div className="rounded-2xl bg-amber-50 p-5 border border-amber-100/50">
                <div className="flex gap-3 mb-2">
                  <div className="w-5 h-5 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-bold text-xs">!</div>
                  <span className="text-xs font-bold text-amber-700 uppercase tracking-wide pt-0.5">Risk Flagged</span>
                </div>
                <p className="text-base text-slate-800 leading-snug font-medium">
                  Termination clause requires 90-day notice and carries a 3x fee.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <div className="flex gap-3 mb-2">
                  <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-xs">i</div>
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide pt-0.5">Plain English</span>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  You must give three months notice or pay a penalty equal to three
                  months of fees.
                </p>
              </div>
              <div className="rounded-2xl bg-slate-900 p-5 text-white shadow-lg shadow-slate-900/10">
                <div className="flex gap-3 mb-2">
                  <div className="w-5 h-5 rounded-full bg-slate-700 flex items-center justify-center text-white font-bold text-xs">✓</div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wide pt-0.5">Recommendation</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Renegotiate the termination period to 30 days or cap the penalty at 1x fee.
                </p>
              </div>
            </div>
            <div className="mt-8 flex items-center justify-between rounded-2xl bg-slate-50 border border-slate-100 px-5 py-4 text-xs">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                AI decode complete
              </span>
              <span className="font-bold text-slate-900 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">Ready to review</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
