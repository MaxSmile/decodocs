import React from 'react';
import Button from '../ui/Button';

const Hero = ({ onOpenPdf }) => {
  return (
    <section id="hero" className="px-5 pb-14 pt-12 sm:px-6 sm:pb-16 sm:pt-16 lg:pb-24 lg:pt-28">
      <div className="mx-auto grid w-full max-w-6xl items-center gap-10 sm:gap-12 lg:grid-cols-[1.1fr_0.9fr] lg:gap-16">
        <div className="flex flex-col gap-5 sm:gap-6 lg:gap-8">
          <span className="w-fit rounded-full border border-slate-200 bg-white px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-slate-600 shadow-sm">
            Modern document intelligence
          </span>
          <h1 className="text-4xl font-bold leading-[1.08] tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
            Decode documents <br className="hidden lg:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-slate-900 to-slate-600">
              before you sign.
            </span>
          </h1>
          <p className="max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg lg:text-xl">
            DecoDocs turns dense PDFs into clear decisions with AI summaries, risk flags, and
            evidence-backed explanations.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={onOpenPdf}
              className="w-full sm:w-auto"
            >
              Analyse a PDF Document
            </Button>
            <Button
              variant="secondary"
              size="lg"
              to="/edit"
              className="w-full sm:w-auto"
            >
              Correct a PDF Document
            </Button>
          </div>
          <div className="mt-1 flex flex-wrap gap-3 text-xs font-medium text-slate-500 sm:mt-2 sm:gap-6 sm:text-sm">
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

        <div className="relative mx-auto w-full max-w-[32rem] overflow-hidden rounded-3xl max-[390px]:max-h-[25rem] sm:max-h-[30rem] lg:max-h-none">
          {/* Decorative blobs */}
          <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-purple-100 opacity-60 blur-3xl animate-float-slow sm:-right-12 sm:-top-12 sm:h-64 sm:w-64" />
          <div className="absolute -bottom-8 -left-8 h-48 w-48 rounded-full bg-amber-100 opacity-60 blur-3xl animate-float-slow sm:-bottom-12 sm:-left-12 sm:h-64 sm:w-64" style={{ animationDelay: '2s' }} />

          <div className="relative rounded-3xl border border-white/60 bg-white/80 p-4 shadow-2xl shadow-slate-900/10 ring-1 ring-slate-900/5 backdrop-blur-xl transition-transform duration-500 hover:scale-[1.01] sm:p-6 lg:p-8">
            <div className="mb-4 flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:mb-6 sm:text-xs">
              <span>Contract Review</span>
              <span>12 pages</span>
            </div>
            <div className="space-y-3 sm:space-y-4 lg:space-y-5">
              <div className="rounded-2xl border border-amber-100/50 bg-amber-50 p-4 sm:p-5">
                <div className="mb-2 flex gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-100 text-xs font-bold text-amber-600">!</div>
                  <span className="pt-0.5 text-xs font-bold uppercase tracking-wide text-amber-700">Risk Flagged</span>
                </div>
                <p className="text-sm font-medium leading-snug text-slate-800 sm:text-base">
                  Termination clause requires 90-day notice and carries a 3x fee.
                </p>
              </div>
              <div className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm sm:p-5">
                <div className="mb-2 flex gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600">i</div>
                  <span className="pt-0.5 text-xs font-bold uppercase tracking-wide text-slate-500">Plain English</span>
                </div>
                <p className="text-xs leading-relaxed text-slate-600 sm:text-sm">
                  You must give three months notice or pay a penalty equal to three
                  months of fees.
                </p>
              </div>
              <div className="hidden rounded-2xl bg-slate-900 p-5 text-white shadow-lg shadow-slate-900/10 sm:block">
                <div className="mb-2 flex gap-3">
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white">✓</div>
                  <span className="pt-0.5 text-xs font-bold uppercase tracking-wide text-slate-400">Recommendation</span>
                </div>
                <p className="text-sm font-medium leading-relaxed">
                  Renegotiate the termination period to 30 days or cap the penalty at 1x fee.
                </p>
              </div>
            </div>
            <div className="mt-4 flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3 text-[11px] sm:mt-6 sm:px-5 sm:py-4 sm:text-xs lg:mt-8">
              <span className="flex items-center gap-2 text-slate-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                AI decode complete
              </span>
              <span className="rounded-full border border-slate-200 bg-white px-2.5 py-1 font-bold text-slate-900 shadow-sm sm:px-3">Ready to review</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
